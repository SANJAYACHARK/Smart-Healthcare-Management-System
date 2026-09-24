from datetime import (
    datetime,
    timedelta,
)

from django.utils import timezone

from rest_framework import status

from rest_framework.response import (
    Response,
)

from rest_framework.views import (
    APIView,
)

from accounts.models import (
    Doctor,
)

from accounts.permissions import (
    IsPatientRole,
    IsDoctorRole,
    IsReceptionistRole,
)

from .models import (
    Appointment,
    DoctorAvailability,
)

from .serializers import (
    AppointmentDoctorSerializer,
    AppointmentSerializer,
    BookAppointmentSerializer,
    DoctorAvailabilitySerializer,
)


from .notifications import (
    notify_doctor_new_appointment,
    notify_doctor_patient_cancelled,
    notify_patient_appointment_confirmed,
    notify_patient_appointment_rejected,
)


from notifications.events import (
    notify_in_app_check_in,
    notify_in_app_doctor_new_appointment,
    notify_in_app_doctor_patient_cancelled,
    notify_in_app_patient_confirmed,
    notify_in_app_patient_consultation_completed,
    notify_in_app_patient_consultation_started,
    notify_in_app_patient_receptionist_cancelled,
    notify_in_app_patient_rejected,
)

from queue_management.services import (
    ensure_queue_ticket_for_appointment,
    sync_queue_ticket_with_appointment,
)


# ============================================================
# HELPER
# ============================================================

def get_doctor_profile(user):
    """
    Return the Doctor profile belonging to
    the authenticated doctor user.

    Returns None when no doctor profile exists.
    """

    try:

        return user.doctor_profile

    except Doctor.DoesNotExist:

        return None


# ============================================================
# PATIENT - AVAILABLE DOCTORS
# ============================================================

class AvailableDoctorListView(APIView):

    permission_classes = [
        IsPatientRole
    ]


    def get(
        self,
        request,
    ):

        doctors = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .filter(
                user__is_active=True,
                is_available=True,
            )
            .order_by(
                "user__first_name",
                "user__last_name",
            )
        )


        serializer = (
            AppointmentDoctorSerializer(
                doctors,
                many=True,
            )
        )


        return Response(
            {
                "count":
                    doctors.count(),

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# PATIENT - BOOK APPOINTMENT
# ============================================================

class BookAppointmentView(APIView):

    permission_classes = [
        IsPatientRole
    ]


    def post(
        self,
        request,
    ):

        serializer = (
            BookAppointmentSerializer(
                data=request.data,
                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        appointment = (
            serializer.save()
        )


        # Notify the doctor only after the appointment
        # has been created successfully.
        notify_doctor_new_appointment(
            appointment
        )

        notify_in_app_doctor_new_appointment(
            appointment
        )


        return Response(
            {
                "message":
                    "Appointment booked successfully.",

                "appointment":
                    AppointmentSerializer(
                        appointment
                    ).data,
            },
            status=
                status.HTTP_201_CREATED,
        )


# ============================================================
# PATIENT - MY APPOINTMENTS
# ============================================================

class PatientAppointmentListView(APIView):

    permission_classes = [
        IsPatientRole
    ]


    def get(
        self,
        request,
    ):

        appointments = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                patient=request.user
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
# PATIENT - CANCEL APPOINTMENT
# ============================================================

class CancelAppointmentView(APIView):

    permission_classes = [
        IsPatientRole
    ]


    def patch(
        self,
        request,
        appointment_id,
    ):

        appointment = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                id=appointment_id,
                patient=request.user,
            )
            .first()
        )


        if not appointment:

            return Response(
                {
                    "detail":
                        "Appointment not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        allowed_statuses = [
            Appointment.Status.PENDING,
            Appointment.Status.CONFIRMED,
        ]


        if (
            appointment.status
            not in allowed_statuses
        ):

            return Response(
                {
                    "detail":
                        (
                            "This appointment "
                            "can no longer be cancelled."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        appointment.status = (
            Appointment.Status.CANCELLED
        )


        appointment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


        notify_doctor_patient_cancelled(
            appointment
        )

        notify_in_app_doctor_patient_cancelled(
            appointment
        )


        return Response(
            {
                "message":
                    "Appointment cancelled successfully.",

                "appointment":
                    AppointmentSerializer(
                        appointment
                    ).data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# PATIENT - DOCTOR AVAILABLE TIME SLOTS
# ============================================================

class DoctorAvailableSlotsView(APIView):

    permission_classes = [
        IsPatientRole
    ]


    def get(
        self,
        request,
        doctor_id,
    ):

        appointment_date_string = (
            request.query_params.get(
                "date"
            )
        )


        if not appointment_date_string:

            return Response(
                {
                    "detail":
                        (
                            "date query parameter "
                            "is required."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        try:

            selected_date = (
                datetime.strptime(
                    appointment_date_string,
                    "%Y-%m-%d",
                ).date()
            )

        except ValueError:

            return Response(
                {
                    "detail":
                        (
                            "Invalid date format. "
                            "Use YYYY-MM-DD."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        today = (
            timezone.localdate()
        )


        if (
            selected_date <
            today
        ):

            return Response(
                {
                    "detail":
                        "Cannot select a past date."
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        # doctor_id used by frontend is user ID

        doctor = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .filter(
                user__id=doctor_id,
                user__is_active=True,
                is_available=True,
            )
            .first()
        )


        if not doctor:

            return Response(
                {
                    "detail":
                        (
                            "Doctor not found "
                            "or unavailable."
                        )
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        day_of_week = (
            selected_date.weekday()
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

            return Response(
                {
                    "doctor_id":
                        doctor_id,

                    "date":
                        selected_date.isoformat(),

                    "available_slots":
                        [],
                },
                status=
                    status.HTTP_200_OK,
            )


        booked_times = set(
            Appointment.objects
            .filter(
                doctor=doctor,
                appointment_date=
                    selected_date,
                status__in=[
                    Appointment.Status.PENDING,
                    Appointment.Status.CONFIRMED,
                    Appointment.Status.CHECKED_IN,
                    Appointment.Status.IN_CONSULTATION,
                ],
            )
            .values_list(
                "appointment_time",
                flat=True,
            )
        )


        available_slots = []


        current_local_time = (
            timezone.localtime()
            .time()
        )


        for availability in (
            availability_records
        ):

            current_datetime = (
                datetime.combine(
                    selected_date,
                    availability.start_time,
                )
            )


            ending_datetime = (
                datetime.combine(
                    selected_date,
                    availability.end_time,
                )
            )


            slot_duration = (
                timedelta(
                    minutes=
                        availability.slot_duration
                )
            )


            while (
                current_datetime <
                ending_datetime
            ):

                slot_end_datetime = (
                    current_datetime +
                    slot_duration
                )


                if (
                    slot_end_datetime >
                    ending_datetime
                ):

                    break


                slot_time = (
                    current_datetime.time()
                )


                is_future = True


                if (
                    selected_date ==
                    today
                ):

                    if (
                        slot_time <=
                        current_local_time
                    ):

                        is_future = False


                if (
                    slot_time not in
                    booked_times
                    and is_future
                ):

                    available_slots.append(
                        slot_time.strftime(
                            "%H:%M"
                        )
                    )


                current_datetime += (
                    slot_duration
                )


        return Response(
            {
                "doctor_id":
                    doctor_id,

                "date":
                    selected_date.isoformat(),

                "available_slots":
                    available_slots,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# DOCTOR - ALL APPOINTMENTS
# ============================================================

class DoctorAppointmentListView(APIView):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

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
                "doctor__department",
            )
            .filter(
                doctor=doctor
            )
            .order_by(
                "appointment_date",
                "appointment_time",
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
# DOCTOR - APPOINTMENT DETAIL
# ============================================================

class DoctorAppointmentDetailView(APIView):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
        appointment_id,
    ):

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        appointment = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                id=appointment_id,
                doctor=doctor,
            )
            .first()
        )


        if not appointment:

            return Response(
                {
                    "detail":
                        "Appointment not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        serializer = (
            AppointmentSerializer(
                appointment
            )
        )


        return Response(
            serializer.data,
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# DOCTOR - TODAY'S APPOINTMENTS
# ============================================================

class DoctorTodayAppointmentsView(APIView):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        today = (
            timezone.localdate()
        )


        appointments = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                doctor=doctor,
                appointment_date=
                    today,
            )
            .exclude(
                status=
                    Appointment.Status.CANCELLED
            )
            .order_by(
                "appointment_time"
            )
        )


        serializer = (
            AppointmentSerializer(
                appointments,
                many=True,
            )
        )


        stats = {

            "total":
                appointments.count(),

            "pending":
                appointments.filter(
                    status=
                        Appointment.Status.PENDING
                ).count(),

            "confirmed":
                appointments.filter(
                    status=
                        Appointment.Status.CONFIRMED
                ).count(),

            "checked_in":
                appointments.filter(
                    status=
                        Appointment.Status.CHECKED_IN
                ).count(),

            "in_consultation":
                appointments.filter(
                    status=
                        Appointment.Status.IN_CONSULTATION
                ).count(),

            "completed":
                appointments.filter(
                    status=
                        Appointment.Status.COMPLETED
                ).count(),
        }


        return Response(
            {
                "stats":
                    stats,

                "results":
                    serializer.data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# DOCTOR - UPDATE APPOINTMENT STATUS
# ============================================================

class DoctorAppointmentStatusView(APIView):

    permission_classes = [
        IsDoctorRole
    ]


    def patch(
        self,
        request,
        appointment_id,
    ):

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        appointment = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                id=appointment_id,
                doctor=doctor,
            )
            .first()
        )


        if not appointment:

            return Response(
                {
                    "detail":
                        "Appointment not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        new_status = (
            request.data.get(
                "status"
            )
        )


        if not new_status:

            return Response(
                {
                    "detail":
                        "Status is required."
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        # ----------------------------------------------------
        # STRICT DOCTOR WORKFLOW
        # ----------------------------------------------------

        valid_transitions = {

            # Doctor accepts or rejects a newly booked request.
            Appointment.Status.PENDING: [
                Appointment.Status.CONFIRMED,
                Appointment.Status.CANCELLED,
            ],

            # Consultation workflow after receptionist check-in.
            Appointment.Status.CHECKED_IN: [
                Appointment.Status.IN_CONSULTATION,
            ],

            Appointment.Status.IN_CONSULTATION: [
                Appointment.Status.COMPLETED,
            ],

        }


        allowed_next = (
            valid_transitions.get(
                appointment.status,
                [],
            )
        )


        if (
            new_status not in
            allowed_next
        ):

            return Response(
                {
                    "detail":
                        (
                            f"Cannot change appointment "
                            f"from {appointment.status} "
                            f"to {new_status}."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        # ----------------------------------------------------
        # ONLY ONE ACTIVE CONSULTATION PER DOCTOR
        # ----------------------------------------------------

        if (
            new_status ==
            Appointment.Status.IN_CONSULTATION
        ):

            another_consultation = (
                Appointment.objects
                .filter(
                    doctor=doctor,
                    status=
                        Appointment.Status.IN_CONSULTATION,
                )
                .exclude(
                    id=appointment.id
                )
                .exists()
            )


            if another_consultation:

                return Response(
                    {
                        "detail":
                            (
                                "You already have another "
                                "patient in consultation."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST,
                )


        appointment.status = (
            new_status
        )


        appointment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


        sync_queue_ticket_with_appointment(
            appointment
        )


        # Notify the patient when the doctor makes the
        # accept/reject decision.
        if (
            new_status ==
            Appointment.Status.CONFIRMED
        ):
            notify_patient_appointment_confirmed(
                appointment
            )

            notify_in_app_patient_confirmed(
                appointment
            )

        elif (
            new_status ==
            Appointment.Status.CANCELLED
        ):
            notify_patient_appointment_rejected(
                appointment
            )

            notify_in_app_patient_rejected(
                appointment
            )

        elif (
            new_status ==
            Appointment.Status.IN_CONSULTATION
        ):
            notify_in_app_patient_consultation_started(
                appointment
            )

        elif (
            new_status ==
            Appointment.Status.COMPLETED
        ):
            notify_in_app_patient_consultation_completed(
                appointment
            )


        return Response(
            {
                "message":
                    "Appointment status updated successfully.",

                "appointment":
                    AppointmentSerializer(
                        appointment
                    ).data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# DOCTOR - AVAILABILITY LIST + CREATE
# ============================================================

class DoctorAvailabilityListCreateView(APIView):

    permission_classes = [
        IsDoctorRole
    ]


    def get(
        self,
        request,
    ):

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        availability = (
            DoctorAvailability.objects
            .filter(
                doctor=doctor
            )
            .order_by(
                "day_of_week",
                "start_time",
            )
        )


        serializer = (
            DoctorAvailabilitySerializer(
                availability,
                many=True,
            )
        )


        return Response(
            {
                "count":
                    availability.count(),

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

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor profile not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        serializer = (
            DoctorAvailabilitySerializer(
                data=request.data,
                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        availability = (
            serializer.save(
                doctor=doctor
            )
        )


        return Response(
            {
                "message":
                    "Availability created successfully.",

                "availability":
                    DoctorAvailabilitySerializer(
                        availability
                    ).data,
            },
            status=
                status.HTTP_201_CREATED,
        )


# ============================================================
# DOCTOR - AVAILABILITY DETAIL
# ============================================================

class DoctorAvailabilityDetailView(APIView):

    permission_classes = [
        IsDoctorRole
    ]


    def get_object(
        self,
        request,
        availability_id,
    ):

        doctor = (
            get_doctor_profile(
                request.user
            )
        )


        if not doctor:

            return None


        return (
            DoctorAvailability.objects
            .filter(
                id=availability_id,
                doctor=doctor,
            )
            .first()
        )


    def get(
        self,
        request,
        availability_id,
    ):

        availability = (
            self.get_object(
                request,
                availability_id,
            )
        )


        if not availability:

            return Response(
                {
                    "detail":
                        "Availability not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        serializer = (
            DoctorAvailabilitySerializer(
                availability
            )
        )


        return Response(
            serializer.data,
            status=
                status.HTTP_200_OK,
        )


    def put(
        self,
        request,
        availability_id,
    ):

        availability = (
            self.get_object(
                request,
                availability_id,
            )
        )


        if not availability:

            return Response(
                {
                    "detail":
                        "Availability not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        serializer = (
            DoctorAvailabilitySerializer(
                availability,
                data=request.data,
                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        availability = (
            serializer.save()
        )


        return Response(
            {
                "message":
                    "Availability updated successfully.",

                "availability":
                    DoctorAvailabilitySerializer(
                        availability
                    ).data,
            },
            status=
                status.HTTP_200_OK,
        )


    def patch(
        self,
        request,
        availability_id,
    ):

        availability = (
            self.get_object(
                request,
                availability_id,
            )
        )


        if not availability:

            return Response(
                {
                    "detail":
                        "Availability not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        serializer = (
            DoctorAvailabilitySerializer(
                availability,
                data=request.data,
                partial=True,
                context={
                    "request":
                        request,
                },
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        availability = (
            serializer.save()
        )


        return Response(
            {
                "message":
                    "Availability updated successfully.",

                "availability":
                    DoctorAvailabilitySerializer(
                        availability
                    ).data,
            },
            status=
                status.HTTP_200_OK,
        )


    def delete(
        self,
        request,
        availability_id,
    ):

        availability = (
            self.get_object(
                request,
                availability_id,
            )
        )


        if not availability:

            return Response(
                {
                    "detail":
                        "Availability not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        availability.delete()


        return Response(
            status=
                status.HTTP_204_NO_CONTENT,
        )


# ============================================================
# RECEPTIONIST - ALL APPOINTMENTS
# ============================================================

class ReceptionistAppointmentListView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]


    def get(
        self,
        request,
    ):

        appointments = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
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
# RECEPTIONIST - UPDATE APPOINTMENT STATUS
# ============================================================

class ReceptionistAppointmentStatusView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]


    def patch(
        self,
        request,
        appointment_id,
    ):

        appointment = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                id=appointment_id
            )
            .first()
        )


        if not appointment:

            return Response(
                {
                    "detail":
                        "Appointment not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND,
            )


        new_status = (
            request.data.get(
                "status"
            )
        )


        if not new_status:

            return Response(
                {
                    "detail":
                        "Status is required."
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        valid_transitions = {

            # Confirmation is now performed by the doctor.
            # Receptionist handles arrival/check-in afterwards.
            Appointment.Status.CONFIRMED: [
                Appointment.Status.CHECKED_IN,
                Appointment.Status.CANCELLED,
            ],

        }


        allowed_next = (
            valid_transitions.get(
                appointment.status,
                [],
            )
        )


        if (
            new_status not in
            allowed_next
        ):

            return Response(
                {
                    "detail":
                        (
                            f"Cannot change appointment "
                            f"from {appointment.status} "
                            f"to {new_status}."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        appointment.status = (
            new_status
        )


        appointment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


        if (
            new_status ==
            Appointment.Status.CHECKED_IN
        ):
            ensure_queue_ticket_for_appointment(
                appointment,
                created_by=request.user,
            )

            notify_in_app_check_in(
                appointment
            )

        elif (
            new_status ==
            Appointment.Status.CANCELLED
        ):
            sync_queue_ticket_with_appointment(
                appointment
            )

            notify_in_app_patient_receptionist_cancelled(
                appointment
            )


        return Response(
            {
                "message":
                    "Appointment status updated successfully.",

                "appointment":
                    AppointmentSerializer(
                        appointment
                    ).data,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# RECEPTIONIST - DASHBOARD
# ============================================================

class ReceptionistDashboardView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]


    def get(
        self,
        request,
    ):

        today = (
            timezone.localdate()
        )


        todays_appointments = (
            Appointment.objects
            .filter(
                appointment_date=
                    today
            )
        )


        waiting_patients = (
            todays_appointments
            .filter(
                status=
                    Appointment.Status.CONFIRMED
            )
            .count()
        )


        checked_in_patients = (
            todays_appointments
            .filter(
                status=
                    Appointment.Status.CHECKED_IN
            )
            .count()
        )


        completed_today = (
            todays_appointments
            .filter(
                status=
                    Appointment.Status.COMPLETED
            )
            .count()
        )


        doctors = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .filter(
                user__is_active=True
            )
            .order_by(
                "user__first_name",
                "user__last_name",
            )
        )


        doctor_status = []

        available_doctors = 0

        consulting_doctors = 0


        for doctor in doctors:

            current_appointment = (
                Appointment.objects
                .select_related(
                    "patient"
                )
                .filter(
                    doctor=doctor,
                    appointment_date=
                        today,
                    status=
                        Appointment.Status.IN_CONSULTATION,
                )
                .order_by(
                    "appointment_time"
                )
                .first()
            )


            if current_appointment:

                status_label = (
                    "CONSULTING"
                )

                consulting_doctors += 1


                patient_name = (
                    current_appointment
                    .patient
                    .get_full_name()
                    .strip()
                )


                current_patient = (
                    patient_name or
                    current_appointment
                    .patient
                    .username
                )


                current_time = (
                    current_appointment
                    .appointment_time
                    .strftime(
                        "%H:%M"
                    )
                )


            elif doctor.is_available:

                status_label = (
                    "AVAILABLE"
                )

                available_doctors += 1

                current_patient = None

                current_time = None


            else:

                status_label = (
                    "UNAVAILABLE"
                )

                current_patient = None

                current_time = None


            doctor_name = (
                doctor.user
                .get_full_name()
                .strip()
            )


            doctor_status.append(
                {
                    "id":
                        doctor.user.id,

                    "name":
                        (
                            doctor_name or
                            doctor.user.username
                        ),

                    "specialization":
                        doctor.specialization,

                    "department":
                        (
                            doctor.department.name
                            if doctor.department
                            else None
                        ),

                    "status":
                        status_label,

                    "current_patient":
                        current_patient,

                    "current_appointment_time":
                        current_time,
                }
            )


        return Response(
            {
                "stats": {

                    "todays_appointments":
                        todays_appointments
                        .exclude(
                            status=
                                Appointment.Status.CANCELLED
                        )
                        .count(),

                    "waiting_patients":
                        waiting_patients,

                    "checked_in_patients":
                        checked_in_patients,

                    "available_doctors":
                        available_doctors,

                    "consulting_doctors":
                        consulting_doctors,

                    "completed_today":
                        completed_today,
                },

                "doctor_status":
                    doctor_status,
            },
            status=
                status.HTTP_200_OK,
        )


# ============================================================
# RECEPTIONIST - DOCTOR STATUS BOARD
# ============================================================

class ReceptionistDoctorStatusView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]


    def get(
        self,
        request,
    ):

        today = (
            timezone.localdate()
        )


        current_time = (
            timezone.localtime()
            .time()
        )


        doctors = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .filter(
                user__is_active=True
            )
            .order_by(
                "user__first_name",
                "user__last_name",
            )
        )


        results = []


        for doctor in doctors:

            # ------------------------------------------------
            # CURRENT CONSULTATION
            # ------------------------------------------------

            current_appointment = (
                Appointment.objects
                .select_related(
                    "patient"
                )
                .filter(
                    doctor=doctor,
                    appointment_date=
                        today,
                    status=
                        Appointment.Status.IN_CONSULTATION,
                )
                .order_by(
                    "appointment_time"
                )
                .first()
            )


            # ------------------------------------------------
            # WAITING PATIENT COUNT
            # ------------------------------------------------

            waiting_patients = (
                Appointment.objects
                .filter(
                    doctor=doctor,
                    appointment_date=
                        today,
                    status=
                        Appointment.Status.CHECKED_IN,
                )
                .count()
            )


            # ------------------------------------------------
            # NEXT APPOINTMENT
            # ------------------------------------------------

            next_appointment = (
                Appointment.objects
                .select_related(
                    "patient"
                )
                .filter(
                    doctor=doctor,
                    appointment_date=
                        today,
                    appointment_time__gte=
                        current_time,
                    status__in=[
                        Appointment.Status.PENDING,
                        Appointment.Status.CONFIRMED,
                        Appointment.Status.CHECKED_IN,
                    ],
                )
                .order_by(
                    "appointment_time"
                )
                .first()
            )


            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------

            if current_appointment:

                status_label = (
                    "BUSY"
                )

            elif doctor.is_available:

                status_label = (
                    "AVAILABLE"
                )

            else:

                status_label = (
                    "OFFLINE"
                )


            current_patient = None


            if current_appointment:

                patient_name = (
                    current_appointment
                    .patient
                    .get_full_name()
                    .strip()
                )


                current_patient = (
                    patient_name or
                    current_appointment
                    .patient
                    .username
                )


            doctor_name = (
                doctor.user
                .get_full_name()
                .strip()
            )


            results.append(
                {
                    "id":
                        doctor.user.id,

                    "name":
                        (
                            doctor_name or
                            doctor.user.username
                        ),

                    "specialization":
                        doctor.specialization,

                    "department":
                        (
                            doctor.department.name
                            if doctor.department
                            else None
                        ),

                    "status":
                        status_label,

                    "current_patient":
                        current_patient,

                    "waiting_patients":
                        waiting_patients,

                    "next_appointment_time":
                        (
                            next_appointment
                            .appointment_time
                            .strftime(
                                "%H:%M"
                            )
                            if next_appointment
                            else None
                        ),

                    "next_patient":
                        (
                            (
                                next_appointment
                                .patient
                                .get_full_name()
                                .strip()
                                or
                                next_appointment
                                .patient
                                .username
                            )
                            if next_appointment
                            else None
                        ),
                }
            )


        return Response(
            {
                "count":
                    len(
                        results
                    ),

                "results":
                    results,
            },
            status=
                status.HTTP_200_OK,
        )