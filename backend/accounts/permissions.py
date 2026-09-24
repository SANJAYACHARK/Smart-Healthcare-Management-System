from rest_framework.permissions import BasePermission


def _has_role(user, role_name):
    return bool(
        user
        and user.is_authenticated
        and getattr(user, "is_active", False)
        and getattr(user, "role", None) == role_name
    )


class IsAdminRole(BasePermission):
    message = "Administrator access is required."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not getattr(user, "is_active", False):
            return False
        role = getattr(getattr(user, "Role", None), "ADMIN", "ADMIN")
        return getattr(user, "role", None) == role or getattr(user, "is_superuser", False)


class IsDoctorRole(BasePermission):
    message = "Doctor access is required."

    def has_permission(self, request, view):
        user = request.user
        role = getattr(getattr(user, "Role", None), "DOCTOR", "DOCTOR")
        return _has_role(user, role)


class IsPatientRole(BasePermission):
    message = "Patient access is required."

    def has_permission(self, request, view):
        user = request.user
        role = getattr(getattr(user, "Role", None), "PATIENT", "PATIENT")
        return _has_role(user, role)


class IsReceptionistRole(BasePermission):
    message = "Receptionist access is required."

    def has_permission(self, request, view):
        user = request.user
        role = getattr(getattr(user, "Role", None), "RECEPTIONIST", "RECEPTIONIST")
        return _has_role(user, role)
