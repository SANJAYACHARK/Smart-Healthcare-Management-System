from django.urls import path

from .views import (
    AvailableDoctorListView,
    BookAppointmentView,
    PatientAppointmentListView,
    CancelAppointmentView,
    DoctorAvailableSlotsView,

    DoctorAppointmentListView,
    DoctorAppointmentDetailView,
    DoctorTodayAppointmentsView,
    DoctorAppointmentStatusView,

    DoctorAvailabilityListCreateView,
    DoctorAvailabilityDetailView,

    ReceptionistAppointmentListView,
    ReceptionistAppointmentStatusView,
    ReceptionistDashboardView,
    ReceptionistDoctorStatusView,
)


urlpatterns = [

    # ========================================================
    # PATIENT
    # ========================================================

    path(
        "doctors/",
        AvailableDoctorListView.as_view(),
        name="available-doctors",
    ),

    path(
        "book/",
        BookAppointmentView.as_view(),
        name="book-appointment",
    ),

    path(
        "my/",
        PatientAppointmentListView.as_view(),
        name="patient-appointments",
    ),

    path(
        "<int:appointment_id>/cancel/",
        CancelAppointmentView.as_view(),
        name="cancel-appointment",
    ),

    path(
        "doctors/<int:doctor_id>/slots/",
        DoctorAvailableSlotsView.as_view(),
        name="doctor-available-slots",
    ),


    # ========================================================
    # DOCTOR AVAILABILITY
    # ========================================================

    path(
        "doctor/availability/",
        DoctorAvailabilityListCreateView.as_view(),
        name="doctor-availability",
    ),

    path(
        "doctor/availability/<int:availability_id>/",
        DoctorAvailabilityDetailView.as_view(),
        name="doctor-availability-detail",
    ),


    # ========================================================
    # DOCTOR APPOINTMENTS
    # ========================================================

    path(
        "doctor/",
        DoctorAppointmentListView.as_view(),
        name="doctor-appointments",
    ),

    path(
        "doctor/today/",
        DoctorTodayAppointmentsView.as_view(),
        name="doctor-today-appointments",
    ),

    path(
        "doctor/<int:appointment_id>/status/",
        DoctorAppointmentStatusView.as_view(),
        name="doctor-appointment-status",
    ),

    path(
        "doctor/<int:appointment_id>/",
        DoctorAppointmentDetailView.as_view(),
        name="doctor-appointment-detail",
    ),


    # ========================================================
    # RECEPTIONIST
    # ========================================================

    path(
        "receptionist/",
        ReceptionistAppointmentListView.as_view(),
        name="receptionist-appointments",
    ),

    path(
        "receptionist/dashboard/",
        ReceptionistDashboardView.as_view(),
        name="receptionist-dashboard",
    ),

    path(
        "receptionist/doctor-status/",
        ReceptionistDoctorStatusView.as_view(),
        name="receptionist-doctor-status",
    ),

    path(
        "receptionist/<int:appointment_id>/status/",
        ReceptionistAppointmentStatusView.as_view(),
        name="receptionist-appointment-status",
    ),
]