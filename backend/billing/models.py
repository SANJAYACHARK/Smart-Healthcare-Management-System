from django.conf import settings
from django.db import models


class Bill(models.Model):

    class PaymentStatus(
        models.TextChoices
    ):

        UNPAID = (
            "UNPAID",
            "Unpaid",
        )

        PARTIAL = (
            "PARTIAL",
            "Partial",
        )

        PAID = (
            "PAID",
            "Paid",
        )


    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bills",
    )

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
    )

    description = models.CharField(
        max_length=255,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=
            PaymentStatus.choices,
        default=
            PaymentStatus.UNPAID,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )


    class Meta:

        ordering = [
            "-created_at",
        ]


    def save(
        self,
        *args,
        **kwargs,
    ):

        if not self.invoice_number:

            last_bill = (
                Bill.objects
                .order_by(
                    "-id"
                )
                .first()
            )

            next_number = (
                last_bill.id + 1
                if last_bill
                else 1
            )

            self.invoice_number = (
                f"INV-{next_number:06d}"
            )

        super().save(
            *args,
            **kwargs,
        )


    def __str__(self):

        return (
            f"{self.invoice_number} - "
            f"{self.patient.username}"
        )

# ============================================================
# ONLINE PAYMENT TRANSACTION
# ============================================================

class Payment(models.Model):

    class Status(models.TextChoices):
        CREATED = ("CREATED", "Created")
        PAID = ("PAID", "Paid")
        FAILED = ("FAILED", "Failed")
        REFUNDED = ("REFUNDED", "Refunded")

    bill = models.ForeignKey(
        Bill,
        on_delete=models.PROTECT,
        related_name="payments",
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bill_payments",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED,
    )

    gateway = models.CharField(
        max_length=30,
        default="RAZORPAY",
    )

    gateway_order_id = models.CharField(
        max_length=100,
        unique=True,
    )

    gateway_payment_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    gateway_signature = models.CharField(
        max_length=255,
        blank=True,
    )

    failure_reason = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["bill", "status"]),
            models.Index(fields=["patient", "status"]),
        ]

    def __str__(self):
        return (
            f"{self.gateway_order_id} - "
            f"{self.bill.invoice_number} - "
            f"{self.status}"
        )

