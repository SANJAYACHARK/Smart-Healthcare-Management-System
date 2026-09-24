from rest_framework import serializers

from .models import QueueTicket


class QueueTicketSerializer(serializers.ModelSerializer):
    token_label = serializers.CharField(read_only=True)

    appointment_id = serializers.IntegerField(
        source="appointment.id",
        read_only=True,
    )

    appointment_time = serializers.TimeField(
        source="appointment.appointment_time",
        read_only=True,
    )

    appointment_reason = serializers.CharField(
        source="appointment.reason",
        read_only=True,
    )

    appointment_status = serializers.CharField(
        source="appointment.status",
        read_only=True,
    )

    patient_id = serializers.IntegerField(
        source="patient.id",
        read_only=True,
    )

    patient_name = serializers.SerializerMethodField()

    doctor_id = serializers.IntegerField(
        source="doctor.user.id",
        read_only=True,
    )

    doctor_name = serializers.SerializerMethodField()

    specialization = serializers.CharField(
        source="doctor.specialization",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="doctor.department.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = QueueTicket
        fields = [
            "id",
            "token_number",
            "token_label",
            "status",
            "queue_date",
            "appointment_id",
            "appointment_time",
            "appointment_reason",
            "appointment_status",
            "patient_id",
            "patient_name",
            "doctor_id",
            "doctor_name",
            "specialization",
            "department_name",
            "checked_in_at",
            "called_at",
            "service_started_at",
            "completed_at",
            "skipped_at",
            "created_at",
            "updated_at",
        ]

    def get_patient_name(self, obj):
        name = (obj.patient.get_full_name() or "").strip()
        return name or obj.patient.username

    def get_doctor_name(self, obj):
        user = obj.doctor.user
        name = (user.get_full_name() or "").strip()
        return name or user.username
