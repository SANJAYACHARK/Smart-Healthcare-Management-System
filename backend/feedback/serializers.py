from rest_framework import serializers

from appointments.models import Appointment

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):

    patient_name = serializers.SerializerMethodField()

    doctor_name = serializers.SerializerMethodField()

    appointment_date = serializers.DateField(
        source="appointment.appointment_date",
        read_only=True,
    )


    class Meta:

        model = Feedback

        fields = [
            "id",

            "appointment",

            "patient",
            "patient_name",

            "doctor",
            "doctor_name",

            "appointment_date",

            "rating",
            "comment",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "appointment_date",
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


    def validate_rating(
        self,
        value,
    ):

        if value < 1 or value > 5:

            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value


    def validate_appointment(
        self,
        appointment,
    ):

        request = self.context.get(
            "request"
        )

        if not request:

            return appointment


        if (
            appointment.patient !=
            request.user
        ):

            raise serializers.ValidationError(
                "This appointment does not belong to you."
            )


        if (
            appointment.status !=
            Appointment.Status.COMPLETED
        ):

            raise serializers.ValidationError(
                "Feedback can only be submitted after a completed appointment."
            )


        if Feedback.objects.filter(
            appointment=appointment
        ).exists():

            raise serializers.ValidationError(
                "Feedback has already been submitted for this appointment."
            )


        return appointment


    def create(
        self,
        validated_data,
    ):

        request = self.context[
            "request"
        ]

        appointment = validated_data[
            "appointment"
        ]

        return Feedback.objects.create(
            patient=request.user,
            doctor=appointment.doctor,
            **validated_data,
        )