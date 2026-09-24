from django.contrib import admin

from .models import QueueTicket


@admin.register(QueueTicket)
class QueueTicketAdmin(admin.ModelAdmin):
    list_display = [
        "token_label",
        "queue_date",
        "doctor",
        "patient",
        "status",
        "checked_in_at",
    ]
    list_filter = [
        "queue_date",
        "status",
        "doctor",
    ]
    search_fields = [
        "patient__username",
        "patient__first_name",
        "patient__last_name",
        "doctor__user__first_name",
        "doctor__user__last_name",
    ]
    ordering = [
        "-queue_date",
        "doctor_id",
        "token_number",
    ]
