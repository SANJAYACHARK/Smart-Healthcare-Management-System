from django.utils import timezone
from rest_framework import serializers
from .models import LabTestRequest


class LabTestRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_id = serializers.IntegerField(source="patient_id", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    report_file_url = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()
    sample_collected_at_display = serializers.SerializerMethodField()
    completed_at_display = serializers.SerializerMethodField()

    class Meta:
        model = LabTestRequest
        fields = [
            "id", "patient", "patient_id", "patient_name",
            "doctor", "doctor_name", "test_name", "instructions",
            "priority", "status", "sample_id", "sample_type",
            "sample_collected_at", "sample_collected_at_display",
            "result_value", "result_unit", "reference_range",
            "is_abnormal", "result_summary", "report_file",
            "report_file_url", "completed_at", "completed_at_display",
            "doctor_reviewed_at", "doctor_review_notes",
            "created_at", "created_at_display", "updated_at",
        ]
        read_only_fields = [
            "id", "doctor", "doctor_name", "patient_name",
            "patient_id", "report_file_url", "created_at",
            "created_at_display", "updated_at",
            "sample_collected_at_display", "completed_at_display",
            "doctor_reviewed_at",
        ]

    def get_patient_name(self, obj):
        return obj.patient.get_full_name() or obj.patient.username

    def get_doctor_name(self, obj):
        return obj.doctor.user.get_full_name() or obj.doctor.user.username

    def get_report_file_url(self, obj):
        if not obj.report_file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.report_file.url) if request else obj.report_file.url

    def _display(self, value):
        return timezone.localtime(value).strftime("%d %b %Y, %I:%M %p") if value else None

    def get_created_at_display(self, obj):
        return self._display(obj.created_at)

    def get_sample_collected_at_display(self, obj):
        return self._display(obj.sample_collected_at)

    def get_completed_at_display(self, obj):
        return self._display(obj.completed_at)

    def create(self, validated_data):
        return LabTestRequest.objects.create(
            doctor=self.context["request"].user.doctor_profile,
            **validated_data,
        )
