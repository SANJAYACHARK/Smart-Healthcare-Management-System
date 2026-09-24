from django.contrib import admin

from .models import (
    MedicalRecord,
)


@admin.register(MedicalRecord)
class MedicalRecordAdmin(
    admin.ModelAdmin
):

    list_display = (
        "id",
        "patient",
        "doctor",
        "appointment",
        "short_diagnosis",
        "follow_up_date",
        "created_at",
    )

    list_filter = (
        "created_at",
        "follow_up_date",
    )

    search_fields = (
        "patient__username",
        "patient__first_name",
        "patient__last_name",
        "doctor__user__first_name",
        "doctor__user__last_name",
        "diagnosis",
    )


    @admin.display(
        description="Diagnosis"
    )
    def short_diagnosis(
        self,
        obj,
    ):

        return obj.diagnosis[
            :60
        ]