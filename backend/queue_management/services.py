from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from accounts.models import Doctor
from appointments.models import Appointment
from notifications.models import Notification
from notifications.services import create_notification

from .models import QueueTicket


ACTIVE_QUEUE_STATUSES = [
    QueueTicket.Status.WAITING,
    QueueTicket.Status.CALLED,
    QueueTicket.Status.IN_SERVICE,
]


def _doctor_name(doctor):
    user = doctor.user
    name = (user.get_full_name() or "").strip()
    return name or user.username


def notify_token_assigned(ticket):
    return create_notification(
        user=ticket.patient,
        title="Queue Token Assigned",
        message=(
            f"Your token {ticket.token_label} has been assigned "
            f"for Dr. {_doctor_name(ticket.doctor)}."
        ),
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.HIGH,
        action_url="/patient/queue",
        object_type="QueueTicket",
        object_id=ticket.id,
        metadata={
            "event": "QUEUE_TOKEN_ASSIGNED",
            "token": ticket.token_label,
            "appointment_id": ticket.appointment_id,
        },
    )


def notify_token_called(ticket):
    return create_notification(
        user=ticket.patient,
        title="Your Token Is Called",
        message=(
            f"Token {ticket.token_label} is being called by "
            f"Dr. {_doctor_name(ticket.doctor)}. Please proceed to consultation."
        ),
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.URGENT,
        action_url="/patient/queue",
        object_type="QueueTicket",
        object_id=ticket.id,
        metadata={
            "event": "QUEUE_TOKEN_CALLED",
            "token": ticket.token_label,
            "appointment_id": ticket.appointment_id,
        },
    )


@transaction.atomic
def ensure_queue_ticket_for_appointment(
    appointment,
    *,
    created_by=None,
):
    existing = (
        QueueTicket.objects
        .select_related(
            "appointment",
            "doctor",
            "doctor__user",
            "patient",
        )
        .filter(appointment=appointment)
        .first()
    )

    if existing:
        return existing, False

    if appointment.status != Appointment.Status.CHECKED_IN:
        raise ValueError(
            "Queue token can only be generated after patient check-in."
        )

    queue_date = appointment.appointment_date

    # Lock the doctor row so concurrent receptionist check-ins for the
    # same doctor cannot allocate the same token number.
    doctor = (
        Doctor.objects
        .select_for_update()
        .select_related("user")
        .get(pk=appointment.doctor_id)
    )

    last_token = (
        QueueTicket.objects
        .filter(
            doctor=doctor,
            queue_date=queue_date,
        )
        .aggregate(max_token=Max("token_number"))
        .get("max_token")
        or 0
    )

    ticket = QueueTicket.objects.create(
        appointment=appointment,
        doctor=doctor,
        patient=appointment.patient,
        queue_date=queue_date,
        token_number=last_token + 1,
        status=QueueTicket.Status.WAITING,
        checked_in_at=timezone.now(),
        created_by=created_by,
    )

    notify_token_assigned(ticket)

    return ticket, True


@transaction.atomic
def sync_queue_ticket_with_appointment(appointment):
    ticket = (
        QueueTicket.objects
        .select_for_update()
        .filter(appointment=appointment)
        .first()
    )

    if ticket is None:
        return None

    now = timezone.now()
    update_fields = []

    if appointment.status == Appointment.Status.IN_CONSULTATION:
        ticket.status = QueueTicket.Status.IN_SERVICE
        update_fields.append("status")

        if ticket.service_started_at is None:
            ticket.service_started_at = now
            update_fields.append("service_started_at")

    elif appointment.status == Appointment.Status.COMPLETED:
        ticket.status = QueueTicket.Status.COMPLETED
        update_fields.append("status")

        if ticket.completed_at is None:
            ticket.completed_at = now
            update_fields.append("completed_at")

    elif appointment.status == Appointment.Status.CANCELLED:
        ticket.status = QueueTicket.Status.CANCELLED
        update_fields.append("status")

    if update_fields:
        update_fields.append("updated_at")
        ticket.save(update_fields=update_fields)

    return ticket


@transaction.atomic
def call_ticket(ticket):
    ticket = (
        QueueTicket.objects
        .select_for_update()
        .select_related(
            "doctor",
            "doctor__user",
            "patient",
            "appointment",
        )
        .get(pk=ticket.pk)
    )

    if ticket.status != QueueTicket.Status.WAITING:
        raise ValueError("Only waiting tokens can be called.")

    active_service = (
        QueueTicket.objects
        .filter(
            doctor=ticket.doctor,
            queue_date=ticket.queue_date,
            status=QueueTicket.Status.IN_SERVICE,
        )
        .exclude(pk=ticket.pk)
        .exists()
    )

    if active_service:
        raise ValueError(
            "Complete the current consultation before calling the next patient."
        )

    already_called = (
        QueueTicket.objects
        .filter(
            doctor=ticket.doctor,
            queue_date=ticket.queue_date,
            status=QueueTicket.Status.CALLED,
        )
        .exclude(pk=ticket.pk)
        .exists()
    )

    if already_called:
        raise ValueError(
            "Another patient has already been called. Start or skip that token first."
        )

    ticket.status = QueueTicket.Status.CALLED
    ticket.called_at = timezone.now()
    ticket.save(
        update_fields=[
            "status",
            "called_at",
            "updated_at",
        ]
    )

    notify_token_called(ticket)
    return ticket
