from datetime import (
    datetime,
    timedelta,
)

from django.db import transaction
from django.utils import timezone

from appointments.models import Appointment
from appointments.notifications import (
    send_external_notification,
)

from notifications.models import Notification
from notifications.services import (
    create_notification,
)

from .models import AppointmentReminder


# ============================================================
# CONFIGURATION
# ============================================================

REMINDER_WINDOWS = {

    AppointmentReminder.ReminderType.DAY_BEFORE: {
        "before": timedelta(
            hours=24,
        ),
        "tolerance": timedelta(
            minutes=15,
        ),
    },

    AppointmentReminder.ReminderType.TWO_HOURS: {
        "before": timedelta(
            hours=2,
        ),
        "tolerance": timedelta(
            minutes=15,
        ),
    },

}


# ============================================================
# HELPERS
# ============================================================

def _appointment_datetime(
    appointment,
):

    value = datetime.combine(
        appointment.appointment_date,
        appointment.appointment_time,
    )

    current_timezone = (
        timezone.get_current_timezone()
    )

    if timezone.is_naive(
        value
    ):
        value = timezone.make_aware(
            value,
            current_timezone,
        )

    return value


def _patient_name(
    appointment,
):

    name = (
        appointment
        .patient
        .get_full_name()
        .strip()
    )

    return (
        name
        or appointment.patient.username
    )


def _doctor_name(
    appointment,
):

    user = (
        appointment.doctor.user
    )

    name = (
        user
        .get_full_name()
        .strip()
    )

    return (
        name
        or user.username
    )


def _patient_phone(
    appointment,
):

    return (
        getattr(
            appointment.patient,
            "phone",
            "",
        )
        or ""
    ).strip()


def _formatted_date(
    appointment,
):

    return (
        appointment
        .appointment_date
        .strftime(
            "%d %b %Y"
        )
    )


def _formatted_time(
    appointment,
):

    return (
        appointment
        .appointment_time
        .strftime(
            "%I:%M %p"
        )
    )


def _reminder_title(
    reminder_type,
):

    if (
        reminder_type
        ==
        AppointmentReminder
        .ReminderType
        .TWO_HOURS
    ):

        return (
            "Appointment in 2 Hours"
        )

    return (
        "Appointment Tomorrow"
    )


def _reminder_message(
    appointment,
    reminder_type,
):

    doctor_name = (
        _doctor_name(
            appointment
        )
    )

    date_text = (
        _formatted_date(
            appointment
        )
    )

    time_text = (
        _formatted_time(
            appointment
        )
    )


    if (
        reminder_type
        ==
        AppointmentReminder
        .ReminderType
        .TWO_HOURS
    ):

        return (
            f"Reminder: your appointment "
            f"with Dr. {doctor_name} is "
            f"today at {time_text}. "
            f"Please arrive a little early."
        )


    return (
        f"Reminder: your appointment "
        f"with Dr. {doctor_name} is on "
        f"{date_text} at {time_text}."
    )


def _external_message(
    appointment,
    reminder_type,
):

    patient_name = (
        _patient_name(
            appointment
        )
    )

    doctor_name = (
        _doctor_name(
            appointment
        )
    )

    date_text = (
        _formatted_date(
            appointment
        )
    )

    time_text = (
        _formatted_time(
            appointment
        )
    )


    if (
        reminder_type
        ==
        AppointmentReminder
        .ReminderType
        .TWO_HOURS
    ):

        return (
            f"SmartCare Reminder: "
            f"Hello {patient_name}, "
            f"your appointment with "
            f"Dr. {doctor_name} is today "
            f"at {time_text}. "
            f"Please arrive 10-15 minutes "
            f"before your appointment."
        )


    return (
        f"SmartCare Reminder: "
        f"Hello {patient_name}, "
        f"your appointment with "
        f"Dr. {doctor_name} is on "
        f"{date_text} at {time_text}. "
        f"Please keep this appointment "
        f"in your schedule."
    )


# ============================================================
# CHECK IF A REMINDER IS CURRENTLY DUE
# ============================================================

def is_reminder_due(
    appointment,
    reminder_type,
    *,
    now=None,
):

    if (
        appointment.status
        !=
        Appointment.Status.CONFIRMED
    ):

        return False


    now = (
        now
        or timezone.now()
    )


    appointment_datetime = (
        _appointment_datetime(
            appointment
        )
    )


    if (
        appointment_datetime
        <= now
    ):

        return False


    config = (
        REMINDER_WINDOWS[
            reminder_type
        ]
    )


    target_time = (
        appointment_datetime
        -
        config["before"]
    )


    tolerance = (
        config["tolerance"]
    )


    # Command can safely run every 10-15 minutes.
    #
    # Example:
    # 24-hour reminder target = 10:00.
    # Due between 10:00 and 10:15.
    #
    # Duplicate protection in the database makes repeated command
    # runs safe.

    return (
        target_time
        <= now
        <= target_time + tolerance
    )


# ============================================================
# SEND ONE REMINDER
# ============================================================

@transaction.atomic
def send_appointment_reminder(
    appointment,
    reminder_type,
):

    # Lock appointment so a status change cannot race
    # with the reminder worker.

    appointment = (
        Appointment.objects
        .select_for_update()
        .select_related(
            "patient",
            "doctor",
            "doctor__user",
            "doctor__department",
        )
        .get(
            pk=appointment.pk
        )
    )


    if (
        appointment.status
        !=
        Appointment.Status.CONFIRMED
    ):

        return {
            "sent": False,
            "reason":
                "appointment_not_confirmed",
        }


    reminder, created = (
        AppointmentReminder
        .objects
        .select_for_update()
        .get_or_create(
            appointment=appointment,
            reminder_type=reminder_type,
        )
    )


    if (
        not created
        and reminder.sent_at
    ):

        return {
            "sent": False,
            "reason":
                "already_sent",
            "reminder":
                reminder,
        }


    title = (
        _reminder_title(
            reminder_type
        )
    )


    message = (
        _reminder_message(
            appointment,
            reminder_type,
        )
    )


    # --------------------------------------------------------
    # IN-APP NOTIFICATION
    # --------------------------------------------------------

    if (
        not reminder.in_app_sent
    ):

        create_notification(
            user=appointment.patient,
            title=title,
            message=message,
            notification_type=(
                Notification
                .NotificationType
                .APPOINTMENT
            ),
            priority=(
                Notification
                .Priority
                .HIGH
                if reminder_type
                ==
                AppointmentReminder
                .ReminderType
                .TWO_HOURS
                else
                Notification
                .Priority
                .NORMAL
            ),
            action_url=(
                "/patient/appointments"
            ),
            object_type=(
                "Appointment"
            ),
            object_id=(
                appointment.id
            ),
            metadata={
                "event":
                    "APPOINTMENT_REMINDER",
                "reminder_type":
                    reminder_type,
                "appointment_date":
                    str(
                        appointment
                        .appointment_date
                    ),
                "appointment_time":
                    str(
                        appointment
                        .appointment_time
                    ),
            },
        )


        reminder.in_app_sent = (
            True
        )


    # --------------------------------------------------------
    # WHATSAPP / SMS
    # --------------------------------------------------------

    if (
        not reminder
        .external_channel_attempted
    ):

        phone = (
            _patient_phone(
                appointment
            )
        )


        reminder.external_channel_attempted = (
            True
        )


        if phone:

            external_sent = (
                send_external_notification(
                    phone,
                    _external_message(
                        appointment,
                        reminder_type,
                    ),
                )
            )


            reminder.external_sent = (
                bool(
                    external_sent
                )
            )


    reminder.sent_at = (
        timezone.now()
    )


    reminder.save(
        update_fields=[
            "in_app_sent",
            "external_sent",
            "external_channel_attempted",
            "sent_at",
            "updated_at",
        ]
    )


    return {
        "sent": True,
        "reason": "sent",
        "reminder": reminder,
    }


# ============================================================
# FIND + SEND ALL DUE REMINDERS
# ============================================================

def process_due_appointment_reminders(
    *,
    now=None,
):

    now = (
        now
        or timezone.now()
    )


    local_today = (
        timezone.localdate(
            now
        )
    )


    # 24-hour reminders only need tomorrow's appointments.
    # 2-hour reminders only need today's appointments.
    #
    # Looking two days ahead keeps the query safe around
    # timezone boundaries without scanning the whole table.

    max_date = (
        local_today
        + timedelta(
            days=2,
        )
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
            status=(
                Appointment
                .Status
                .CONFIRMED
            ),
            appointment_date__gte=(
                local_today
            ),
            appointment_date__lte=(
                max_date
            ),
        )
        .order_by(
            "appointment_date",
            "appointment_time",
        )
    )


    summary = {
        "checked": 0,
        "sent": 0,
        "already_sent": 0,
        "not_due": 0,
        "errors": [],
    }


    for appointment in appointments:

        for reminder_type in (
            AppointmentReminder
            .ReminderType
            .values
        ):

            summary["checked"] += 1


            existing = (
                AppointmentReminder
                .objects
                .filter(
                    appointment=(
                        appointment
                    ),
                    reminder_type=(
                        reminder_type
                    ),
                    sent_at__isnull=False,
                )
                .exists()
            )


            if existing:

                summary[
                    "already_sent"
                ] += 1

                continue


            if not is_reminder_due(
                appointment,
                reminder_type,
                now=now,
            ):

                summary[
                    "not_due"
                ] += 1

                continue


            try:

                result = (
                    send_appointment_reminder(
                        appointment,
                        reminder_type,
                    )
                )


                if result.get(
                    "sent"
                ):

                    summary[
                        "sent"
                    ] += 1

                elif (
                    result.get(
                        "reason"
                    )
                    ==
                    "already_sent"
                ):

                    summary[
                        "already_sent"
                    ] += 1


            except Exception as exc:

                summary[
                    "errors"
                ].append({
                    "appointment_id":
                        appointment.id,
                    "reminder_type":
                        reminder_type,
                    "error":
                        str(exc),
                })


    return summary
