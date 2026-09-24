from django.utils import timezone
from rest_framework import serializers

from accounts.models import User

from .models import Bill, Payment


class BillSerializer(
    serializers.ModelSerializer
):

    patient_name = (
        serializers.SerializerMethodField()
    )

    created_at_display = (
        serializers.SerializerMethodField()
    )

    amount_paid = serializers.SerializerMethodField()
    amount_due = serializers.SerializerMethodField()


    class Meta:

        model = Bill

        fields = [
            "id",
            "patient",
            "patient_name",
            "invoice_number",
            "description",
            "amount",
            "amount_paid",
            "amount_due",
            "payment_status",
            "created_at",
            "created_at_display",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "patient_name",
            "invoice_number",
            "amount_paid",
            "amount_due",
            "created_at",
            "created_at_display",
            "updated_at",
        ]


    def get_patient_name(
        self,
        obj,
    ):

        name = (
            obj.patient
            .get_full_name()
        )

        return (
            name or
            obj.patient.username
        )


    def get_created_at_display(
        self,
        obj,
    ):

        return timezone.localtime(
            obj.created_at
        ).strftime(
            "%d %b %Y"
        )


    def get_amount_paid(self, obj):
        from django.db.models import Sum
        total = (
            obj.payments
            .filter(status=Payment.Status.PAID)
            .aggregate(total=Sum("amount"))
            .get("total")
        )
        return str(total or 0)

    def get_amount_due(self, obj):
        from decimal import Decimal
        paid = Decimal(self.get_amount_paid(obj))
        due = obj.amount - paid
        return str(max(due, Decimal("0.00")))


    def validate_patient(
        self,
        value,
    ):

        if (
            value.role !=
            User.Role.PATIENT
        ):

            raise serializers.ValidationError(
                "Selected user is not a patient."
            )

        return value

class PaymentSerializer(serializers.ModelSerializer):

    invoice_number = serializers.CharField(
        source="bill.invoice_number",
        read_only=True,
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "bill",
            "invoice_number",
            "amount",
            "currency",
            "status",
            "gateway",
            "gateway_order_id",
            "gateway_payment_id",
            "created_at",
            "paid_at",
        ]
        read_only_fields = fields
