from datetime import (
    date,
    datetime,
    timedelta,
)

from django.utils import timezone

from rest_framework import status

from rest_framework.permissions import (
    IsAuthenticated,
)

from rest_framework.response import (
    Response,
)

from rest_framework.views import (
    APIView,
)

from accounts.models import Doctor

from appointments.models import (
    Appointment,
    DoctorAvailability,
)

from .triage import (
    analyze_symptoms,
)

from .ai_service import (
    AIServiceError,
    generate_health_reply,
)

from .intent import (
    detect_chat_intent,
    get_static_reply,
)


class SymptomCheckerView(APIView):

    permission_classes = [
        IsAuthenticated
    ]


    # ========================================================
    # GENERATE SLOTS FOR ONE AVAILABILITY BLOCK
    # ========================================================

    def generate_slots(
        self,
        availability,
        target_date,
    ):

        slots = []

        current = datetime.combine(
            target_date,
            availability.start_time,
        )

        end = datetime.combine(
            target_date,
            availability.end_time,
        )


        duration = timedelta(
            minutes=
                availability.slot_duration
        )


        while (
            current + duration <= end
        ):

            slots.append(
                current.time()
            )

            current += duration


        return slots


    # ========================================================
    # FIND NEXT AVAILABLE SLOT
    # ========================================================

    def get_next_available_slot(
        self,
        doctor,
    ):

        today = timezone.localdate()

        now = timezone.localtime()


        # Search next 14 days

        for day_offset in range(14):

            target_date = (
                today +
                timedelta(
                    days=day_offset
                )
            )


            weekday = (
                target_date.weekday()
            )


            availability_blocks = (
                DoctorAvailability.objects
                .filter(
                    doctor=doctor,
                    day_of_week=weekday,
                    is_active=True,
                )
                .order_by(
                    "start_time"
                )
            )


            if not availability_blocks.exists():

                continue


            booked_times = set(
                Appointment.objects
                .filter(
                    doctor=doctor,
                    appointment_date=
                        target_date,
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


            for availability in (
                availability_blocks
            ):

                slots = (
                    self.generate_slots(
                        availability,
                        target_date,
                    )
                )


                for slot in slots:

                    # Already booked

                    if slot in booked_times:

                        continue


                    # Do not suggest past times today

                    if (
                        target_date == today
                    ):

                        slot_datetime = (
                            timezone.make_aware(
                                datetime.combine(
                                    target_date,
                                    slot,
                                ),
                                timezone.get_current_timezone(),
                            )
                        )


                        if (
                            slot_datetime <= now
                        ):

                            continue


                    return {
                        "date":
                            target_date
                            .isoformat(),

                        "time":
                            slot.strftime(
                                "%H:%M:%S"
                            ),

                        "display_date":
                            self.format_slot_date(
                                target_date
                            ),

                        "display_time":
                            datetime.combine(
                                target_date,
                                slot,
                            ).strftime(
                                "%I:%M %p"
                            ),
                    }


        return None


    # ========================================================
    # DATE DISPLAY
    # ========================================================

    def format_slot_date(
        self,
        target_date,
    ):

        today = timezone.localdate()

        tomorrow = (
            today +
            timedelta(days=1)
        )


        if target_date == today:

            return "Today"


        if target_date == tomorrow:

            return "Tomorrow"


        return target_date.strftime(
            "%d %b %Y"
        )


    # ========================================================
    # POST
    # ========================================================

    def post(
        self,
        request,
    ):

        message = (
            request.data
            .get(
                "message",
                ""
            )
            .strip()
        )


        if not message:

            return Response(
                {
                    "detail":
                        "Please describe your symptoms."
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        if len(message) > 1000:

            return Response(
                {
                    "detail":
                        "Message is too long."
                },
                status=
                    status.HTTP_400_BAD_REQUEST,
            )


        history = request.data.get(
            "history",
            []
        )


        if not isinstance(
            history,
            list,
        ):
            history = []


        intent = (
            detect_chat_intent(
                message,
                history=history,
            )
        )


        # ========================================================
        # CASUAL / NON-SYMPTOM CHAT
        # ========================================================

        static_reply = (
            get_static_reply(
                intent
            )
        )


        if static_reply:

            return Response(
                {
                    "reply":
                        static_reply,

                    "intent":
                        intent,

                    "department":
                        None,

                    "urgency":
                        None,

                    "emergency":
                        False,

                    "suggested_doctors":
                        [],

                    "ai_powered":
                        False,

                    "ai_fallback":
                        False,
                },
                status=
                    status.HTTP_200_OK,
            )


        # General non-medical questions should go to the AI
        # conversationally, but must NOT trigger department or
        # doctor recommendations.
        if intent == "GENERAL":

            try:

                ai_reply = (
                    generate_health_reply(
                        message,
                        history=history,
                        department=None,
                        urgency=None,
                        triage_guidance=None,
                        doctor_context=[],
                        medical_mode=False,
                    )
                )


                return Response(
                    {
                        "reply":
                            ai_reply,

                        "intent":
                            intent,

                        "department":
                            None,

                        "urgency":
                            None,

                        "emergency":
                            False,

                        "suggested_doctors":
                            [],

                        "ai_powered":
                            True,

                        "ai_fallback":
                            False,
                    },
                    status=
                        status.HTTP_200_OK,
                )


            except AIServiceError:

                return Response(
                    {
                        "reply":
                            (
                                "I'm here mainly to help with health guidance, "
                                "symptoms, departments, doctors and appointments. "
                                "Please describe what you need help with."
                            ),

                        "intent":
                            intent,

                        "department":
                            None,

                        "urgency":
                            None,

                        "emergency":
                            False,

                        "suggested_doctors":
                            [],

                        "ai_powered":
                            False,

                        "ai_fallback":
                            True,
                    },
                    status=
                        status.HTTP_200_OK,
                )


        result = (
            analyze_symptoms(
                message
            )
        )


        result[
            "intent"
        ] = intent


        department_name = (
            result.get(
                "department"
            )
        )


        # For short follow-up answers such as "since yesterday",
        # keep the conversation medical but avoid pretending that
        # the current message independently identifies a department.
        if (
            intent ==
            "FOLLOW_UP_MEDICAL"
        ):

            department_name = None


        if department_name:

            doctors = (
                Doctor.objects
                .select_related(
                    "user",
                    "department",
                )
                .filter(
                    user__is_active=True,
                    is_available=True,
                    department__is_active=True,
                    department__name__iexact=
                        department_name,
                )
                .order_by(
                    "-experience_years",
                    "user__first_name",
                )[:5]
            )

        else:

            doctors = []


        suggested_doctors = []


        for doctor in doctors:

            full_name = (
                doctor.user
                .get_full_name()
                .strip()
            )


            next_slot = (
                self.get_next_available_slot(
                    doctor
                )
            )


            suggested_doctors.append(
                {
                    "id":
                        doctor.user.id,

                    "doctor_profile_id":
                        doctor.id,

                    "name":
                        full_name or
                        doctor.user.username,

                    "first_name":
                        doctor.user.first_name,

                    "last_name":
                        doctor.user.last_name,

                    "specialization":
                        doctor.specialization,

                    "department":
                        (
                            doctor.department.id
                            if doctor.department
                            else None
                        ),

                    "department_name":
                        (
                            doctor.department.name
                            if doctor.department
                            else ""
                        ),

                    "experience_years":
                        doctor.experience_years,

                    "qualification":
                        doctor.qualification,

                    "consultation_fee":
                        str(
                            doctor.consultation_fee
                        ),

                    "is_available":
                        doctor.is_available,

                    "next_available_slot":
                        next_slot,
                }
            )


        # Put doctors with real slots first

        suggested_doctors.sort(
            key=lambda doctor:
                doctor[
                    "next_available_slot"
                ] is None
        )


        result[
            "suggested_doctors"
        ] = suggested_doctors


        # ========================================================
        # REAL AI CONVERSATIONAL RESPONSE
        # ========================================================

        # Emergency handling stays deterministic so an external
        # AI service delay can never suppress the urgent warning.
        if result.get(
            "emergency"
        ):

            result[
                "ai_powered"
            ] = False

            result[
                "ai_fallback"
            ] = False

            return Response(
                result,
                status=
                    status.HTTP_200_OK,
            )


        try:

            ai_reply = (
                generate_health_reply(
                    message,
                    history=history,
                    department=
                        (
                            None
                            if intent ==
                            "FOLLOW_UP_MEDICAL"
                            else result.get(
                                "department"
                            )
                        ),
                    urgency=
                        result.get(
                            "urgency"
                        ),
                    triage_guidance=
                        result.get(
                            "reply"
                        ),
                    doctor_context=
                        suggested_doctors,
                )
            )


            result[
                "reply"
            ] = ai_reply

            result[
                "ai_powered"
            ] = True

            result[
                "ai_fallback"
            ] = False


        except AIServiceError as exc:

            # Existing deterministic triage remains a safe
            # fallback when the external AI call is unavailable.
            result[
                "ai_powered"
            ] = False

            result[
                "ai_fallback"
            ] = True

            result[
                "ai_error"
            ] = str(
                exc
            )


        if (
            intent ==
            "FOLLOW_UP_MEDICAL"
        ):

            result[
                "department"
            ] = None

            result[
                "suggested_doctors"
            ] = []


        return Response(
            result,
            status=
                status.HTTP_200_OK,
        )
