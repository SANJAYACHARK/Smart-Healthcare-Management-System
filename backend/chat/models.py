from django.conf import settings
from django.db import models


class Conversation(models.Model):

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_conversations",
    )

    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.CASCADE,
        related_name="conversations",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "patient",
                    "doctor",
                ],
                name=
                    "unique_patient_doctor_conversation",
            )
        ]

        ordering = [
            "-updated_at"
        ]


    def __str__(self):

        return (
            f"{self.patient.username} "
            f"- {self.doctor}"
        )


class Message(models.Model):

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_chat_messages",
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    class Meta:

        ordering = [
            "created_at"
        ]


    def __str__(self):

        return (
            f"{self.sender.username}: "
            f"{self.message[:30]}"
        )