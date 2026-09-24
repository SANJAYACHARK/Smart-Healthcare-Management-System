from rest_framework import status
from django.db import transaction
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    IsPatientRole,
    IsReceptionistRole,
)

from .models import Bill, Payment
from .serializers import (
    BillSerializer,
    PaymentSerializer,
)


from notifications.events import (
    notify_in_app_patient_bill_created,
    notify_in_app_patient_bill_status,
)


# ============================================================
# PATIENT - VIEW BILLS
# ============================================================

class PatientBillListView(
    APIView
):

    permission_classes = [
        IsPatientRole
    ]


    def get(self, request):

        bills = (
            Bill.objects
            .select_related(
                "patient"
            )
            .filter(
                patient=request.user
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = (
            BillSerializer(
                bills,
                many=True,
            )
        )

        return Response(
            {
                "count":
                    bills.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# RECEPTIONIST - LIST / CREATE
# ============================================================

class ReceptionistBillListCreateView(
    APIView
):

    permission_classes = [
        IsReceptionistRole
    ]


    def get(self, request):

        bills = (
            Bill.objects
            .select_related(
                "patient"
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = (
            BillSerializer(
                bills,
                many=True,
            )
        )

        return Response(
            {
                "count":
                    bills.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


    def post(self, request):

        serializer = (
            BillSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        bill = serializer.save()


        notify_in_app_patient_bill_created(
            bill
        )


        return Response(
            {
                "message":
                    "Bill created successfully.",

                "bill":
                    BillSerializer(
                        bill
                    ).data,
            },
            status=
                status.HTTP_201_CREATED,
        )


class ReceptionistBillDetailView(
    APIView
):

    permission_classes = [
        IsReceptionistRole
    ]

    @transaction.atomic
    def patch(
        self,
        request,
        bill_id,
    ):
        """
        Record an OFFLINE/CASH payment.

        A receptionist can no longer directly force a bill to PAID/PARTIAL.
        Bill status is derived from successful Payment rows, the same source
        of truth used by Razorpay.
        """
        bill = (
            Bill.objects
            .select_for_update()
            .filter(id=bill_id)
            .first()
        )

        if not bill:
            return Response(
                {"detail": "Bill not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        raw_amount = request.data.get("amount")

        if raw_amount in (None, ""):
            return Response(
                {
                    "detail": (
                        "amount is required. "
                        "Record the actual offline payment instead of "
                        "manually changing payment_status."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(raw_amount))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"detail": "Enter a valid payment amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        paid = _paid_total(bill)
        amount_due = bill.amount - paid

        if amount <= Decimal("0.00"):
            return Response(
                {"detail": "Payment amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount_due <= Decimal("0.00"):
            _sync_bill_payment_status(bill)
            return Response(
                {"detail": "This bill is already fully paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > amount_due:
            return Response(
                {
                    "detail": (
                        f"Payment cannot exceed the outstanding amount "
                        f"of {amount_due:.2f}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            bill=bill,
            patient=bill.patient,
            amount=amount,
            currency="INR",
            status=Payment.Status.PAID,
            gateway="OFFLINE",
            gateway_order_id=(
                f"OFFLINE-{bill.id}-{timezone.now().strftime('%Y%m%d%H%M%S%f')}"
            ),
            paid_at=timezone.now(),
        )

        _sync_bill_payment_status(bill)

        return Response(
            {
                "message": "Offline payment recorded successfully.",
                "bill": BillSerializer(bill).data,
                "payment": PaymentSerializer(payment).data,
            },
            status=status.HTTP_200_OK,
        )



# ============================================================
# RAZORPAY PAYMENT GATEWAY
# ============================================================

import hashlib
import hmac
import json
import os
from django.db.models import Sum
from rest_framework.permissions import AllowAny


def _paid_total(bill):
    return (
        bill.payments
        .filter(status=Payment.Status.PAID)
        .aggregate(total=Sum("amount"))
        .get("total")
        or Decimal("0.00")
    )


def _sync_bill_payment_status(bill):
    paid = _paid_total(bill)
    previous_status = bill.payment_status

    if paid <= Decimal("0.00"):
        new_status = Bill.PaymentStatus.UNPAID
    elif paid >= bill.amount:
        new_status = Bill.PaymentStatus.PAID
    else:
        new_status = Bill.PaymentStatus.PARTIAL

    if new_status != previous_status:
        bill.payment_status = new_status
        bill.save(
            update_fields=[
                "payment_status",
                "updated_at",
            ]
        )

        notify_in_app_patient_bill_status(
            bill,
            previous_status=previous_status,
        )

    return paid


def _razorpay_client():
    try:
        import razorpay
    except ImportError as exc:
        raise RuntimeError(
            'Razorpay SDK is not installed. Run: pip install razorpay'
        ) from exc

    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()

    if not key_id or not key_secret:
        raise RuntimeError(
            "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured."
        )

    return razorpay.Client(
        auth=(
            key_id,
            key_secret,
        )
    )


class PatientCreatePaymentOrderView(APIView):

    permission_classes = [
        IsPatientRole
    ]

    def post(
        self,
        request,
        bill_id,
    ):
        bill = (
            Bill.objects
            .filter(
                id=bill_id,
                patient=request.user,
            )
            .first()
        )

        if not bill:
            return Response(
                {"detail": "Bill not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        paid = _paid_total(bill)
        amount_due = bill.amount - paid

        if amount_due <= Decimal("0.00"):
            _sync_bill_payment_status(bill)
            return Response(
                {"detail": "This bill is already fully paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requested_amount = request.data.get("amount")

        if requested_amount in (None, ""):
            amount = amount_due
        else:
            try:
                amount = Decimal(str(requested_amount))
            except (InvalidOperation, TypeError, ValueError):
                return Response(
                    {"detail": "Invalid payment amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        amount = amount.quantize(Decimal("0.01"))

        if amount <= Decimal("0.00"):
            return Response(
                {"detail": "Payment amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > amount_due:
            return Response(
                {
                    "detail":
                        f"Payment cannot exceed the outstanding amount of ₹{amount_due}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = _razorpay_client()

            amount_paise = int(
                amount * Decimal("100")
            )

            order = client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": bill.invoice_number[:40],
                    "notes": {
                        "bill_id": str(bill.id),
                        "invoice_number": bill.invoice_number,
                        "patient_id": str(request.user.id),
                    },
                }
            )
        except Exception as exc:
            return Response(
                {
                    "detail":
                        f"Unable to create payment order: {str(exc)}"
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment = Payment.objects.create(
            bill=bill,
            patient=request.user,
            amount=amount,
            currency="INR",
            status=Payment.Status.CREATED,
            gateway="RAZORPAY",
            gateway_order_id=order["id"],
        )

        return Response(
            {
                "message": "Payment order created successfully.",
                "key_id": os.getenv("RAZORPAY_KEY_ID", "").strip(),
                "order_id": order["id"],
                "amount": amount_paise,
                "amount_display": str(amount),
                "currency": "INR",
                "invoice_number": bill.invoice_number,
                "description": bill.description,
                "payment": PaymentSerializer(payment).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PatientVerifyPaymentView(APIView):

    permission_classes = [
        IsPatientRole
    ]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get("razorpay_order_id")
        payment_id = request.data.get("razorpay_payment_id")
        signature = request.data.get("razorpay_signature")

        if not all([order_id, payment_id, signature]):
            return Response(
                {"detail": "Incomplete payment verification data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = (
            Payment.objects
            .select_for_update()
            .select_related("bill", "patient")
            .filter(
                gateway_order_id=order_id,
                patient=request.user,
            )
            .first()
        )

        if not payment:
            return Response(
                {"detail": "Payment order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status == Payment.Status.PAID:
            return Response(
                {
                    "message": "Payment already verified.",
                    "payment": PaymentSerializer(payment).data,
                    "bill": BillSerializer(payment.bill).data,
                },
                status=status.HTTP_200_OK,
            )

        try:
            client = _razorpay_client()
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": order_id,
                    "razorpay_payment_id": payment_id,
                    "razorpay_signature": signature,
                }
            )
        except Exception:
            payment.status = Payment.Status.FAILED
            payment.gateway_payment_id = payment_id or ""
            payment.gateway_signature = signature or ""
            payment.failure_reason = "Payment signature verification failed."
            payment.save(
                update_fields=[
                    "status",
                    "gateway_payment_id",
                    "gateway_signature",
                    "failure_reason",
                    "updated_at",
                ]
            )

            return Response(
                {"detail": "Payment verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = Payment.Status.PAID
        payment.gateway_payment_id = payment_id
        payment.gateway_signature = signature
        payment.failure_reason = ""
        payment.paid_at = timezone.now()
        payment.save(
            update_fields=[
                "status",
                "gateway_payment_id",
                "gateway_signature",
                "failure_reason",
                "paid_at",
                "updated_at",
            ]
        )

        _sync_bill_payment_status(
            payment.bill
        )

        return Response(
            {
                "message": "Payment verified successfully.",
                "payment": PaymentSerializer(payment).data,
                "bill": BillSerializer(payment.bill).data,
            },
            status=status.HTTP_200_OK,
        )


class PatientBillPaymentListView(APIView):

    permission_classes = [
        IsPatientRole
    ]

    def get(
        self,
        request,
        bill_id,
    ):
        bill = (
            Bill.objects
            .filter(
                id=bill_id,
                patient=request.user,
            )
            .first()
        )

        if not bill:
            return Response(
                {"detail": "Bill not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        payments = (
            Payment.objects
            .filter(
                bill=bill,
                patient=request.user,
            )
            .order_by("-created_at")
        )

        return Response(
            {
                "count": payments.count(),
                "results": PaymentSerializer(
                    payments,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class RazorpayWebhookView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        secret = os.getenv(
            "RAZORPAY_WEBHOOK_SECRET",
            "",
        ).strip()

        if not secret:
            return Response(
                {"detail": "Webhook is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        signature = request.headers.get(
            "X-Razorpay-Signature",
            "",
        )

        raw_body = request.body

        expected = hmac.new(
            secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        if not signature or not hmac.compare_digest(
            expected,
            signature,
        ):
            return Response(
                {"detail": "Invalid webhook signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = json.loads(
                raw_body.decode("utf-8")
            )
        except (json.JSONDecodeError, UnicodeDecodeError):
            return Response(
                {"detail": "Invalid webhook payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event = payload.get("event")

        if event != "payment.captured":
            return Response(
                {"received": True},
                status=status.HTTP_200_OK,
            )

        entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        order_id = entity.get("order_id")
        gateway_payment_id = entity.get("id")

        if not order_id or not gateway_payment_id:
            return Response(
                {"received": True},
                status=status.HTTP_200_OK,
            )

        with transaction.atomic():
            payment = (
                Payment.objects
                .select_for_update()
                .select_related("bill")
                .filter(
                    gateway_order_id=order_id
                )
                .first()
            )

            if not payment:
                return Response(
                    {"received": True},
                    status=status.HTTP_200_OK,
                )

            if payment.status != Payment.Status.PAID:
                payment.status = Payment.Status.PAID
                payment.gateway_payment_id = gateway_payment_id
                payment.failure_reason = ""
                payment.paid_at = timezone.now()
                payment.save(
                    update_fields=[
                        "status",
                        "gateway_payment_id",
                        "failure_reason",
                        "paid_at",
                        "updated_at",
                    ]
                )

                _sync_bill_payment_status(
                    payment.bill
                )

        return Response(
            {"received": True},
            status=status.HTTP_200_OK,
        )

