from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Doctor, User
from accounts.permissions import IsDoctorRole, IsPatientRole, IsReceptionistRole
from appointments.models import Appointment
from .models import LabTestRequest
from .serializers import LabTestRequestSerializer
from notifications.events import (
    notify_in_app_patient_lab_requested,
    notify_in_app_patient_lab_status,
)



# ============================================================
# LAB REPORT UPLOAD SECURITY
# ============================================================

MAX_LAB_REPORT_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_LAB_REPORT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_LAB_REPORT_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}


def validate_lab_report_upload(upload):
    from pathlib import Path

    if upload.size > MAX_LAB_REPORT_SIZE:
        return "Lab report file must not exceed 10 MB."

    extension = Path(upload.name).suffix.lower()
    if extension not in ALLOWED_LAB_REPORT_EXTENSIONS:
        return "Only PDF, JPG, JPEG, and PNG lab reports are allowed."

    content_type = getattr(upload, "content_type", "")
    if content_type and content_type not in ALLOWED_LAB_REPORT_CONTENT_TYPES:
        return "Invalid lab report file type."

    return None

def serialize(obj, request):
    return LabTestRequestSerializer(obj, context={"request": request}).data


class DoctorLabPatientListView(APIView):
    permission_classes = [IsDoctorRole]

    def get(self, request):
        doctor = request.user.doctor_profile
        patient_ids = (
            Appointment.objects.filter(doctor=doctor)
            .exclude(status=Appointment.Status.CANCELLED)
            .values_list("patient_id", flat=True).distinct()
        )
        patients = User.objects.filter(
            id__in=patient_ids, role=User.Role.PATIENT, is_active=True
        ).order_by("first_name", "last_name")
        results = [{"id": p.id, "name": p.get_full_name() or p.username} for p in patients]
        return Response({"count": len(results), "results": results})


class DoctorLabRequestListCreateView(APIView):
    permission_classes = [IsDoctorRole]

    def get(self, request):
        qs = LabTestRequest.objects.select_related(
            "patient", "doctor", "doctor__user"
        ).filter(doctor=request.user.doctor_profile)
        return Response({
            "count": qs.count(),
            "results": LabTestRequestSerializer(
                qs, many=True, context={"request": request}
            ).data,
        })

    def post(self, request):
        serializer = LabTestRequestSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        lab_request = serializer.save()
        notify_in_app_patient_lab_requested(lab_request)
        return Response(
            {"message": "Lab test requested successfully.", "request": serialize(lab_request, request)},
            status=status.HTTP_201_CREATED,
        )


class DoctorLabRequestDetailView(APIView):
    permission_classes = [IsDoctorRole]

    def patch(self, request, request_id):
        lab = LabTestRequest.objects.filter(
            id=request_id, doctor=request.user.doctor_profile
        ).first()
        if not lab:
            return Response({"detail": "Lab request not found."}, status=404)
        if lab.status != LabTestRequest.Status.COMPLETED:
            return Response({"detail": "Only completed results can be reviewed."}, status=400)
        lab.doctor_review_notes = request.data.get("doctor_review_notes", "").strip()
        lab.doctor_reviewed_at = timezone.now()
        lab.save(update_fields=["doctor_review_notes", "doctor_reviewed_at", "updated_at"])
        return Response({"message": "Lab result reviewed.", "request": serialize(lab, request)})


class PatientLabReportListView(APIView):
    permission_classes = [IsPatientRole]

    def get(self, request):
        qs = LabTestRequest.objects.select_related(
            "patient", "doctor", "doctor__user"
        ).filter(patient=request.user)
        return Response({
            "count": qs.count(),
            "results": LabTestRequestSerializer(
                qs, many=True, context={"request": request}
            ).data,
        })


class ReceptionistLabRequestListView(APIView):
    permission_classes = [IsReceptionistRole]

    def get(self, request):
        qs = LabTestRequest.objects.select_related(
            "patient", "doctor", "doctor__user"
        ).all()
        return Response({
            "count": qs.count(),
            "results": LabTestRequestSerializer(
                qs, many=True, context={"request": request}
            ).data,
        })


class ReceptionistLabRequestDetailView(APIView):
    permission_classes = [IsReceptionistRole]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, request_id):
        lab = LabTestRequest.objects.select_related(
            "patient", "doctor", "doctor__user"
        ).filter(id=request_id).first()
        if not lab:
            return Response({"detail": "Lab request not found."}, status=404)

        previous_status = lab.status
        new_status = request.data.get("status", lab.status)
        allowed = {choice[0] for choice in LabTestRequest.Status.choices}
        if new_status not in allowed:
            return Response({"detail": "Invalid lab status."}, status=400)

        transitions = {
            LabTestRequest.Status.REQUESTED: {
                LabTestRequest.Status.SAMPLE_COLLECTED,
                LabTestRequest.Status.CANCELLED,
            },
            LabTestRequest.Status.SAMPLE_COLLECTED: {
                LabTestRequest.Status.PROCESSING,
                LabTestRequest.Status.CANCELLED,
            },
            LabTestRequest.Status.PROCESSING: {
                LabTestRequest.Status.COMPLETED,
                LabTestRequest.Status.CANCELLED,
            },
            LabTestRequest.Status.COMPLETED: set(),
            LabTestRequest.Status.CANCELLED: set(),
        }
        if new_status != previous_status and new_status not in transitions.get(previous_status, set()):
            return Response(
                {"detail": f"Cannot change {previous_status} to {new_status}."},
                status=400,
            )

        editable = [
            "sample_id", "sample_type", "result_value", "result_unit",
            "reference_range", "result_summary",
        ]
        for field in editable:
            if field in request.data:
                setattr(lab, field, request.data.get(field, "").strip())

        if "is_abnormal" in request.data:
            lab.is_abnormal = str(request.data.get("is_abnormal")).lower() in ("1", "true", "yes", "on")

        if request.FILES.get("report_file"):
            upload = request.FILES["report_file"]
            upload_error = validate_lab_report_upload(upload)
            if upload_error:
                return Response(
                    {"detail": upload_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            lab.report_file = upload

        if new_status == LabTestRequest.Status.SAMPLE_COLLECTED and not lab.sample_collected_at:
            lab.sample_collected_at = timezone.now()
            if not lab.sample_id:
                lab.sample_id = f"LAB-{lab.id:06d}"

        if new_status == LabTestRequest.Status.COMPLETED:
            if not lab.result_summary.strip():
                return Response({"detail": "Result summary is required to complete the test."}, status=400)
            lab.completed_at = timezone.now()

        lab.status = new_status
        lab.save()

        if new_status != previous_status:
            notify_in_app_patient_lab_status(lab, previous_status=previous_status)

        return Response({"message": "Lab request updated successfully.", "request": serialize(lab, request)})
