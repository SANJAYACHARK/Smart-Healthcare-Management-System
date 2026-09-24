from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


# ============================================================
# DOCTOR AVAILABILITY
# ============================================================

class DoctorAvailability(models.Model):

    class WeekDay(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"


    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.CASCADE,
        related_name="availability_slots",
    )


    day_of_week = models.PositiveSmallIntegerField(
        choices=WeekDay.choices,
    )


    start_time = models.TimeField()


    end_time = models.TimeField()


    slot_duration = models.PositiveIntegerField(
        default=30,
        help_text="Duration of each appointment slot in minutes.",
    )


    is_active = models.BooleanField(
        default=True,
    )


    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    updated_at = models.DateTimeField(
        auto_now=True,
    )


    class Meta:

        ordering = [
            "day_of_week",
            "start_time",
        ]


        constraints = [

            models.UniqueConstraint(
                fields=[
                    "doctor",
                    "day_of_week",
                    "start_time",
                    "end_time",
                ],
                name="unique_doctor_availability",
            ),

        ]


    # ========================================================
    # VALIDATION
    # ========================================================

    def clean(self):

        super().clean()


        # ----------------------------------------------------
        # END TIME MUST BE AFTER START TIME
        # ----------------------------------------------------

        if (
            self.start_time
            and self.end_time
            and self.end_time <= self.start_time
        ):

            raise ValidationError({
                "end_time":
                    "End time must be after start time."
            })


        # ----------------------------------------------------
        # SLOT DURATION VALIDATION
        # ----------------------------------------------------

        if (
            self.slot_duration
            and self.slot_duration < 5
        ):

            raise ValidationError({
                "slot_duration":
                    "Slot duration must be at least 5 minutes."
            })


        # ----------------------------------------------------
        # PREVENT OVERLAPPING AVAILABILITY
        # ----------------------------------------------------

        if (
            self.doctor_id
            and self.start_time
            and self.end_time
        ):

            overlapping_slots = (
                DoctorAvailability.objects
                .filter(
                    doctor=self.doctor,
                    day_of_week=self.day_of_week,
                    is_active=True,
                    start_time__lt=self.end_time,
                    end_time__gt=self.start_time,
                )
            )


            if self.pk:

                overlapping_slots = (
                    overlapping_slots.exclude(
                        pk=self.pk
                    )
                )


            if overlapping_slots.exists():

                raise ValidationError(
                    "This availability overlaps with another doctor availability slot."
                )


    # ========================================================
    # SAVE
    # ========================================================

    def save(
        self,
        *args,
        **kwargs,
    ):

        self.full_clean()

        return super().save(
            *args,
            **kwargs,
        )


    # ========================================================
    # STRING
    # ========================================================

    def __str__(self):

        return (
            f"{self.doctor} - "
            f"{self.get_day_of_week_display()} "
            f"{self.start_time.strftime('%H:%M')} - "
            f"{self.end_time.strftime('%H:%M')}"
        )


# ============================================================
# APPOINTMENT
# ============================================================

class Appointment(models.Model):

    class Status(models.TextChoices):

        PENDING = (
            "PENDING",
            "Pending",
        )

        CONFIRMED = (
            "CONFIRMED",
            "Confirmed",
        )

        CHECKED_IN = (
            "CHECKED_IN",
            "Checked In",
        )

        IN_CONSULTATION = (
            "IN_CONSULTATION",
            "In Consultation",
        )

        COMPLETED = (
            "COMPLETED",
            "Completed",
        )

        CANCELLED = (
            "CANCELLED",
            "Cancelled",
        )


    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_appointments",
    )


    doctor = models.ForeignKey(
        "accounts.Doctor",
        on_delete=models.PROTECT,
        related_name="appointments",
    )


    appointment_date = models.DateField()


    appointment_time = models.TimeField()


    reason = models.TextField(
        blank=True,
    )


    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING,
    )


    receptionist_notes = models.TextField(
        blank=True,
    )


    doctor_notes = models.TextField(
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
            "appointment_date",
            "appointment_time",
        ]


        indexes = [

            models.Index(
                fields=[
                    "appointment_date",
                    "appointment_time",
                ]
            ),

            models.Index(
                fields=[
                    "doctor",
                    "appointment_date",
                ]
            ),

            models.Index(
                fields=[
                    "patient",
                    "appointment_date",
                ]
            ),

            models.Index(
                fields=[
                    "status",
                ]
            ),

        ]


        constraints = [

            # ------------------------------------------------
            # ONE ACTIVE APPOINTMENT PER DOCTOR/TIME
            # ------------------------------------------------

            models.UniqueConstraint(

                fields=[
                    "doctor",
                    "appointment_date",
                    "appointment_time",
                ],

                condition=models.Q(
                    status__in=[
                        "PENDING",
                        "CONFIRMED",
                        "CHECKED_IN",
                        "IN_CONSULTATION",
                    ]
                ),

                name="unique_active_doctor_slot",

            ),

        ]


    # ========================================================
    # STRING
    # ========================================================

    def __str__(self):

        patient_name = (
            self.patient.get_full_name().strip()
            or
            self.patient.username
        )


        return (
            f"{patient_name} - "
            f"{self.doctor} - "
            f"{self.appointment_date} "
            f"{self.appointment_time.strftime('%H:%M')}"
        )