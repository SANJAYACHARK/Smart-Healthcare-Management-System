from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [

    # =====================================================
    # DJANGO ADMIN
    # =====================================================

    path(
        "admin/",
        admin.site.urls,
    ),


    # =====================================================
    # ACCOUNTS
    # =====================================================

    path(
        "api/accounts/",
        include("accounts.urls"),
    ),


    # =====================================================
    # DEPARTMENTS
    # =====================================================

    path(
        "api/departments/",
        include("departments.urls"),
    ),


    # =====================================================
    # APPOINTMENTS
    # =====================================================

    path(
        "api/appointments/",
        include("appointments.urls"),
    ),


    # =====================================================
    # FEEDBACK
    # =====================================================

    path(
        "api/feedback/",
        include("feedback.urls"),
    ),


    # =====================================================
    # CHAT
    # =====================================================

    path(
        "api/chat/",
        include("chat.urls"),
    ),


    # =====================================================
    # MEDICAL RECORDS
    # =====================================================

    path(
        "api/medical-records/",
        include("medical_records.urls"),
    ),


    # =====================================================
    # LABORATORY
    # =====================================================

    path(
        "api/laboratory/",
        include("laboratory.urls"),
    ),


    # =====================================================
    # BILLING
    # =====================================================

    path(
        "api/billing/",
        include("billing.urls"),
    ),


    # =====================================================
    # AI ASSISTANT
    # =====================================================

    path(
        "api/ai/",
        include("ai_assistant.urls"),
    ),


    # =====================================================
    # NOTIFICATIONS
    # =====================================================

    path(
        "api/notifications/",
        include("notifications.urls"),
    ),


    # =====================================================
    # QUEUE MANAGEMENT
    # =====================================================

    path(
        "api/queue/",
        include("queue_management.urls"),
    ),


    # =====================================================
    # ANALYTICS
    # =====================================================

    path(
        "api/analytics/",
        include("analytics.urls"),
    ),


    # =====================================================
    # AUDIT LOGS
    # =====================================================

    path(
        "api/audit-logs/",
        include("audit_logs.urls"),
    ),


    # =====================================================
    # SYSTEM SETTINGS
    # =====================================================

    path(
        "api/system-settings/",
        include("system_settings.urls"),
    ),


    # =====================================================
    # REPORTS
    # =====================================================

    path(
        "api/reports/",
        include("reports.urls"),
    ),
]


# =========================================================
# DEVELOPMENT MEDIA FILES
# =========================================================
#
# Django serves uploaded files directly only while DEBUG=True.
#
# Examples:
#   /media/lab_reports/...
#   /media/prescriptions/...
#   /media/profile_images/...
#
# In production, media files should be served separately
# rather than through Django.
# =========================================================

if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )