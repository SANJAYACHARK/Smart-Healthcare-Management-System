from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog
from .permissions import IsAdminRole
from .serializers import AuditLogSerializer


class AuditLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminAuditLogListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = AuditLog.objects.select_related("actor").all()

        search = request.query_params.get("search", "").strip()
        role = request.query_params.get("role", "").strip().upper()
        module = request.query_params.get("module", "").strip().upper()
        action = request.query_params.get("action", "").strip().upper()
        days = request.query_params.get("days", "").strip()

        if search:
            qs = qs.filter(
                Q(actor_username__icontains=search)
                | Q(actor_name__icontains=search)
                | Q(description__icontains=search)
                | Q(object_type__icontains=search)
                | Q(object_id__icontains=search)
                | Q(request_path__icontains=search)
                | Q(ip_address__icontains=search)
            )

        if role and role != "ALL":
            qs = qs.filter(role=role)

        if module and module != "ALL":
            qs = qs.filter(module=module)

        if action and action != "ALL":
            qs = qs.filter(action=action)

        if days and days != "ALL":
            try:
                day_count = max(1, min(int(days), 3650))
                qs = qs.filter(
                    created_at__gte=timezone.now() - timedelta(days=day_count)
                )
            except ValueError:
                return Response(
                    {"detail": "days must be ALL or a valid integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(qs, request)

        return paginator.get_paginated_response(
            AuditLogSerializer(page, many=True).data
        )


class AdminAuditLogSummaryView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        today = timezone.localdate()
        today_start = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.min.time())
        )

        qs = AuditLog.objects.all()

        role_counts = {
            item["role"] or "SYSTEM": item["count"]
            for item in qs.values("role").annotate(count=Count("id"))
        }

        module_counts = list(
            qs.values("module")
            .annotate(count=Count("id"))
            .order_by("-count", "module")[:10]
        )

        return Response(
            {
                "total": qs.count(),
                "today": qs.filter(created_at__gte=today_start).count(),
                "creates": qs.filter(action=AuditLog.Action.CREATE).count(),
                "updates": qs.filter(action=AuditLog.Action.UPDATE).count(),
                "deletes": qs.filter(action=AuditLog.Action.DELETE).count(),
                "role_counts": role_counts,
                "top_modules": module_counts,
                "roles": [
                    value
                    for value, _ in [
                        ("ADMIN", "Admin"),
                        ("DOCTOR", "Doctor"),
                        ("PATIENT", "Patient"),
                        ("RECEPTIONIST", "Receptionist"),
                    ]
                ],
                "actions": [choice[0] for choice in AuditLog.Action.choices],
                "modules": list(
                    qs.exclude(module="")
                    .values_list("module", flat=True)
                    .distinct()
                    .order_by("module")
                ),
            }
        )
