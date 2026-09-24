from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "title",
        "notification_type",
        "priority",
        "is_read",
        "created_at",
    ]
    list_filter = [
        "notification_type",
        "priority",
        "is_read",
        "created_at",
    ]
    search_fields = [
        "user__email",
        "user__first_name",
        "user__last_name",
        "title",
        "message",
        "object_type",
        "object_id",
    ]
    readonly_fields = ["created_at", "read_at"]
    ordering = ["-created_at"]
    list_per_page = 50
