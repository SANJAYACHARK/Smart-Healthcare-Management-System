from django.urls import path

from .views import (
    AdminReportExportView,
    AdminReportPreviewView,
    AdminReportSummaryView,
)

urlpatterns = [
    path(
        "admin/summary/",
        AdminReportSummaryView.as_view(),
        name="admin-report-summary",
    ),
    path(
        "admin/preview/",
        AdminReportPreviewView.as_view(),
        name="admin-report-preview",
    ),
    path(
        "admin/export/",
        AdminReportExportView.as_view(),
        name="admin-report-export",
    ),
]