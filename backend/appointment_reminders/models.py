from django.db import models


class AppointmentReminder(models.Model):

    class ReminderType(models.TextChoices):
        DAY_BEFORE = (
            "24H",
            "24 Hours Before",
        )

        TWO_HOURS = (
            "2H",
            "2 Hours Before",
        )


    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.CASCADE,
        related_name="reminders",
    )


    reminder_type = models.CharField(
        max_length=10,
        choices=ReminderType.choices,
    )


    in_app_sent = models.BooleanField(
        default=False,
    )


    external_sent = models.BooleanField(
        default=False,
    )


    external_channel_attempted = models.BooleanField(
        default=False,
    )


    sent_at = models.DateTimeField(
        null=True,
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
            "-created_at",
        ]

        constraints = [

            models.UniqueConstraint(
                fields=[
                    "appointment",
                    "reminder_type",
                ],
                name=(
                    "unique_appointment_"
                    "reminder_type"
                ),
            ),

        ]

        indexes = [

            models.Index(
                fields=[
                    "reminder_type",
                    "sent_at",
                ],
                name=(
                    "appt_rem_type_sent_idx"
                ),
            ),

            models.Index(
                fields=[
                    "appointment",
                    "reminder_type",
                ],
                name=(
                    "appt_rem_appt_type_idx"
                ),
            ),

        ]


    def __str__(self):

        return (
            f"Appointment "
            f"#{self.appointment_id} - "
            f"{self.get_reminder_type_display()}"
        )
