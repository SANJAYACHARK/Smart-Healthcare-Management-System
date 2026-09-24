from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Doctor
from accounts.permissions import (
    IsDoctorRole,
    IsPatientRole,
    IsReceptionistRole,
)
from appointments.models import Appointment

from .models import QueueTicket
from .serializers import QueueTicketSerializer
from .services import (
    ACTIVE_QUEUE_STATUSES,
    call_ticket,
    ensure_queue_ticket_for_appointment,
    sync_queue_ticket_with_appointment,
)


def get_doctor_profile(user):
    try:
        return user.doctor_profile
    except Doctor.DoesNotExist:
        return None


def queue_stats(queryset):
    return {
        "total": queryset.count(),
        "waiting": queryset.filter(status=QueueTicket.Status.WAITING).count(),
        "called": queryset.filter(status=QueueTicket.Status.CALLED).count(),
        "in_service": queryset.filter(status=QueueTicket.Status.IN_SERVICE).count(),
        "completed": queryset.filter(status=QueueTicket.Status.COMPLETED).count(),
        "skipped": queryset.filter(status=QueueTicket.Status.SKIPPED).count(),
    }


class ReceptionistTodayQueueView(APIView):
    permission_classes = [IsReceptionistRole]

    def get(self, request):
        today = timezone.localdate()
        tickets = (
            QueueTicket.objects
            .select_related(
                "appointment",
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(queue_date=today)
        )

        doctor_id = request.query_params.get("doctor_id")
        if doctor_id:
            tickets = tickets.filter(doctor__user_id=doctor_id)

        return Response(
            {
                "date": today,
                "stats": queue_stats(tickets),
                "results": QueueTicketSerializer(tickets, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class ReceptionistCreateQueueTicketView(APIView):
    permission_classes = [IsReceptionistRole]

    def post(self, request, appointment_id):
        appointment = (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
            )
            .filter(id=appointment_id)
            .first()
        )

        if appointment is None:
            return Response(
                {"detail": "Appointment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            ticket, created = ensure_queue_ticket_for_appointment(
                appointment,
                created_by=request.user,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": (
                    "Queue token generated successfully."
                    if created
                    else "Queue token already exists."
                ),
                "ticket": QueueTicketSerializer(ticket).data,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class ReceptionistSkipQueueTicketView(APIView):
    permission_classes = [IsReceptionistRole]

    @transaction.atomic
    def patch(self, request, ticket_id):
        ticket = (
            QueueTicket.objects
            .select_for_update()
            .filter(id=ticket_id)
            .first()
        )

        if ticket is None:
            return Response(
                {"detail": "Queue ticket not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ticket.status not in [
            QueueTicket.Status.WAITING,
            QueueTicket.Status.CALLED,
        ]:
            return Response(
                {"detail": "Only waiting or called tokens can be skipped."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = QueueTicket.Status.SKIPPED
        ticket.skipped_at = timezone.now()
        ticket.save(
            update_fields=[
                "status",
                "skipped_at",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Token skipped successfully.",
                "ticket": QueueTicketSerializer(ticket).data,
            }
        )


class ReceptionistRestoreQueueTicketView(APIView):
    permission_classes = [IsReceptionistRole]

    @transaction.atomic
    def patch(self, request, ticket_id):
        ticket = (
            QueueTicket.objects
            .select_for_update()
            .filter(id=ticket_id)
            .first()
        )

        if ticket is None:
            return Response(
                {"detail": "Queue ticket not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ticket.status != QueueTicket.Status.SKIPPED:
            return Response(
                {"detail": "Only skipped tokens can be restored."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = QueueTicket.Status.WAITING
        ticket.skipped_at = None
        ticket.called_at = None
        ticket.save(
            update_fields=[
                "status",
                "skipped_at",
                "called_at",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Token restored to waiting queue.",
                "ticket": QueueTicketSerializer(ticket).data,
            }
        )


class DoctorTodayQueueView(APIView):
    permission_classes = [IsDoctorRole]

    def get(self, request):
        doctor = get_doctor_profile(request.user)
        if doctor is None:
            return Response(
                {"detail": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        today = timezone.localdate()
        tickets = (
            QueueTicket.objects
            .select_related(
                "appointment",
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                doctor=doctor,
                queue_date=today,
            )
        )

        now_serving = (
            tickets
            .filter(
                status__in=[
                    QueueTicket.Status.CALLED,
                    QueueTicket.Status.IN_SERVICE,
                ]
            )
            .order_by("token_number")
            .first()
        )

        return Response(
            {
                "date": today,
                "stats": queue_stats(tickets),
                "now_serving": (
                    QueueTicketSerializer(now_serving).data
                    if now_serving
                    else None
                ),
                "results": QueueTicketSerializer(tickets, many=True).data,
            }
        )


class DoctorCallNextQueueView(APIView):
    permission_classes = [IsDoctorRole]

    def post(self, request):
        doctor = get_doctor_profile(request.user)
        if doctor is None:
            return Response(
                {"detail": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        today = timezone.localdate()

        existing_called = (
            QueueTicket.objects
            .select_related(
                "appointment",
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                doctor=doctor,
                queue_date=today,
                status=QueueTicket.Status.CALLED,
            )
            .order_by("token_number")
            .first()
        )

        if existing_called:
            return Response(
                {
                    "message": "A patient is already being called.",
                    "ticket": QueueTicketSerializer(existing_called).data,
                }
            )

        next_ticket = (
            QueueTicket.objects
            .filter(
                doctor=doctor,
                queue_date=today,
                status=QueueTicket.Status.WAITING,
            )
            .order_by("token_number")
            .first()
        )

        if next_ticket is None:
            return Response(
                {"detail": "No waiting patients in your queue."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            ticket = call_ticket(next_ticket)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": f"{ticket.token_label} has been called.",
                "ticket": QueueTicketSerializer(ticket).data,
            }
        )


class DoctorCallQueueTicketView(APIView):
    permission_classes = [IsDoctorRole]

    def patch(self, request, ticket_id):
        doctor = get_doctor_profile(request.user)
        if doctor is None:
            return Response(
                {"detail": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ticket = (
            QueueTicket.objects
            .filter(
                id=ticket_id,
                doctor=doctor,
                queue_date=timezone.localdate(),
            )
            .first()
        )

        if ticket is None:
            return Response(
                {"detail": "Queue ticket not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            ticket = call_ticket(ticket)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": f"{ticket.token_label} has been called.",
                "ticket": QueueTicketSerializer(ticket).data,
            }
        )


class DoctorStartQueueConsultationView(APIView):
    permission_classes = [IsDoctorRole]

    @transaction.atomic
    def patch(self, request, ticket_id):
        doctor = get_doctor_profile(request.user)
        if doctor is None:
            return Response(
                {"detail": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ticket = (
            QueueTicket.objects
            .select_for_update()
            .select_related("appointment")
            .filter(
                id=ticket_id,
                doctor=doctor,
                queue_date=timezone.localdate(),
            )
            .first()
        )

        if ticket is None:
            return Response(
                {"detail": "Queue ticket not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ticket.status != QueueTicket.Status.CALLED:
            return Response(
                {"detail": "Call the token before starting consultation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment = (
            Appointment.objects
            .select_for_update()
            .get(pk=ticket.appointment_id)
        )

        if appointment.status != Appointment.Status.CHECKED_IN:
            return Response(
                {
                    "detail": (
                        "Appointment must be CHECKED_IN before consultation can start."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        another_consultation = (
            Appointment.objects
            .filter(
                doctor=doctor,
                status=Appointment.Status.IN_CONSULTATION,
            )
            .exclude(pk=appointment.pk)
            .exists()
        )

        if another_consultation:
            return Response(
                {"detail": "You already have another patient in consultation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = Appointment.Status.IN_CONSULTATION
        appointment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        sync_queue_ticket_with_appointment(appointment)
        ticket.refresh_from_db()

        return Response(
            {
                "message": "Consultation started successfully.",
                "appointment_id": appointment.id,
                "ticket": QueueTicketSerializer(ticket).data,
            }
        )


class DoctorSkipQueueTicketView(APIView):
    permission_classes = [IsDoctorRole]

    @transaction.atomic
    def patch(self, request, ticket_id):
        doctor = get_doctor_profile(request.user)
        if doctor is None:
            return Response(
                {"detail": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ticket = (
            QueueTicket.objects
            .select_for_update()
            .filter(
                id=ticket_id,
                doctor=doctor,
                queue_date=timezone.localdate(),
            )
            .first()
        )

        if ticket is None:
            return Response(
                {"detail": "Queue ticket not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ticket.status not in [
            QueueTicket.Status.WAITING,
            QueueTicket.Status.CALLED,
        ]:
            return Response(
                {"detail": "Only waiting or called tokens can be skipped."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = QueueTicket.Status.SKIPPED
        ticket.skipped_at = timezone.now()
        ticket.save(
            update_fields=[
                "status",
                "skipped_at",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Token skipped.",
                "ticket": QueueTicketSerializer(ticket).data,
            }
        )


class PatientCurrentQueueView(APIView):
    permission_classes = [IsPatientRole]

    def get(self, request):
        today = timezone.localdate()

        ticket = (
            QueueTicket.objects
            .select_related(
                "appointment",
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                patient=request.user,
                queue_date=today,
            )
            .order_by("-created_at")
            .first()
        )

        if ticket is None:
            return Response(
                {
                    "date": today,
                    "ticket": None,
                    "position": None,
                    "ahead_count": 0,
                    "now_serving": None,
                }
            )

        ahead_count = 0
        position = None

        if ticket.status == QueueTicket.Status.WAITING:
            ahead_count = (
                QueueTicket.objects
                .filter(
                    doctor=ticket.doctor,
                    queue_date=ticket.queue_date,
                    token_number__lt=ticket.token_number,
                    status__in=[
                        QueueTicket.Status.WAITING,
                        QueueTicket.Status.CALLED,
                    ],
                )
                .count()
            )
            position = ahead_count + 1
        elif ticket.status == QueueTicket.Status.CALLED:
            position = 0

        now_serving = (
            QueueTicket.objects
            .select_related(
                "appointment",
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
            )
            .filter(
                doctor=ticket.doctor,
                queue_date=ticket.queue_date,
                status__in=[
                    QueueTicket.Status.CALLED,
                    QueueTicket.Status.IN_SERVICE,
                ],
            )
            .order_by("token_number")
            .first()
        )

        return Response(
            {
                "date": today,
                "ticket": QueueTicketSerializer(ticket).data,
                "position": position,
                "ahead_count": ahead_count,
                "now_serving": (
                    QueueTicketSerializer(now_serving).data
                    if now_serving
                    else None
                ),
            }
        )
