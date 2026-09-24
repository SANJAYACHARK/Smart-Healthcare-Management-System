from django.contrib import admin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(
    admin.ModelAdmin
):

    list_display = (
        "id",
        "patient",
        "doctor",
        "rating",
        "appointment",
        "created_at",
    )

    list_filter = (
        "rating",
        "created_at",
    )

    search_fields = (
        "patient__username",
        "patient__first_name",
        "patient__last_name",
        "doctor__user__first_name",
        "doctor__user__last_name",
        "comment",
    )

    list_select_related = (
        "patient",
        "doctor",
        "doctor__user",
        "appointment",
    )