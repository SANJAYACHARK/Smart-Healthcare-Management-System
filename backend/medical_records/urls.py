from django.urls import path

from .views import (
    CompleteConsultationView,
    DoctorCompletedAppointmentListView,
    DoctorMedicalRecordListCreateView,
    DoctorPatientDetailView,
    DoctorPatientListView,
    DoctorPrescriptionListCreateView,

    PatientMedicalFileDownloadView,
    PatientMedicalFileListView,
    PatientMedicalRecordListView,
    PatientPrescriptionListView,

    ReceptionistMedicalFileDetailView,
    ReceptionistMedicalFileListCreateView,
)

from .ehr_timeline import (
    DoctorPatientEHRTimelineView,
    PatientEHRTimelineView,
)

from .prescription_views import (
    PrescriptionPDFView,
    PrescriptionVerificationInfoView,
    public_verify_prescription,
)


urlpatterns = [

    # ========================================================
    # DOCTOR
    # ========================================================

    path(
        "doctor/appointments/",
        DoctorCompletedAppointmentListView.as_view(),
        name="doctor-completed-appointments",
    ),

    path(
        "doctor/",
        DoctorMedicalRecordListCreateView.as_view(),
        name="doctor-medical-records",
    ),

    path(
        "doctor/prescriptions/",
        DoctorPrescriptionListCreateView.as_view(),
        name="doctor-prescriptions",
    ),

    path(
        "doctor/complete-consultation/",
        CompleteConsultationView.as_view(),
        name="doctor-complete-consultation",
    ),

    path(
        "doctor/patients/",
        DoctorPatientListView.as_view(),
        name="doctor-patients",
    ),

    path(
        "doctor/patients/<int:patient_id>/",
        DoctorPatientDetailView.as_view(),
        name="doctor-patient-detail",
    ),

    path(
        "doctor/patients/<int:patient_id>/timeline/",
        DoctorPatientEHRTimelineView.as_view(),
        name="doctor-patient-ehr-timeline",
    ),


    # ========================================================
    # RECEPTIONIST - MEDICAL FILES
    # ========================================================

    path(
        "receptionist/files/",
        ReceptionistMedicalFileListCreateView.as_view(),
        name="receptionist-medical-files",
    ),

    path(
        "receptionist/files/<int:pk>/",
        ReceptionistMedicalFileDetailView.as_view(),
        name="receptionist-medical-file-detail",
    ),


    # ========================================================
    # PATIENT
    # ========================================================

    path(
        "patient/",
        PatientMedicalRecordListView.as_view(),
        name="patient-medical-records",
    ),

    path(
        "patient/prescriptions/",
        PatientPrescriptionListView.as_view(),
        name="patient-prescriptions",
    ),

    path(
        "patient/timeline/",
        PatientEHRTimelineView.as_view(),
        name="patient-ehr-timeline",
    ),

    path(
        "patient/files/",
        PatientMedicalFileListView.as_view(),
        name="patient-medical-files",
    ),

    path(
        "patient/files/<int:pk>/download/",
        PatientMedicalFileDownloadView.as_view(),
        name="patient-medical-file-download",
    ),


    # ========================================================
    # PRESCRIPTION PDF + VERIFICATION
    # ========================================================

    path(
        "prescriptions/<int:prescription_id>/pdf/",
        PrescriptionPDFView.as_view(),
        name="prescription-pdf",
    ),

    path(
        "prescriptions/<int:prescription_id>/verification/",
        PrescriptionVerificationInfoView.as_view(),
        name="prescription-verification-info",
    ),

    path(
        "verify/prescription/<int:prescription_id>/<str:signature>/",
        public_verify_prescription,
        name="prescription-public-verify",
    ),
]