from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    User,
    Doctor,
    Receptionist,
)


# ============================================================
# DOCTOR ADMIN
# ============================================================

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):

    list_display = (
        "get_username",
        "get_name",
        "get_email",
        "department",
        "specialization",
        "experience_years",
        "is_available",
        "get_status",
    )

    list_filter = (
        "department",
        "specialization",
        "is_available",
        "user__is_active",
    )

    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "specialization",
    )

    list_select_related = (
        "user",
        "department",
    )


    @admin.display(
        description="Username"
    )
    def get_username(self, obj):
        return obj.user.username


    @admin.display(
        description="Doctor"
    )
    def get_name(self, obj):

        full_name = obj.user.get_full_name()

        if full_name:
            return f"Dr. {full_name}"

        return obj.user.username


    @admin.display(
        description="Email"
    )
    def get_email(self, obj):
        return obj.user.email


    @admin.display(
        description="Active",
        boolean=True,
    )
    def get_status(self, obj):
        return obj.user.is_active


# ============================================================
# RECEPTIONIST ADMIN
# ============================================================

@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):

    list_display = (
        "employee_id",
        "get_username",
        "get_name",
        "get_email",
        "get_phone",
        "get_status",
    )

    search_fields = (
        "employee_id",
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
    )

    list_filter = (
        "user__is_active",
    )

    list_select_related = (
        "user",
    )


    @admin.display(
        description="Username"
    )
    def get_username(self, obj):
        return obj.user.username


    @admin.display(
        description="Name"
    )
    def get_name(self, obj):

        full_name = obj.user.get_full_name()

        if full_name:
            return full_name

        return obj.user.username


    @admin.display(
        description="Email"
    )
    def get_email(self, obj):
        return obj.user.email


    @admin.display(
        description="Phone"
    )
    def get_phone(self, obj):
        return obj.user.phone


    @admin.display(
        description="Active",
        boolean=True,
    )
    def get_status(self, obj):
        return obj.user.is_active


# ============================================================
# CUSTOM USER ADMIN
# ============================================================

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    )

    search_fields = (
        "username",
        "first_name",
        "last_name",
        "email",
        "phone",
    )

    ordering = (
        "username",
    )


    fieldsets = UserAdmin.fieldsets + (
        (
            "SmartCare Information",
            {
                "fields": (
                    "role",
                    "phone",
                )
            },
        ),
    )


    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "SmartCare Information",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "phone",
                    "role",
                )
            },
        ),
    )