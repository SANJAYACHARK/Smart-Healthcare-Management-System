from django.core.management.base import (
    BaseCommand,
    CommandError,
)

from appointments.models import Appointment

from appointment_reminders.models import (
    AppointmentReminder,
)

from appointment_reminders.services import (
    send_appointment_reminder,
)


class Command(BaseCommand):

    help = (
        "Send a reminder immediately "
        "for one confirmed appointment. "
        "Use for development testing."
    )


    def add_arguments(
        self,
        parser,
    ):

        parser.add_argument(
            "appointment_id",
            type=int,
        )


        parser.add_argument(
            "--type",
            choices=[
                "24H",
                "2H",
            ],
            default="24H",
        )


    def handle(
        self,
        *args,
        **options,
    ):

        appointment_id = (
            options[
                "appointment_id"
            ]
        )


        reminder_type = (
            options["type"]
        )


        try:

            appointment = (
                Appointment.objects
                .select_related(
                    "patient",
                    "doctor",
                    "doctor__user",
                )
                .get(
                    id=appointment_id
                )
            )

        except Appointment.DoesNotExist:

            raise CommandError(
                "Appointment not found."
            )


        if (
            appointment.status
            !=
            Appointment.Status.CONFIRMED
        ):

            raise CommandError(
                (
                    "Appointment must be "
                    "CONFIRMED before a "
                    "reminder can be sent."
                )
            )


        # Remove old test row so this explicit
        # development command can be run again.
        AppointmentReminder.objects.filter(
            appointment=appointment,
            reminder_type=reminder_type,
        ).delete()


        result = (
            send_appointment_reminder(
                appointment,
                reminder_type,
            )
        )


        if result.get(
            "sent"
        ):

            self.stdout.write(
                self.style.SUCCESS(
                    (
                        "Reminder sent for "
                        f"appointment "
                        f"#{appointment.id}."
                    )
                )
            )

        else:

            self.stdout.write(
                self.style.WARNING(
                    (
                        "Reminder was not sent: "
                        f"{result.get('reason')}"
                    )
                )
            )
