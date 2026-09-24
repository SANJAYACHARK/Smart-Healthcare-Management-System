from django.urls import path

from .views import (
    DoctorCallNextQueueView,
    DoctorCallQueueTicketView,
    DoctorSkipQueueTicketView,
    DoctorStartQueueConsultationView,
    DoctorTodayQueueView,
    PatientCurrentQueueView,
    ReceptionistCreateQueueTicketView,
    ReceptionistRestoreQueueTicketView,
    ReceptionistSkipQueueTicketView,
    ReceptionistTodayQueueView,
)


urlpatterns = [
    path(
        "receptionist/today/",
        ReceptionistTodayQueueView.as_view(),
        name="receptionist-today-queue",
    ),
    path(
        "receptionist/appointment/<int:appointment_id>/create/",
        ReceptionistCreateQueueTicketView.as_view(),
        name="receptionist-create-queue-ticket",
    ),
    path(
        "receptionist/<int:ticket_id>/skip/",
        ReceptionistSkipQueueTicketView.as_view(),
        name="receptionist-skip-queue-ticket",
    ),
    path(
        "receptionist/<int:ticket_id>/restore/",
        ReceptionistRestoreQueueTicketView.as_view(),
        name="receptionist-restore-queue-ticket",
    ),

    path(
        "doctor/today/",
        DoctorTodayQueueView.as_view(),
        name="doctor-today-queue",
    ),
    path(
        "doctor/call-next/",
        DoctorCallNextQueueView.as_view(),
        name="doctor-call-next-queue",
    ),
    path(
        "doctor/<int:ticket_id>/call/",
        DoctorCallQueueTicketView.as_view(),
        name="doctor-call-queue-ticket",
    ),
    path(
        "doctor/<int:ticket_id>/start/",
        DoctorStartQueueConsultationView.as_view(),
        name="doctor-start-queue-consultation",
    ),
    path(
        "doctor/<int:ticket_id>/skip/",
        DoctorSkipQueueTicketView.as_view(),
        name="doctor-skip-queue-ticket",
    ),

    path(
        "patient/current/",
        PatientCurrentQueueView.as_view(),
        name="patient-current-queue",
    ),
]
