from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):

    actor_display = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_username",
            "actor_name",
            "actor_display",
            "role",
            "action",
            "module",
            "description",
            "object_type",
            "object_id",
            "request_method",
            "request_path",
            "response_status",
            "ip_address",
            "user_agent",
            "metadata",
            "created_at",
            "created_at_display",
        ]
        read_only_fields = fields

    def get_actor_display(self, obj):
        return obj.actor_name or obj.actor_username or "System"

    def get_created_at_display(self, obj):
        return obj.created_at.strftime("%d %b %Y, %I:%M %p")
