from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    PatientRegistrationView,
    UserProfileView,

    AdminDashboardStatsView,

    AdminDoctorListCreateView,
    AdminDoctorDetailView,

    AdminReceptionistListCreateView,
    AdminReceptionistDetailView,

    AdminPatientListView,
    AdminPatientDetailView,

    ReceptionistPatientListView,
    ReceptionistDoctorListView,

    ChangePasswordView,
)


urlpatterns = [

    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="token-obtain-pair",
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "profile/",
        UserProfileView.as_view(),
        name="user-profile",
    ),

    path(
        "register/",
        PatientRegistrationView.as_view(),
        name="patient-register",
    ),

    # ========================================================
    # ADMIN - DASHBOARD
    # ========================================================

    path(
        "admin/dashboard/",
        AdminDashboardStatsView.as_view(),
        name="admin-dashboard",
    ),

    # ========================================================
    # ADMIN - DOCTORS
    # ========================================================

    path(
        "admin/doctors/",
        AdminDoctorListCreateView.as_view(),
        name="admin-doctors",
    ),

    path(
        "admin/doctors/<int:user_id>/",
        AdminDoctorDetailView.as_view(),
        name="admin-doctor-detail",
    ),

    # ========================================================
    # ADMIN - RECEPTIONISTS
    # ========================================================

    path(
        "admin/receptionists/",
        AdminReceptionistListCreateView.as_view(),
        name="admin-receptionists",
    ),

    path(
        "admin/receptionists/<int:user_id>/",
        AdminReceptionistDetailView.as_view(),
        name="admin-receptionist-detail",
    ),

    # ========================================================
    # ADMIN - PATIENTS
    # ========================================================

    path(
        "admin/patients/",
        AdminPatientListView.as_view(),
        name="admin-patients",
    ),

    path(
        "admin/patients/<int:user_id>/",
        AdminPatientDetailView.as_view(),
        name="admin-patient-detail",
    ),

    # ========================================================
    # RECEPTIONIST
    # ========================================================

    path(
        "receptionist/patients/",
        ReceptionistPatientListView.as_view(),
        name="receptionist-patients",
    ),

    path(
        "receptionist/doctors/",
        ReceptionistDoctorListView.as_view(),
        name="receptionist-doctors",
    ),

    # ========================================================
    # PASSWORD
    # ========================================================

    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]