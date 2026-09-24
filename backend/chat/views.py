from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Doctor, User
from appointments.models import Appointment

from .models import (
    Conversation,
    Message,
)

from .serializers import (
    ConversationSerializer,
    MessageSerializer,
)


from notifications.events import (
    notify_in_app_chat_message,
)


# ============================================================
# HELPER - CHECK USER CAN ACCESS CONVERSATION
# ============================================================

def get_user_conversation(
    user,
    conversation_id,
):

    if user.role == User.Role.PATIENT:

        return (
            Conversation.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                id=conversation_id,
                patient=user,
            )
            .first()
        )


    if user.role == User.Role.DOCTOR:

        try:

            doctor = user.doctor_profile

        except Doctor.DoesNotExist:

            return None


        return (
            Conversation.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(
                id=conversation_id,
                doctor=doctor,
            )
            .first()
        )


    return None


# ============================================================
# CONVERSATIONS
# ============================================================

class ConversationListView(APIView):

    permission_classes = [
        IsAuthenticated
    ]


    def get(self, request):

        user = request.user


        # ====================================================
        # PATIENT
        # Create conversations automatically with doctors
        # the patient has had appointments with.
        # ====================================================

        if user.role == User.Role.PATIENT:

            doctor_ids = (
                Appointment.objects
                .filter(
                    patient=user
                )
                .exclude(
                    status=
                        Appointment.Status.CANCELLED
                )
                .values_list(
                    "doctor_id",
                    flat=True,
                )
                .distinct()
            )


            doctors = (
                Doctor.objects
                .filter(
                    id__in=doctor_ids,
                    user__is_active=True,
                )
            )


            for doctor in doctors:

                Conversation.objects.get_or_create(
                    patient=user,
                    doctor=doctor,
                )


            conversations = (
                Conversation.objects
                .select_related(
                    "patient",
                    "doctor",
                    "doctor__user",
                )
                .filter(
                    patient=user
                )
                .order_by(
                    "-updated_at"
                )
            )


        # ====================================================
        # DOCTOR
        # ====================================================

        elif user.role == User.Role.DOCTOR:

            try:

                doctor = user.doctor_profile

            except Doctor.DoesNotExist:

                return Response(
                    {
                        "detail":
                            "Doctor profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )


            patient_ids = (
                Appointment.objects
                .filter(
                    doctor=doctor
                )
                .exclude(
                    status=
                        Appointment.Status.CANCELLED
                )
                .values_list(
                    "patient_id",
                    flat=True,
                )
                .distinct()
            )


            patients = (
                User.objects
                .filter(
                    id__in=patient_ids,
                    role=User.Role.PATIENT,
                    is_active=True,
                )
            )


            for patient in patients:

                Conversation.objects.get_or_create(
                    patient=patient,
                    doctor=doctor,
                )


            conversations = (
                Conversation.objects
                .select_related(
                    "patient",
                    "doctor",
                    "doctor__user",
                )
                .filter(
                    doctor=doctor
                )
                .order_by(
                    "-updated_at"
                )
            )


        else:

            return Response(
                {
                    "detail":
                        "Only patients and doctors can use chat."
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        serializer = ConversationSerializer(
            conversations,
            many=True,
            context={
                "request": request,
            },
        )


        return Response(
            {
                "count":
                    conversations.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# CONVERSATION MESSAGES
# GET + SEND
# ============================================================

class ConversationMessageListCreateView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
        conversation_id,
    ):

        conversation = (
            get_user_conversation(
                request.user,
                conversation_id,
            )
        )


        if not conversation:

            return Response(
                {
                    "detail":
                        "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        messages = (
            Message.objects
            .select_related(
                "sender"
            )
            .filter(
                conversation=conversation
            )
            .order_by(
                "created_at"
            )
        )


        # Mark received messages as read
        (
            messages
            .exclude(
                sender=request.user
            )
            .filter(
                is_read=False
            )
            .update(
                is_read=True
            )
        )


        serializer = MessageSerializer(
            messages,
            many=True,
            context={
                "request": request,
            },
        )


        return Response(
            {
                "count":
                    messages.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    def post(
        self,
        request,
        conversation_id,
    ):

        conversation = (
            get_user_conversation(
                request.user,
                conversation_id,
            )
        )


        if not conversation:

            return Response(
                {
                    "detail":
                        "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        message_text = (
            request.data.get(
                "message",
                ""
            )
            .strip()
        )


        if not message_text:

            return Response(
                {
                    "message":
                        "Message cannot be empty."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if len(message_text) > 5000:

            return Response(
                {
                    "message":
                        "Message is too long."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            message=message_text,
        )


        notify_in_app_chat_message(
            conversation,
            message,
        )


        # Update conversation ordering
        conversation.save(
            update_fields=[
                "updated_at"
            ]
        )


        serializer = MessageSerializer(
            message,
            context={
                "request": request,
            },
        )


        return Response(
            {
                "message":
                    "Message sent successfully.",

                "data":
                    serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )