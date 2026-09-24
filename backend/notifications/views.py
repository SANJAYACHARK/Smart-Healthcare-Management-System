from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Notification.objects.filter(user=request.user)

        filter_value = request.query_params.get("filter", "all").strip().lower()
        if filter_value == "unread":
            queryset = queryset.filter(is_read=False)
        elif filter_value == "read":
            queryset = queryset.filter(is_read=True)

        notification_type = request.query_params.get("type")
        if notification_type:
            queryset = queryset.filter(
                notification_type=notification_type.strip().upper()
            )

        try:
            limit = int(request.query_params.get("limit", 30))
        except (TypeError, ValueError):
            limit = 30

        limit = max(1, min(limit, 100))
        total_count = queryset.count()
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        serializer = NotificationSerializer(
            queryset[:limit],
            many=True,
        )

        return Response(
            {
                "count": total_count,
                "unread_count": unread_count,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {"unread_count": unread_count},
            status=status.HTTP_200_OK,
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user,
        )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        updated_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(
            is_read=True,
            read_at=timezone.now(),
        )

        return Response(
            {
                "message": "All notifications marked as read.",
                "updated_count": updated_count,
                "unread_count": 0,
            },
            status=status.HTTP_200_OK,
        )


class NotificationDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        notification = get_object_or_404(
            Notification,
            id=notification_id,
            user=request.user,
        )
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationClearReadView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted_count, _ = Notification.objects.filter(
            user=request.user,
            is_read=True,
        ).delete()

        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "message": "Read notifications cleared.",
                "deleted_count": deleted_count,
                "unread_count": unread_count,
            },
            status=status.HTTP_200_OK,
        )
