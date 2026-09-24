from django.conf import settings
from django.db import models


class Feedback(models.Model):

    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.CASCADE,
        related_name="feedback",
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feedback_given",
    )

    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.CASCADE,
        related_name="feedback_received",
    )

    rating = models.PositiveSmallIntegerField()

    comment = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-created_at"
        ]

    def __str__(self):

        return (
            f"{self.patient.username} "
            f"→ {self.doctor} "
            f"({self.rating}/5)"
        )