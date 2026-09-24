from django.urls import path

from .views import (
    AdminAuditLogListView,
    AdminAuditLogSummaryView,
)


urlpatterns = [
    path(
        "admin/",
        AdminAuditLogListView.as_view(),
        name="admin-audit-log-list",
    ),
    path(
        "admin/summary/",
        AdminAuditLogSummaryView.as_view(),
        name="admin-audit-log-summary",
    ),
]
