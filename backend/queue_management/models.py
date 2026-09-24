from django.conf import settings
from django.db import models
from django.utils import timezone


class QueueTicket(models.Model):

    class Status(models.TextChoices):
        WAITING = "WAITING", "Waiting"
        CALLED = "CALLED", "Called"
        IN_SERVICE = "IN_SERVICE", "In Consultation"
        COMPLETED = "COMPLETED", "Completed"
        SKIPPED = "SKIPPED", "Skipped"
        CANCELLED = "CANCELLED", "Cancelled"

    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.CASCADE,
        related_name="queue_ticket",
    )

    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.PROTECT,
        related_name="queue_tickets",
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="queue_tickets",
    )

    queue_date = models.DateField(
        default=timezone.localdate,
        db_index=True,
    )

    token_number = models.PositiveIntegerField()

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.WAITING,
        db_index=True,
    )

    checked_in_at = models.DateTimeField(
        default=timezone.now,
    )

    called_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    service_started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    skipped_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_queue_tickets",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "queue_date",
            "doctor_id",
            "token_number",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "doctor",
                    "queue_date",
                    "token_number",
                ],
                name="unique_doctor_daily_queue_token",
            ),
        ]
        indexes = [
            models.Index(
                fields=[
                    "doctor",
                    "queue_date",
                    "status",
                ],
                name="queue_doc_date_status_idx",
            ),
            models.Index(
                fields=[
                    "patient",
                    "queue_date",
                ],
                name="queue_patient_date_idx",
            ),
        ]

    @property
    def token_label(self):
        return f"T{self.token_number:03d}"

    def __str__(self):
        return (
            f"{self.queue_date} - "
            f"{self.doctor} - "
            f"{self.token_label}"
        )
