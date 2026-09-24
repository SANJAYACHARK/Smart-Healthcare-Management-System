from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Doctor, User
from appointments.models import Appointment
from billing.models import Bill
from laboratory.models import LabTestRequest
from medical_records.models import MedicalRecord, Prescription


class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.is_superuser
            or getattr(request.user, "role", None) == "ADMIN"
        ):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        today = timezone.localdate()

        try:
            days = int(request.query_params.get("days", 180))
        except (TypeError, ValueError):
            days = 180

        days = max(30, min(days, 730))
        start_date = today - timedelta(days=days)

        appointments = Appointment.objects.filter(
            appointment_date__gte=start_date,
            appointment_date__lte=today,
        )

        bills = Bill.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today,
        )

        records = MedicalRecord.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today,
        )

        prescriptions = Prescription.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today,
        )

        labs = LabTestRequest.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today,
        )

        total_revenue = (
            bills.filter(payment_status=Bill.PaymentStatus.PAID)
            .aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )

        outstanding = (
            bills.exclude(payment_status=Bill.PaymentStatus.PAID)
            .aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )

        appointment_status = list(
            appointments.values("status")
            .annotate(value=Count("id"))
            .order_by("status")
        )

        lab_status = list(
            labs.values("status")
            .annotate(value=Count("id"))
            .order_by("status")
        )

        payment_status = list(
            bills.values("payment_status")
            .annotate(value=Count("id"), amount=Sum("amount"))
            .order_by("payment_status")
        )

        monthly_appointments = {
            row["month"].strftime("%Y-%m"): row["value"]
            for row in (
                appointments.annotate(month=TruncMonth("appointment_date"))
                .values("month")
                .annotate(value=Count("id"))
                .order_by("month")
            )
            if row["month"]
        }

        monthly_revenue = {
            row["month"].strftime("%Y-%m"): float(row["amount"] or 0)
            for row in (
                bills.filter(payment_status=Bill.PaymentStatus.PAID)
                .annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(amount=Sum("amount"))
                .order_by("month")
            )
            if row["month"]
        }

        month_keys = sorted(
            set(monthly_appointments) | set(monthly_revenue)
        )

        monthly_trend = [
            {
                "month": key,
                "appointments": monthly_appointments.get(key, 0),
                "revenue": monthly_revenue.get(key, 0),
            }
            for key in month_keys
        ]

        department_rows = (
            appointments.values(
                "doctor__department_id",
                "doctor__department__name",
            )
            .annotate(
                appointments=Count("id"),
                completed=Count(
                    "id",
                    filter=Q(
                        status=Appointment.Status.COMPLETED
                    ),
                ),
            )
            .order_by("-appointments")[:10]
        )

        department_performance = [
            {
                "department": (
                    row["doctor__department__name"]
                    or "Unassigned"
                ),
                "appointments": row["appointments"],
                "completed": row["completed"],
            }
            for row in department_rows
        ]

        patient_growth_rows = (
            User.objects.filter(
                role=User.Role.PATIENT,
                date_joined__date__gte=start_date,
                date_joined__date__lte=today,
            )
            .annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(new_patients=Count("id"))
            .order_by("month")
        )

        patient_growth = [
            {
                "month": row["month"].strftime("%Y-%m"),
                "new_patients": row["new_patients"],
            }
            for row in patient_growth_rows
            if row["month"]
        ]

        top_doctors_rows = (
            appointments.values(
                "doctor_id",
                "doctor__user__first_name",
                "doctor__user__last_name",
                "doctor__user__username",
                "doctor__specialization",
            )
            .annotate(
                appointments=Count("id"),
                completed=Count(
                    "id",
                    filter=Q(
                        status=Appointment.Status.COMPLETED
                    ),
                ),
            )
            .order_by("-completed", "-appointments")[:8]
        )

        top_doctors = []
        for row in top_doctors_rows:
            full_name = (
                f'{row["doctor__user__first_name"]} '
                f'{row["doctor__user__last_name"]}'
            ).strip()
            top_doctors.append({
                "doctor": full_name or row["doctor__user__username"],
                "specialization": row["doctor__specialization"],
                "appointments": row["appointments"],
                "completed": row["completed"],
            })

        total_appointments = appointments.count()
        completed_appointments = appointments.filter(
            status=Appointment.Status.COMPLETED
        ).count()

        return Response({
            "range": {
                "days": days,
                "start_date": start_date,
                "end_date": today,
            },
            "kpis": {
                "total_patients": User.objects.filter(
                    role=User.Role.PATIENT
                ).count(),
                "total_doctors": Doctor.objects.count(),
                "total_appointments": total_appointments,
                "completed_appointments": completed_appointments,
                "completion_rate": round(
                    (
                        completed_appointments
                        / total_appointments
                        * 100
                    ) if total_appointments else 0,
                    1,
                ),
                "total_revenue": float(total_revenue),
                "outstanding_amount": float(outstanding),
                "consultations": records.count(),
                "prescriptions": prescriptions.count(),
                "lab_requests": labs.count(),
                "completed_labs": labs.filter(
                    status=LabTestRequest.Status.COMPLETED
                ).count(),
            },
            "appointment_status": appointment_status,
            "monthly_trend": monthly_trend,
            "department_performance": department_performance,
            "patient_growth": patient_growth,
            "lab_status": lab_status,
            "payment_status": [
                {
                    "status": row["payment_status"],
                    "value": row["value"],
                    "amount": float(row["amount"] or 0),
                }
                for row in payment_status
            ],
            "top_doctors": top_doctors,
        })
