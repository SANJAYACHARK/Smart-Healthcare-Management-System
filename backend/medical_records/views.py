from pathlib import Path

from django.db import transaction
from django.db.models import Q
from django.http import FileResponse, Http404

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Doctor
from accounts.permissions import (
    IsDoctorRole,
    IsPatientRole,
    IsReceptionistRole,
)

from appointments.models import (
    Appointment,
)

from appointments.serializers import (
    AppointmentSerializer,
)

from notifications.events import (
    notify_in_app_patient_consultation_completed,
    notify_in_app_patient_prescription_created,
)

from queue_management.services import (
    sync_queue_ticket_with_appointment,
)

from .models import (
    MedicalRecord,
    PatientMedicalFile,
    Prescription,
    PrescriptionMedicine,
)

from .serializers import (
    CompleteConsultationSerializer,
    MedicalRecordSerializer,
    PatientMedicalFileSerializer,
    PrescriptionSerializer,
)


# ============================================================
# DOCTOR - COMPLETED APPOINTMENTS
# ============================================================

class DoctorCompletedAppointmentListView(
    APIView
):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Doctor.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        appointments = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                doctor=
                    doctor,

                status=
                    Appointment.Status.COMPLETED,
            )
            .order_by(
                "-appointment_date",
                "-appointment_time",
            )
        )


        serializer = (
            AppointmentSerializer(
                appointments,
                many=True,
            )
        )


        return Response(
            {
                "count":
                    appointments.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# DOCTOR - MEDICAL RECORD LIST + CREATE
# ============================================================

class DoctorMedicalRecordListCreateView(
    APIView
):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Doctor.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        records = (
            MedicalRecord.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "appointment",
            )
            .filter(
                doctor=
                    doctor
            )
            .order_by(
                "-created_at"
            )
        )


        serializer = (
            MedicalRecordSerializer(
                records,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )


        return Response(
            {
                "count":
                    records.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


    def post(
        self,
        request,
    ):

        serializer = (
            MedicalRecordSerializer(
                data=
                    request.data,

                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        record = (
            serializer.save()
        )


        return Response(
            {
                "message":
                    "Medical record created successfully.",

                "record":
                    MedicalRecordSerializer(
                        record,
                        context={
                            "request":
                                request,
                        },
                    ).data,
            },
            status=
                status.HTTP_201_CREATED,
        )


# ============================================================
# DOCTOR - PRESCRIPTIONS
# ============================================================

class DoctorPrescriptionListCreateView(
    APIView
):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Doctor.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        prescriptions = (
            Prescription.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "medical_record",
                "medical_record__appointment",
            )
            .prefetch_related(
                "medicines"
            )
            .filter(
                doctor=
                    doctor
            )
            .order_by(
                "-created_at"
            )
        )


        serializer = (
            PrescriptionSerializer(
                prescriptions,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )


        return Response(
            {
                "count":
                    prescriptions.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


    def post(
        self,
        request,
    ):

        serializer = (
            PrescriptionSerializer(
                data=
                    request.data,

                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        prescription = (
            serializer.save()
        )


        return Response(
            {
                "message":
                    "Prescription created successfully.",

                "prescription":
                    PrescriptionSerializer(
                        prescription,
                        context={
                            "request":
                                request,
                        },
                    ).data,
            },
            status=
                status.HTTP_201_CREATED,
        )


# ============================================================
# DOCTOR - COMPLETE CONSULTATION ATOMICALLY
# ============================================================

class CompleteConsultationView(
    APIView
):

    permission_classes = [
        IsDoctorRole
    ]


    @transaction.atomic
    def post(
        self,
        request,
    ):

        serializer = (
            CompleteConsultationSerializer(
                data=
                    request.data,

                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        data = (
            serializer.validated_data
        )


        submitted_appointment = (
            data[
                "appointment"
            ]
        )


        appointment = (
            Appointment.objects
            .select_for_update()
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .get(
                pk=
                    submitted_appointment.pk
            )
        )


        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Doctor.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        # --------------------------------------------------------
        # Re-check ownership after locking the appointment row.
        # --------------------------------------------------------

        if (
            appointment.doctor !=
            doctor
        ):

            return Response(
                {
                    "detail":
                        "This appointment does not belong to you."
                },
                status=
                    status.HTTP_403_FORBIDDEN,
            )


        # --------------------------------------------------------
        # Re-check appointment status after row lock.
        # --------------------------------------------------------

        if (
            appointment.status !=
            Appointment.Status.IN_CONSULTATION
        ):

            return Response(
                {
                    "detail":
                        (
                            "This appointment is no longer "
                            "in consultation."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        # --------------------------------------------------------
        # Prevent duplicate medical records.
        # --------------------------------------------------------

        if (
            MedicalRecord.objects
            .filter(
                appointment=
                    appointment
            )
            .exists()
        ):

            return Response(
                {
                    "detail":
                        (
                            "A medical record already exists "
                            "for this appointment."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        # --------------------------------------------------------
        # Create medical record.
        # --------------------------------------------------------

        medical_record = (
            MedicalRecord.objects
            .create(
                appointment=
                    appointment,

                patient=
                    appointment.patient,

                doctor=
                    doctor,

                symptoms=
                    data[
                        "symptoms"
                    ],

                diagnosis=
                    data[
                        "diagnosis"
                    ],

                clinical_notes=
                    data.get(
                        "clinical_notes",
                        "",
                    ),

                follow_up_date=
                    data.get(
                        "follow_up_date"
                    ),
            )
        )


        medicines = (
            data.get(
                "medicines",
                [],
            )
        )


        prescription = None


        # --------------------------------------------------------
        # Prescription is optional.
        # Create it only when medicines are supplied.
        # --------------------------------------------------------

        if medicines:

            prescription = (
                Prescription.objects
                .create(
                    medical_record=
                        medical_record,

                    patient=
                        appointment.patient,

                    doctor=
                        doctor,

                    advice=
                        data.get(
                            "advice",
                            "",
                        ),
                )
            )


            medicine_objects = []


            for medicine in medicines:

                medicine_objects.append(
                    PrescriptionMedicine(
                        prescription=
                            prescription,

                        medicine_name=
                            medicine[
                                "medicine_name"
                            ],

                        dosage=
                            medicine[
                                "dosage"
                            ],

                        frequency=
                            medicine[
                                "frequency"
                            ],

                        duration=
                            medicine[
                                "duration"
                            ],

                        food_instruction=
                            medicine.get(
                                "food_instruction",
                                "",
                            ),

                        notes=
                            medicine.get(
                                "notes",
                                "",
                            ),
                    )
                )


            PrescriptionMedicine.objects.bulk_create(
                medicine_objects
            )


        # --------------------------------------------------------
        # Mark appointment completed only after all writes succeed.
        # --------------------------------------------------------

        # --------------------------------------------------------
        # Notify patient when a prescription was created.
        # --------------------------------------------------------

        if prescription is not None:

            notify_in_app_patient_prescription_created(
                prescription
            )


        appointment.status = (
            Appointment.Status.COMPLETED
        )


        appointment.save(
            update_fields=[
                "status",
            ]
        )


        sync_queue_ticket_with_appointment(
            appointment
        )


        # --------------------------------------------------------
        # Create patient in-app notification.
        # --------------------------------------------------------

        notify_in_app_patient_consultation_completed(
            appointment,
            prescription_created=(
                prescription is not None
            ),
        )


        return Response(
            {
                "message":
                    "Consultation completed successfully.",

                "appointment_id":
                    appointment.id,

                "appointment_status":
                    appointment.status,

                "medical_record_id":
                    medical_record.id,

                "prescription_id":
                    (
                        prescription.id
                        if prescription
                        else None
                    ),

                "medicine_count":
                    len(
                        medicines
                    ),
            },
            status=
                status.HTTP_201_CREATED,
        )



# ============================================================
# DOCTOR - MY PATIENTS
# ============================================================

class DoctorPatientListView(
    APIView
):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Doctor.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        appointments = (
            Appointment.objects
            .select_related(
                "patient",
            )
            .filter(
                doctor=
                    doctor
            )
            .exclude(
                status=
                    Appointment.Status.CANCELLED
            )
            .order_by(
                "-appointment_date",
                "-appointment_time",
            )
        )


        patient_map = {}


        for appointment in appointments:

            patient = (
                appointment.patient
            )

            patient_id = (
                patient.id
            )


            if (
                patient_id not in
                patient_map
            ):

                name = (
                    patient
                    .get_full_name()
                    .strip()
                )

                patient_map[
                    patient_id
                ] = {
                    "patient_id":
                        patient_id,

                    "patient_name":
                        (
                            name or
                            patient.username
                        ),

                    "username":
                        patient.username,

                    "email":
                        patient.email,

                    "total_appointments":
                        0,

                    "completed_appointments":
                        0,

                    "last_appointment_date":
                        appointment.appointment_date,

                    "last_appointment_time":
                        appointment.appointment_time,

                    "last_status":
                        appointment.status,
                }


            patient_map[
                patient_id
            ][
                "total_appointments"
            ] += 1


            if (
                appointment.status ==
                Appointment.Status.COMPLETED
            ):

                patient_map[
                    patient_id
                ][
                    "completed_appointments"
                ] += 1


        results = list(
            patient_map.values()
        )


        return Response(
            {
                "count":
                    len(results),

                "results":
                    results,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# DOCTOR - PATIENT DETAIL / HISTORY
# ============================================================

class DoctorPatientDetailView(
    APIView
):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
        patient_id,
    ):

        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Doctor.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        patient_appointment = (
            Appointment.objects
            .select_related(
                "patient",
            )
            .filter(
                doctor=
                    doctor,

                patient_id=
                    patient_id,
            )
            .exclude(
                status=
                    Appointment.Status.CANCELLED
            )
            .order_by(
                "-appointment_date",
                "-appointment_time",
            )
            .first()
        )


        if not patient_appointment:

            return Response(
                {
                    "detail":
                        (
                            "Patient not found in "
                            "your appointment history."
                        )
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        patient = (
            patient_appointment.patient
        )


        patient_name = (
            patient
            .get_full_name()
            .strip()
        )


        appointments = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                doctor=
                    doctor,

                patient=
                    patient,
            )
            .order_by(
                "-appointment_date",
                "-appointment_time",
            )
        )


        records = (
            MedicalRecord.objects
            .select_related(
                "appointment",
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                doctor=
                    doctor,

                patient=
                    patient,
            )
            .order_by(
                "-created_at"
            )
        )


        prescriptions = (
            Prescription.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "medical_record",
                "medical_record__appointment",
            )
            .prefetch_related(
                "medicines"
            )
            .filter(
                doctor=
                    doctor,

                patient=
                    patient,
            )
            .order_by(
                "-created_at"
            )
        )


        appointment_serializer = (
            AppointmentSerializer(
                appointments,
                many=True,
            )
        )


        record_serializer = (
            MedicalRecordSerializer(
                records,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )


        prescription_serializer = (
            PrescriptionSerializer(
                prescriptions,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )


        return Response(
            {
                "patient": {
                    "id":
                        patient.id,

                    "name":
                        (
                            patient_name or
                            patient.username
                        ),

                    "username":
                        patient.username,

                    "email":
                        patient.email,
                },

                "stats": {
                    "total_appointments":
                        appointments.count(),

                    "completed_appointments":
                        appointments.filter(
                            status=
                                Appointment.Status.COMPLETED
                        ).count(),

                    "medical_records":
                        records.count(),

                    "prescriptions":
                        prescriptions.count(),
                },

                "appointments":
                    appointment_serializer.data,

                "medical_records":
                    record_serializer.data,

                "prescriptions":
                    prescription_serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# PATIENT - MEDICAL RECORDS
# ============================================================

class PatientMedicalRecordListView(
    APIView
):

    permission_classes = [
        IsPatientRole
    ]


    def get(
        self,
        request,
    ):

        records = (
            MedicalRecord.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "appointment",
            )
            .filter(
                patient=
                    request.user
            )
            .order_by(
                "-created_at"
            )
        )


        serializer = (
            MedicalRecordSerializer(
                records,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )


        return Response(
            {
                "count":
                    records.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# PATIENT - PRESCRIPTIONS
# ============================================================

class PatientPrescriptionListView(
    APIView
):

    permission_classes = [
        IsPatientRole
    ]


    def get(
        self,
        request,
    ):

        prescriptions = (
            Prescription.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "medical_record",
                "medical_record__appointment",
            )
            .prefetch_related(
                "medicines"
            )
            .filter(
                patient=
                    request.user
            )
            .order_by(
                "-created_at"
            )
        )


        serializer = (
            PrescriptionSerializer(
                prescriptions,
                many=True,
                context={
                    "request":
                        request,
                },
            )
        )


        return Response(
            {
                "count":
                    prescriptions.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )

# ============================================================
# RECEPTIONIST - PATIENT MEDICAL FILES
# ============================================================

class ReceptionistMedicalFileListCreateView(APIView):

    permission_classes = [
        IsReceptionistRole,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get(self, request):
        files = (
            PatientMedicalFile.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "uploaded_by",
            )
            .all()
        )

        patient_id = request.query_params.get("patient")

        if patient_id:
            files = files.filter(
                patient_id=patient_id
            )

        file_type = request.query_params.get("file_type")

        if file_type:
            files = files.filter(
                file_type=file_type
            )

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        if search:
            files = files.filter(
                Q(title__icontains=search)
                | Q(patient__first_name__icontains=search)
                | Q(patient__last_name__icontains=search)
                | Q(patient__username__icontains=search)
            )

        files = files.order_by(
            "-document_date",
            "-created_at",
        )

        serializer = PatientMedicalFileSerializer(
            files,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "count": files.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = PatientMedicalFileSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        medical_file = serializer.save()

        return Response(
            {
                "message": (
                    "Medical file uploaded successfully."
                ),
                "file": PatientMedicalFileSerializer(
                    medical_file,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# RECEPTIONIST - MEDICAL FILE DETAIL
# ============================================================

class ReceptionistMedicalFileDetailView(APIView):

    permission_classes = [
        IsReceptionistRole,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_object(self, pk):
        try:
            return (
                PatientMedicalFile.objects
                .select_related(
                    "patient",
                    "doctor",
                    "doctor__user",
                    "uploaded_by",
                )
                .get(pk=pk)
            )

        except PatientMedicalFile.DoesNotExist:
            raise Http404(
                "Medical file not found."
            )

    def get(self, request, pk):
        medical_file = self.get_object(pk)

        serializer = PatientMedicalFileSerializer(
            medical_file,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        medical_file = self.get_object(pk)

        serializer = PatientMedicalFileSerializer(
            medical_file,
            data=request.data,
            partial=True,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "Medical file updated successfully."
                ),
                "file": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        medical_file = self.get_object(pk)

        if medical_file.file:
            medical_file.file.delete(
                save=False
            )

        medical_file.delete()

        return Response(
            {
                "message": (
                    "Medical file deleted successfully."
                )
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# RECEPTIONIST - DOWNLOAD MEDICAL FILE
# ============================================================

class ReceptionistMedicalFileDownloadView(APIView):

    permission_classes = [
        IsReceptionistRole,
    ]

    def get(self, request, pk):
        try:
            medical_file = PatientMedicalFile.objects.get(
                pk=pk
            )

        except PatientMedicalFile.DoesNotExist:
            raise Http404(
                "Medical file not found."
            )

        return _medical_file_download_response(
            medical_file
        )


# ============================================================
# PATIENT - MY MEDICAL FILES
# ============================================================

class PatientMedicalFileListView(APIView):

    permission_classes = [
        IsPatientRole,
    ]

    def get(self, request):
        files = (
            PatientMedicalFile.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "uploaded_by",
            )
            .filter(
                patient=request.user
            )
            .order_by(
                "-document_date",
                "-created_at",
            )
        )

        serializer = PatientMedicalFileSerializer(
            files,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "count": files.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# PATIENT - DOWNLOAD MY MEDICAL FILE
# ============================================================

class PatientMedicalFileDownloadView(APIView):

    permission_classes = [
        IsPatientRole,
    ]

    def get(self, request, pk):
        try:
            medical_file = PatientMedicalFile.objects.get(
                pk=pk,
                patient=request.user,
            )

        except PatientMedicalFile.DoesNotExist:
            raise Http404(
                "Medical file not found."
            )

        return _medical_file_download_response(
            medical_file
        )


# ============================================================
# MEDICAL FILE DOWNLOAD HELPER
# ============================================================

def _medical_file_download_response(medical_file):
    if not medical_file.file:
        raise Http404(
            "File is unavailable."
        )

    try:
        file_handle = medical_file.file.open("rb")

    except (FileNotFoundError, OSError):
        raise Http404(
            "File is unavailable."
        )

    filename = Path(medical_file.file.name).name

    return FileResponse(
        file_handle,
        as_attachment=True,
        filename=filename,
    )

