from django.conf import settings
from django.db import models


# ============================================================
# MEDICAL RECORD
# ============================================================

class MedicalRecord(models.Model):

    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.PROTECT,
        related_name="medical_record",
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="medical_records",
    )

    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.PROTECT,
        related_name="medical_records",
    )

    symptoms = models.TextField()

    diagnosis = models.TextField()

    clinical_notes = models.TextField(
        blank=True,
    )

    follow_up_date = models.DateField(
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

    def __str__(self):

        return (
            f"{self.patient.username} - "
            f"{self.diagnosis[:40]}"
        )


# ============================================================
# PRESCRIPTION
# ============================================================

class Prescription(models.Model):

    medical_record = models.OneToOneField(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="prescription",
    )

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="prescriptions",
    )

    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.PROTECT,
        related_name="prescriptions",
    )

    advice = models.TextField(
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

    def __str__(self):

        return (
            f"Prescription #{self.id} - "
            f"{self.patient.username}"
        )


# ============================================================
# PRESCRIPTION MEDICINE
# ============================================================

class PrescriptionMedicine(models.Model):

    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name="medicines",
    )

    medicine_name = models.CharField(
        max_length=200,
    )

    dosage = models.CharField(
        max_length=100,
    )

    frequency = models.CharField(
        max_length=100,
    )

    duration = models.CharField(
        max_length=100,
    )

    food_instruction = models.CharField(
        max_length=100,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):

        return (
            f"{self.medicine_name} - "
            f"{self.dosage}"
        )


# ============================================================
# PATIENT MEDICAL FILE
# ============================================================
#
# Used for medical documents uploaded to a patient's account.
#
# Examples:
#   - External lab report
#   - X-Ray / CT / MRI report
#   - Prescription document
#   - Discharge summary
#   - Referral
#   - Other medical document
#
# NOTE:
# Lab reports belonging to an existing LabTestRequest should
# continue using laboratory.LabTestRequest.report_file.
# ============================================================

class PatientMedicalFile(models.Model):

    # ========================================================
    # FILE TYPES
    # ========================================================

    class FileType(models.TextChoices):

        LAB_REPORT = (
            "LAB_REPORT",
            "Lab Report",
        )

        SCAN_REPORT = (
            "SCAN_REPORT",
            "Scan / Imaging Report",
        )

        PRESCRIPTION = (
            "PRESCRIPTION",
            "Prescription",
        )

        DISCHARGE_SUMMARY = (
            "DISCHARGE_SUMMARY",
            "Discharge Summary",
        )

        REFERRAL = (
            "REFERRAL",
            "Referral",
        )

        OTHER = (
            "OTHER",
            "Other Medical Document",
        )


    # ========================================================
    # PATIENT
    # ========================================================

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="medical_files",
    )


    # ========================================================
    # FILE INFORMATION
    # ========================================================

    file_type = models.CharField(
        max_length=30,
        choices=FileType.choices,
        default=FileType.OTHER,
    )

    title = models.CharField(
        max_length=200,
    )

    description = models.TextField(
        blank=True,
    )

    document_date = models.DateField(
        null=True,
        blank=True,
    )


    # ========================================================
    # FILE
    # ========================================================

    file = models.FileField(
        upload_to="medical_files/%Y/%m/",
    )


    # ========================================================
    # DOCTOR
    # ========================================================
    #
    # Optional because a receptionist may receive an external
    # report/document that is not associated with a SmartCare
    # doctor.
    # ========================================================

    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_medical_files",
    )


    # ========================================================
    # UPLOADED BY
    # ========================================================
    #
    # Stores the user who uploaded the document.
    # Normally this will be:
    #
    #   RECEPTIONIST
    #   ADMIN
    #
    # We will enforce the actual permissions in the API.
    # ========================================================

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_medical_files",
    )


    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )


    # ========================================================
    # META
    # ========================================================

    class Meta:

        ordering = [
            "-document_date",
            "-created_at",
        ]

        indexes = [

            models.Index(
                fields=[
                    "patient",
                    "file_type",
                ],
            ),

            models.Index(
                fields=[
                    "patient",
                    "created_at",
                ],
            ),
        ]


    # ========================================================
    # STRING REPRESENTATION
    # ========================================================

    def __str__(self):

        return (
            f"{self.patient.username} - "
            f"{self.title}"
        )