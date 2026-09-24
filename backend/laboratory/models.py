from django.conf import settings
from django.db import models


class LabTestRequest(models.Model):

    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        SAMPLE_COLLECTED = "SAMPLE_COLLECTED", "Sample Collected"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class Priority(models.TextChoices):
        ROUTINE = "ROUTINE", "Routine"
        URGENT = "URGENT", "Urgent"
        STAT = "STAT", "STAT"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="lab_test_requests",
    )
    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.PROTECT,
        related_name="lab_test_requests",
    )
    test_name = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.ROUTINE,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED,
    )
    sample_id = models.CharField(max_length=40, blank=True)
    sample_type = models.CharField(max_length=100, blank=True)
    sample_collected_at = models.DateTimeField(null=True, blank=True)
    result_value = models.CharField(max_length=120, blank=True)
    result_unit = models.CharField(max_length=50, blank=True)
    reference_range = models.CharField(max_length=120, blank=True)
    is_abnormal = models.BooleanField(default=False)
    result_summary = models.TextField(blank=True)
    report_file = models.FileField(
        upload_to="lab_reports/%Y/%m/",
        null=True,
        blank=True,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    doctor_reviewed_at = models.DateTimeField(null=True, blank=True)
    doctor_review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["patient", "status"]),
            models.Index(fields=["doctor", "status"]),
        ]

    def __str__(self):
        return f"{self.patient.username} - {self.test_name}"
