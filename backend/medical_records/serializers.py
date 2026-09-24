from django.utils import timezone

from rest_framework import serializers

from appointments.models import (
    Appointment,
)

from .models import (
    MedicalRecord,
    PatientMedicalFile,
    Prescription,
    PrescriptionMedicine,
)


# ============================================================
# MEDICAL RECORD SERIALIZER
# ============================================================

class MedicalRecordSerializer(
    serializers.ModelSerializer
):

    patient_name = (
        serializers.SerializerMethodField()
    )

    doctor_name = (
        serializers.SerializerMethodField()
    )

    appointment_date = (
        serializers.DateField(
            source="appointment.appointment_date",
            read_only=True,
        )
    )

    appointment_time = (
        serializers.TimeField(
            source="appointment.appointment_time",
            read_only=True,
        )
    )

    created_at_display = (
        serializers.SerializerMethodField()
    )


    class Meta:

        model = MedicalRecord

        fields = [
            "id",

            "appointment",

            "patient",
            "patient_name",

            "doctor",
            "doctor_name",

            "appointment_date",
            "appointment_time",

            "symptoms",
            "diagnosis",
            "clinical_notes",

            "follow_up_date",

            "created_at",
            "created_at_display",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "appointment_date",
            "appointment_time",
            "created_at",
            "created_at_display",
            "updated_at",
        ]


    def get_patient_name(
        self,
        obj,
    ):

        name = (
            obj.patient
            .get_full_name()
        )

        return (
            name or
            obj.patient.username
        )


    def get_doctor_name(
        self,
        obj,
    ):

        name = (
            obj.doctor.user
            .get_full_name()
        )

        return (
            name or
            obj.doctor.user.username
        )


    def get_created_at_display(
        self,
        obj,
    ):

        return timezone.localtime(
            obj.created_at
        ).strftime(
            "%d %b %Y, %I:%M %p"
        )


    def validate_appointment(
        self,
        appointment,
    ):

        request = (
            self.context.get(
                "request"
            )
        )


        if not request:

            return appointment


        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Exception:

            raise serializers.ValidationError(
                "Doctor profile not found."
            )


        if (
            appointment.doctor !=
            doctor
        ):

            raise serializers.ValidationError(
                "This appointment does not belong to you."
            )


        allowed_statuses = [
            Appointment.Status.IN_CONSULTATION,
            Appointment.Status.COMPLETED,
        ]


        if (
            appointment.status
            not in allowed_statuses
        ):

            raise serializers.ValidationError(
                (
                    "Medical records can only be created "
                    "during or after a consultation."
                )
            )


        if (
            MedicalRecord.objects
            .filter(
                appointment=
                    appointment
            )
            .exists()
        ):

            raise serializers.ValidationError(
                "A medical record already exists for this appointment."
            )


        return appointment


    def create(
        self,
        validated_data,
    ):

        request = (
            self.context[
                "request"
            ]
        )


        doctor = (
            request.user
            .doctor_profile
        )


        appointment = (
            validated_data[
                "appointment"
            ]
        )


        return (
            MedicalRecord.objects
            .create(
                patient=
                    appointment.patient,

                doctor=
                    doctor,

                **validated_data,
            )
        )


# ============================================================
# PRESCRIPTION MEDICINE SERIALIZER
# ============================================================

class PrescriptionMedicineSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = PrescriptionMedicine

        fields = [
            "id",
            "medicine_name",
            "dosage",
            "frequency",
            "duration",
            "food_instruction",
            "notes",
        ]

        read_only_fields = [
            "id",
        ]


# ============================================================
# PRESCRIPTION SERIALIZER
# ============================================================

class PrescriptionSerializer(
    serializers.ModelSerializer
):

    medicines = PrescriptionMedicineSerializer(
        many=True,
    )

    patient_name = (
        serializers.SerializerMethodField()
    )

    doctor_name = (
        serializers.SerializerMethodField()
    )

    diagnosis = serializers.CharField(
        source=
            "medical_record.diagnosis",
        read_only=True,
    )

    appointment_date = serializers.DateField(
        source=
            "medical_record.appointment.appointment_date",
        read_only=True,
    )

    created_at_display = (
        serializers.SerializerMethodField()
    )


    class Meta:

        model = Prescription

        fields = [
            "id",

            "medical_record",

            "patient",
            "patient_name",

            "doctor",
            "doctor_name",

            "diagnosis",
            "appointment_date",

            "advice",

            "medicines",

            "created_at",
            "created_at_display",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "diagnosis",
            "appointment_date",
            "created_at",
            "created_at_display",
            "updated_at",
        ]


    def get_patient_name(
        self,
        obj,
    ):

        name = (
            obj.patient
            .get_full_name()
        )

        return (
            name or
            obj.patient.username
        )


    def get_doctor_name(
        self,
        obj,
    ):

        name = (
            obj.doctor.user
            .get_full_name()
        )

        return (
            name or
            obj.doctor.user.username
        )


    def get_created_at_display(
        self,
        obj,
    ):

        return timezone.localtime(
            obj.created_at
        ).strftime(
            "%d %b %Y, %I:%M %p"
        )


    def validate_medical_record(
        self,
        medical_record,
    ):

        request = self.context.get(
            "request"
        )


        if not request:

            return medical_record


        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Exception:

            raise serializers.ValidationError(
                "Doctor profile not found."
            )


        if (
            medical_record.doctor !=
            doctor
        ):

            raise serializers.ValidationError(
                "This medical record does not belong to you."
            )


        if (
            Prescription.objects
            .filter(
                medical_record=
                    medical_record
            )
            .exists()
        ):

            raise serializers.ValidationError(
                "A prescription already exists for this medical record."
            )


        return medical_record


    def validate_medicines(
        self,
        medicines,
    ):

        if not medicines:

            raise serializers.ValidationError(
                "At least one medicine is required."
            )


        if len(medicines) > 20:

            raise serializers.ValidationError(
                "Maximum 20 medicines are allowed."
            )


        return medicines


    def create(
        self,
        validated_data,
    ):

        medicines_data = (
            validated_data.pop(
                "medicines"
            )
        )


        request = self.context[
            "request"
        ]


        doctor = (
            request.user
            .doctor_profile
        )


        medical_record = (
            validated_data[
                "medical_record"
            ]
        )


        prescription = (
            Prescription.objects
            .create(
                patient=
                    medical_record.patient,

                doctor=
                    doctor,

                **validated_data,
            )
        )


        for medicine_data in medicines_data:

            PrescriptionMedicine.objects.create(
                prescription=
                    prescription,

                **medicine_data,
            )


        return prescription


# ============================================================
# COMPLETE CONSULTATION - MEDICINE INPUT
# ============================================================

class ConsultationMedicineInputSerializer(
    serializers.Serializer
):

    medicine_name = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    dosage = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    frequency = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    duration = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    food_instruction = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        trim_whitespace=True,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        trim_whitespace=True,
    )


# ============================================================
# COMPLETE CONSULTATION SERIALIZER
# ============================================================

class CompleteConsultationSerializer(
    serializers.Serializer
):

    appointment = serializers.PrimaryKeyRelatedField(
        queryset=
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .all()
    )

    symptoms = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    diagnosis = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    clinical_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        trim_whitespace=True,
    )

    follow_up_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    advice = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        trim_whitespace=True,
    )

    medicines = ConsultationMedicineInputSerializer(
        many=True,
        required=False,
        default=list,
    )


    def validate_appointment(
        self,
        appointment,
    ):

        request = (
            self.context.get(
                "request"
            )
        )


        if not request:

            raise serializers.ValidationError(
                "Request context is required."
            )


        try:

            doctor = (
                request.user
                .doctor_profile
            )

        except Exception:

            raise serializers.ValidationError(
                "Doctor profile not found."
            )


        if (
            appointment.doctor !=
            doctor
        ):

            raise serializers.ValidationError(
                "This appointment does not belong to you."
            )


        if (
            appointment.status !=
            Appointment.Status.IN_CONSULTATION
        ):

            raise serializers.ValidationError(
                (
                    "Only appointments currently in consultation "
                    "can be completed."
                )
            )


        if (
            MedicalRecord.objects
            .filter(
                appointment=
                    appointment
            )
            .exists()
        ):

            raise serializers.ValidationError(
                (
                    "A medical record already exists "
                    "for this appointment."
                )
            )


        return appointment


    def validate_medicines(
        self,
        medicines,
    ):

        if len(medicines) > 20:

            raise serializers.ValidationError(
                "Maximum 20 medicines are allowed."
            )


        return medicines

# ============================================================
# PATIENT MEDICAL FILE SERIALIZER
# ============================================================

class PatientMedicalFileSerializer(serializers.ModelSerializer):

    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    file_type_display = serializers.CharField(
        source="get_file_type_display",
        read_only=True,
    )

    file_url = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()

    class Meta:
        model = PatientMedicalFile

        fields = [
            "id",
            "patient",
            "patient_name",
            "file_type",
            "file_type_display",
            "title",
            "description",
            "document_date",
            "file",
            "file_url",
            "doctor",
            "doctor_name",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "created_at_display",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "patient_name",
            "file_type_display",
            "file_url",
            "doctor_name",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "created_at_display",
            "updated_at",
        ]

        extra_kwargs = {
            "file": {
                "write_only": True,
            },
        }

    def get_patient_name(self, obj):
        name = obj.patient.get_full_name().strip()
        return name or obj.patient.username

    def get_doctor_name(self, obj):
        if not obj.doctor:
            return None

        name = obj.doctor.user.get_full_name().strip()
        return name or obj.doctor.user.username

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None

        name = obj.uploaded_by.get_full_name().strip()
        return name or obj.uploaded_by.username

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.file.url)

        return obj.file.url

    def get_created_at_display(self, obj):
        return timezone.localtime(
            obj.created_at
        ).strftime(
            "%d %b %Y, %I:%M %p"
        )

    def validate_patient(self, patient):
        if getattr(patient, "role", None) != "PATIENT":
            raise serializers.ValidationError(
                "Selected user is not a patient."
            )

        if not patient.is_active:
            raise serializers.ValidationError(
                "Selected patient account is inactive."
            )

        return patient

    def validate_file(self, uploaded_file):
        max_size = 10 * 1024 * 1024

        if uploaded_file.size > max_size:
            raise serializers.ValidationError(
                "Maximum file size is 10 MB."
            )

        file_name = uploaded_file.name.lower()
        allowed_extensions = (
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
        )

        if not file_name.endswith(allowed_extensions):
            raise serializers.ValidationError(
                "Only PDF, JPG, JPEG and PNG files are allowed."
            )

        allowed_content_types = {
            "application/pdf",
            "image/jpeg",
            "image/png",
        }

        content_type = getattr(
            uploaded_file,
            "content_type",
            None,
        )

        if (
            content_type
            and content_type not in allowed_content_types
        ):
            raise serializers.ValidationError(
                "Unsupported file type."
            )

        return uploaded_file

    def create(self, validated_data):
        request = self.context.get("request")

        if not request:
            raise serializers.ValidationError(
                "Request context is required."
            )

        validated_data["uploaded_by"] = request.user

        return PatientMedicalFile.objects.create(
            **validated_data
        )

