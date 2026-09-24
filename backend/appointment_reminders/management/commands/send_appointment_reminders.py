from django.core.management.base import BaseCommand
from django.utils import timezone

from appointment_reminders.services import (
    process_due_appointment_reminders,
)


class Command(BaseCommand):

    help = (
        "Send due appointment reminders "
        "for confirmed appointments."
    )


    def handle(
        self,
        *args,
        **options,
    ):

        started_at = (
            timezone.localtime()
        )


        self.stdout.write(
            self.style.NOTICE(
                "Checking appointment "
                "reminders..."
            )
        )


        summary = (
            process_due_appointment_reminders()
        )


        self.stdout.write(
            (
                f"Checked: "
                f"{summary['checked']} | "
                f"Sent: "
                f"{summary['sent']} | "
                f"Already sent: "
                f"{summary['already_sent']} | "
                f"Not due: "
                f"{summary['not_due']} | "
                f"Errors: "
                f"{len(summary['errors'])}"
            )
        )


        for error in (
            summary["errors"]
        ):

            self.stderr.write(
                self.style.ERROR(
                    (
                        "Appointment "
                        f"#{error['appointment_id']} "
                        f"({error['reminder_type']}): "
                        f"{error['error']}"
                    )
                )
            )


        finished_at = (
            timezone.localtime()
        )


        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Appointment reminder check "
                    "completed successfully. "
                    f"Started {started_at:%H:%M:%S}, "
                    f"finished {finished_at:%H:%M:%S}."
                )
            )
        )
