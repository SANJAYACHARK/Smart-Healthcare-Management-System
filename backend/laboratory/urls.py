from django.urls import path
from .views import (
    DoctorLabPatientListView,
    DoctorLabRequestListCreateView,
    DoctorLabRequestDetailView,
    PatientLabReportListView,
    ReceptionistLabRequestListView,
    ReceptionistLabRequestDetailView,
)

urlpatterns = [
    path("doctor/patients/", DoctorLabPatientListView.as_view(), name="doctor-lab-patients"),
    path("doctor/requests/", DoctorLabRequestListCreateView.as_view(), name="doctor-lab-requests"),
    path("doctor/requests/<int:request_id>/", DoctorLabRequestDetailView.as_view(), name="doctor-lab-request-detail"),
    path("patient/", PatientLabReportListView.as_view(), name="patient-lab-reports"),
    path("receptionist/", ReceptionistLabRequestListView.as_view(), name="receptionist-lab-requests"),
    path("receptionist/<int:request_id>/", ReceptionistLabRequestDetailView.as_view(), name="receptionist-lab-request-detail"),
]
