from django.utils import timezone
from rest_framework import serializers

from .models import (
    Conversation,
    Message,
)


class ConversationSerializer(serializers.ModelSerializer):

    other_user_name = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation

        fields = [
            "id",
            "other_user_name",
            "specialization",
            "last_message",
            "last_message_time",
            "unread_count",
            "created_at",
            "updated_at",
        ]

    def get_other_user_name(self, obj):

        request = self.context.get(
            "request"
        )

        if request.user.role == request.user.Role.PATIENT:
            user = obj.doctor.user
        else:
            user = obj.patient

        name = user.get_full_name()

        return name or user.username

    def get_specialization(self, obj):

        return obj.doctor.specialization

    def get_last_message(self, obj):

        message = obj.messages.last()

        return (
            message.message
            if message
            else None
        )

    def get_last_message_time(self, obj):

        message = obj.messages.last()

        if not message:
            return None

        return timezone.localtime(
            message.created_at
        ).strftime(
            "%I:%M %p"
        )

    def get_unread_count(self, obj):

        request = self.context.get(
            "request"
        )

        return (
            obj.messages
            .exclude(
                sender=request.user
            )
            .filter(
                is_read=False
            )
            .count()
        )


class MessageSerializer(serializers.ModelSerializer):

    sender_name = serializers.SerializerMethodField()

    is_mine = serializers.SerializerMethodField()

    created_at_display = serializers.SerializerMethodField()

    class Meta:
        model = Message

        fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "message",
            "is_read",
            "is_mine",
            "created_at",
            "created_at_display",
        ]

        read_only_fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "is_read",
            "is_mine",
            "created_at",
            "created_at_display",
        ]

    def get_sender_name(self, obj):

        name = (
            obj.sender
            .get_full_name()
        )

        return (
            name or
            obj.sender.username
        )

    def get_is_mine(self, obj):

        request = self.context.get(
            "request"
        )

        return (
            obj.sender ==
            request.user
        )

    def get_created_at_display(
        self,
        obj,
    ):

        return timezone.localtime(
            obj.created_at
        ).strftime(
            "%d %b, %I:%M %p"
        )