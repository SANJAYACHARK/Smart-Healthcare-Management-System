from datetime import (
    datetime,
    timedelta,
)

from django.utils import timezone

from rest_framework import serializers

from accounts.models import Doctor

from .models import (
    Appointment,
    DoctorAvailability,
)


# ============================================================
# DOCTOR LIST SERIALIZER
# Used when patients are viewing doctors for appointment booking
# ============================================================

class AppointmentDoctorSerializer(
    serializers.ModelSerializer
):

    id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        allow_null=True,
    )

    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True,
    )


    class Meta:

        model = Doctor

        fields = [
            "id",

            "first_name",
            "last_name",

            "department",
            "department_name",

            "specialization",
            "experience_years",
            "consultation_fee",

            "is_available",
            "is_active",
        ]


# ============================================================
# APPOINTMENT SERIALIZER
# ============================================================

class AppointmentSerializer(
    serializers.ModelSerializer
):

    # --------------------------------------------------------
    # PATIENT INFORMATION
    # --------------------------------------------------------

    patient_id = serializers.IntegerField(
        source="patient.id",
        read_only=True,
    )

    patient_name = serializers.SerializerMethodField()

    patient_username = serializers.CharField(
        source="patient.username",
        read_only=True,
    )

    patient_email = serializers.EmailField(
        source="patient.email",
        read_only=True,
        allow_blank=True,
        allow_null=True,
    )


    # --------------------------------------------------------
    # DOCTOR INFORMATION
    # --------------------------------------------------------

    doctor_name = serializers.SerializerMethodField()

    doctor_specialization = serializers.CharField(
        source="doctor.specialization",
        read_only=True,
    )

    department = serializers.IntegerField(
        source="doctor.department.id",
        read_only=True,
        allow_null=True,
    )

    department_name = serializers.CharField(
        source="doctor.department.name",
        read_only=True,
        allow_null=True,
    )


    class Meta:

        model = Appointment

        fields = [
            "id",

            # Patient
            "patient",
            "patient_id",
            "patient_name",
            "patient_username",
            "patient_email",

            # Doctor
            "doctor",
            "doctor_name",
            "doctor_specialization",
            "department",
            "department_name",

            # Appointment
            "appointment_date",
            "appointment_time",
            "reason",
            "status",

            # Notes
            "receptionist_notes",
            "doctor_notes",

            # Metadata
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",

            "patient",
            "patient_id",
            "patient_name",
            "patient_username",
            "patient_email",

            "doctor_name",
            "doctor_specialization",
            "department",
            "department_name",

            "status",

            "receptionist_notes",
            "doctor_notes",

            "created_at",
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


# ============================================================
# BOOK APPOINTMENT SERIALIZER
# ============================================================

class BookAppointmentSerializer(
    serializers.Serializer
):

    doctor_id = serializers.IntegerField()

    appointment_date = serializers.DateField()

    appointment_time = serializers.TimeField()

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )


    # --------------------------------------------------------
    # VALIDATE DOCTOR
    # --------------------------------------------------------

    def validate_doctor_id(
        self,
        value,
    ):

        doctor = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .filter(
                user__id=value,
                user__is_active=True,
                is_available=True,
            )
            .first()
        )


        if not doctor:

            raise serializers.ValidationError(
                "Doctor is not available."
            )


        return value


    # --------------------------------------------------------
    # VALIDATE DATE
    # --------------------------------------------------------

    def validate_appointment_date(
        self,
        value,
    ):

        if (
            value <
            timezone.localdate()
        ):

            raise serializers.ValidationError(
                "Appointment date cannot be in the past."
            )


        return value


    # --------------------------------------------------------
    # FULL VALIDATION
    # --------------------------------------------------------

    def validate(
        self,
        attrs,
    ):

        doctor = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .get(
                user__id=
                    attrs["doctor_id"]
            )
        )


        appointment_date = (
            attrs[
                "appointment_date"
            ]
        )


        appointment_time = (
            attrs[
                "appointment_time"
            ]
        )


        # ====================================================
        # PREVENT BOOKING PAST TIME TODAY
        # ====================================================

        if (
            appointment_date ==
            timezone.localdate()
        ):

            current_time = (
                timezone.localtime()
                .time()
            )


            if (
                appointment_time <=
                current_time
            ):

                raise serializers.ValidationError(
                    {
                        "appointment_time":
                            "Appointment time must be in the future."
                    }
                )


        # ====================================================
        # CHECK DOCTOR AVAILABILITY
        # ====================================================

        day_of_week = (
            appointment_date.weekday()
        )


        availability_records = (
            DoctorAvailability.objects
            .filter(
                doctor=doctor,
                day_of_week=
                    day_of_week,
                is_active=True,
            )
            .order_by(
                "start_time"
            )
        )


        if (
            not availability_records.exists()
        ):

            raise serializers.ValidationError(
                {
                    "appointment_time":
                        "Doctor is not available on this day."
                }
            )


        valid_slot = False


        for availability in (
            availability_records
        ):

            current_datetime = (
                datetime.combine(
                    appointment_date,
                    availability.start_time,
                )
            )


            ending_datetime = (
                datetime.combine(
                    appointment_date,
                    availability.end_time,
                )
            )


            while (
                current_datetime <
                ending_datetime
            ):

                slot_end = (
                    current_datetime +
                    timedelta(
                        minutes=
                            availability
                            .slot_duration
                    )
                )


                if (
                    slot_end >
                    ending_datetime
                ):

                    break


                if (
                    current_datetime.time() ==
                    appointment_time
                ):

                    valid_slot = True

                    break


                current_datetime += (
                    timedelta(
                        minutes=
                            availability
                            .slot_duration
                    )
                )


            if valid_slot:

                break


        if not valid_slot:

            raise serializers.ValidationError(
                {
                    "appointment_time":
                        "This time is not part of the doctor's available schedule."
                }
            )


        # ====================================================
        # PREVENT DUPLICATE SLOT BOOKING
        # ====================================================

        slot_exists = (
            Appointment.objects
            .filter(
                doctor=doctor,

                appointment_date=
                    appointment_date,

                appointment_time=
                    appointment_time,

                status__in=[
                    Appointment.Status.PENDING,
                    Appointment.Status.CONFIRMED,
                    Appointment.Status.CHECKED_IN,
                    Appointment.Status.IN_CONSULTATION,
                ],
            )
            .exists()
        )


        if slot_exists:

            raise serializers.ValidationError(
                {
                    "appointment_time":
                        "This appointment slot is already booked."
                }
            )


        attrs["doctor"] = doctor


        return attrs


    # --------------------------------------------------------
    # CREATE APPOINTMENT
    # --------------------------------------------------------

    def create(
        self,
        validated_data,
    ):

        doctor = (
            validated_data.pop(
                "doctor"
            )
        )


        validated_data.pop(
            "doctor_id"
        )


        patient = (
            self.context[
                "request"
            ].user
        )


        return (
            Appointment.objects
            .create(
                patient=patient,
                doctor=doctor,
                **validated_data,
            )
        )


# ============================================================
# DOCTOR AVAILABILITY SERIALIZER
# ============================================================

class DoctorAvailabilitySerializer(
    serializers.ModelSerializer
):

    day_name = serializers.CharField(
        source=
            "get_day_of_week_display",

        read_only=True,
    )


    class Meta:

        model = DoctorAvailability

        fields = [
            "id",

            "day_of_week",
            "day_name",

            "start_time",
            "end_time",

            "slot_duration",

            "is_active",
        ]

        read_only_fields = [
            "id",
            "day_name",
        ]


    # --------------------------------------------------------
    # VALIDATE SLOT DURATION
    # --------------------------------------------------------

    def validate_slot_duration(
        self,
        value,
    ):

        allowed = [
            15,
            20,
            30,
            45,
            60,
        ]


        if value not in allowed:

            raise serializers.ValidationError(
                "Invalid slot duration."
            )


        return value


    # --------------------------------------------------------
    # VALIDATE AVAILABILITY
    # --------------------------------------------------------

    def validate(
        self,
        attrs,
    ):

        start_time = (
            attrs.get(
                "start_time",
                getattr(
                    self.instance,
                    "start_time",
                    None,
                ),
            )
        )


        end_time = (
            attrs.get(
                "end_time",
                getattr(
                    self.instance,
                    "end_time",
                    None,
                ),
            )
        )


        # ====================================================
        # END MUST BE AFTER START
        # ====================================================

        if (
            start_time and
            end_time and
            start_time >= end_time
        ):

            raise serializers.ValidationError(
                {
                    "end_time":
                        "End time must be later than start time."
                }
            )


        request = (
            self.context.get(
                "request"
            )
        )


        if (
            request and
            request.user
            .is_authenticated
        ):

            try:

                doctor = (
                    request.user
                    .doctor_profile
                )

            except Doctor.DoesNotExist:

                raise serializers.ValidationError(
                    {
                        "detail":
                            "Doctor profile not found."
                    }
                )


            day_of_week = (
                attrs.get(
                    "day_of_week",
                    getattr(
                        self.instance,
                        "day_of_week",
                        None,
                    ),
                )
            )


            queryset = (
                DoctorAvailability.objects
                .filter(
                    doctor=doctor,
                    day_of_week=
                        day_of_week,
                )
            )


            if self.instance:

                queryset = (
                    queryset.exclude(
                        id=
                            self.instance.id
                    )
                )


            for existing in queryset:

                overlaps = (
                    start_time <
                    existing.end_time
                    and
                    end_time >
                    existing.start_time
                )


                if overlaps:

                    raise serializers.ValidationError(
                        {
                            "detail":
                                "This availability overlaps with an existing time period."
                        }
                    )


        return attrs