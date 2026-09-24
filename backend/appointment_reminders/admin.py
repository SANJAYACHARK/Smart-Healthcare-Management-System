from django.contrib import admin

from .models import AppointmentReminder


@admin.register(
    AppointmentReminder
)
class AppointmentReminderAdmin(
    admin.ModelAdmin
):

    list_display = [
        "id",
        "appointment",
        "reminder_type",
        "in_app_sent",
        "external_sent",
        "sent_at",
        "created_at",
    ]


    list_filter = [
        "reminder_type",
        "in_app_sent",
        "external_sent",
        "sent_at",
    ]


    search_fields = [
        "appointment__patient__username",
        "appointment__patient__first_name",
        "appointment__patient__last_name",
        "appointment__doctor__user__first_name",
        "appointment__doctor__user__last_name",
    ]


    readonly_fields = [
        "created_at",
        "updated_at",
    ]
