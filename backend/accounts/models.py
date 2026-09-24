from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        DOCTOR = "DOCTOR", "Doctor"
        PATIENT = "PATIENT", "Patient"
        RECEPTIONIST = "RECEPTIONIST", "Receptionist"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    def save(self, *args, **kwargs):

        # Only superusers are forced to ADMIN.
        # is_staff only controls access to Django Admin.
        if self.is_superuser:
            self.role = self.Role.ADMIN

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} - {self.role}"


class Doctor(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctors",
    )

    specialization = models.CharField(
        max_length=150,
    )

    experience_years = models.PositiveIntegerField(
        default=0,
    )

    qualification = models.CharField(
        max_length=200,
        blank=True,
    )

    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    is_available = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):

        full_name = self.user.get_full_name()

        if full_name:
            return f"Dr. {full_name}"

        return f"Dr. {self.user.username}"


class Receptionist(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="receptionist_profile",
    )

    employee_id = models.CharField(
        max_length=50,
        unique=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):

        full_name = self.user.get_full_name()

        if full_name:
            return full_name

        return self.user.username