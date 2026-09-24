from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "actor_username",
        "role",
        "action",
        "module",
        "response_status",
        "ip_address",
    )
    list_filter = ("role", "action", "module", "created_at")
    search_fields = (
        "actor_username",
        "actor_name",
        "description",
        "object_type",
        "object_id",
        "request_path",
        "ip_address",
    )
    readonly_fields = [field.name for field in AuditLog._meta.fields]
