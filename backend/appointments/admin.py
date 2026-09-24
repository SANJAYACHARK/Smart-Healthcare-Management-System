from django.contrib import admin

from .models import (
    Appointment,
    DoctorAvailability,
)


@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(
    admin.ModelAdmin
):

    list_display = (
        "doctor",
        "get_day",
        "start_time",
        "end_time",
        "slot_duration",
        "is_active",
    )

    list_filter = (
        "day_of_week",
        "is_active",
    )

    @admin.display(
        description="Day"
    )
    def get_day(self, obj):

        return (
            obj.get_day_of_week_display()
        )


@admin.register(Appointment)
class AppointmentAdmin(
    admin.ModelAdmin
):

    list_display = (
        "id",
        "patient",
        "doctor",
        "appointment_date",
        "appointment_time",
        "status",
    )

    list_filter = (
        "status",
        "appointment_date",
    )