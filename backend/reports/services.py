from datetime import datetime, timedelta
from decimal import Decimal
from io import BytesIO

from django.db.models import Count, Sum
from django.utils import timezone

from accounts.models import Doctor, User
from appointments.models import Appointment
from billing.models import Bill, Payment
from laboratory.models import LabTestRequest


REPORT_TYPES = {
    "appointments": "Appointments",
    "billing": "Billing & Payments",
    "laboratory": "Laboratory",
    "patients": "Patients",
    "doctors": "Doctors",
}


def parse_date_range(params):
    today = timezone.localdate()
    try:
        days = int(params.get("days", 30))
    except (TypeError, ValueError):
        days = 30
    days = max(1, min(days, 730))
    start = today - timedelta(days=days - 1)
    end = today

    if params.get("start_date"):
        start = datetime.strptime(params["start_date"], "%Y-%m-%d").date()
    if params.get("end_date"):
        end = datetime.strptime(params["end_date"], "%Y-%m-%d").date()

    if start > end:
        raise ValueError("Start date cannot be later than end date.")
    if (end - start).days > 730:
        raise ValueError("Report range cannot exceed 730 days.")
    return start, end


def _name(user):
    return user.get_full_name().strip() or user.username


def appointment_rows(start, end):
    qs = Appointment.objects.filter(
        appointment_date__range=(start, end)
    ).select_related("patient", "doctor__user", "doctor__department")
    rows = []
    for a in qs:
        rows.append({
            "ID": a.id,
            "Date": a.appointment_date.isoformat(),
            "Time": a.appointment_time.strftime("%H:%M"),
            "Patient": _name(a.patient),
            "Doctor": _name(a.doctor.user),
            "Department": a.doctor.department.name if a.doctor.department else "Unassigned",
            "Status": a.get_status_display(),
            "Reason": a.reason,
        })
    return rows


def billing_rows(start, end):
    qs = Bill.objects.filter(
        created_at__date__range=(start, end)
    ).select_related("patient").prefetch_related("payments")
    rows = []
    for bill in qs:
        paid = sum(
            (p.amount for p in bill.payments.all() if p.status == Payment.Status.PAID),
            Decimal("0"),
        )
        rows.append({
            "Invoice": bill.invoice_number,
            "Date": timezone.localtime(bill.created_at).date().isoformat(),
            "Patient": _name(bill.patient),
            "Description": bill.description,
            "Bill Amount": float(bill.amount),
            "Paid Amount": float(paid),
            "Due Amount": float(max(bill.amount - paid, Decimal("0"))),
            "Status": bill.get_payment_status_display(),
        })
    return rows


def laboratory_rows(start, end):
    qs = LabTestRequest.objects.filter(
        created_at__date__range=(start, end)
    ).select_related("patient", "doctor__user")
    return [{
        "ID": x.id,
        "Date": timezone.localtime(x.created_at).date().isoformat(),
        "Patient": _name(x.patient),
        "Doctor": _name(x.doctor.user),
        "Test": x.test_name,
        "Priority": x.get_priority_display(),
        "Status": x.get_status_display(),
        "Sample ID": x.sample_id,
        "Abnormal": "Yes" if x.is_abnormal else "No",
        "Doctor Reviewed": "Yes" if x.doctor_reviewed_at else "No",
    } for x in qs]


def patient_rows(start, end):
    qs = User.objects.filter(
        role=User.Role.PATIENT,
        date_joined__date__range=(start, end),
    ).order_by("-date_joined")
    return [{
        "ID": x.id,
        "Joined": timezone.localtime(x.date_joined).date().isoformat(),
        "Username": x.username,
        "Patient": _name(x),
        "Email": x.email,
        "Phone": x.phone or "",
        "Active": "Yes" if x.is_active else "No",
    } for x in qs]


def doctor_rows(start, end):
    qs = Doctor.objects.filter(
        created_at__date__range=(start, end)
    ).select_related("user", "department").order_by("-created_at")
    return [{
        "ID": x.id,
        "Joined": timezone.localtime(x.created_at).date().isoformat(),
        "Doctor": _name(x.user),
        "Department": x.department.name if x.department else "Unassigned",
        "Specialization": x.specialization,
        "Experience Years": x.experience_years,
        "Consultation Fee": float(x.consultation_fee),
        "Available": "Yes" if x.is_available else "No",
        "Account Active": "Yes" if x.user.is_active else "No",
    } for x in qs]


ROW_BUILDERS = {
    "appointments": appointment_rows,
    "billing": billing_rows,
    "laboratory": laboratory_rows,
    "patients": patient_rows,
    "doctors": doctor_rows,
}


def get_rows(report_type, start, end):
    if report_type not in ROW_BUILDERS:
        raise ValueError("Unsupported report type.")
    return ROW_BUILDERS[report_type](start, end)


def summary(start, end):
    appointments = Appointment.objects.filter(appointment_date__range=(start, end))
    bills = Bill.objects.filter(created_at__date__range=(start, end))
    payments = Payment.objects.filter(
        status=Payment.Status.PAID,
        paid_at__date__range=(start, end),
    )
    labs = LabTestRequest.objects.filter(created_at__date__range=(start, end))
    patients = User.objects.filter(
        role=User.Role.PATIENT,
        date_joined__date__range=(start, end),
    )
    doctors = Doctor.objects.filter(created_at__date__range=(start, end))

    collected = payments.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    billed = bills.aggregate(total=Sum("amount"))["total"] or Decimal("0")

    return {
        "range": {"start_date": start, "end_date": end},
        "kpis": {
            "appointments": appointments.count(),
            "completed_appointments": appointments.filter(status=Appointment.Status.COMPLETED).count(),
            "billed_amount": float(billed),
            "collected_amount": float(collected),
            "lab_requests": labs.count(),
            "completed_labs": labs.filter(status=LabTestRequest.Status.COMPLETED).count(),
            "new_patients": patients.count(),
            "new_doctors": doctors.count(),
        },
        "appointment_status": list(
            appointments.values("status").annotate(value=Count("id")).order_by("status")
        ),
        "payment_status": list(
            bills.values("payment_status").annotate(value=Count("id"), amount=Sum("amount")).order_by("payment_status")
        ),
        "lab_status": list(
            labs.values("status").annotate(value=Count("id")).order_by("status")
        ),
    }


def export_csv(rows):
    import csv
    out = BytesIO()
    text = __import__("io").TextIOWrapper(out, encoding="utf-8-sig", newline="")
    if rows:
        writer = csv.DictWriter(text, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    text.flush()
    out.seek(0)
    return out.getvalue()


def export_xlsx(rows, title):
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]
    if rows:
        headers = list(rows[0].keys())
        ws.append(headers)
        for cell in ws[1]:
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal="center")
        for row in rows:
            ws.append([row.get(h, "") for h in headers])
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        for column in ws.columns:
            width = min(max(len(str(c.value or "")) for c in column) + 2, 45)
            ws.column_dimensions[column[0].column_letter].width = width
    output = BytesIO()
    wb.save(output)
    return output.getvalue()


def export_pdf(rows, title, start, end):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    output = BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=landscape(A4),
        rightMargin=24, leftMargin=24, topMargin=28, bottomMargin=28,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph(f"SmartCare - {title} Report", styles["Title"]),
        Paragraph(f"Period: {start.isoformat()} to {end.isoformat()}", styles["Normal"]),
        Spacer(1, 12),
    ]
    if not rows:
        story.append(Paragraph("No records found for this period.", styles["Normal"]))
    else:
        headers = list(rows[0].keys())
        data = [headers] + [[str(row.get(h, "")) for h in headers] for row in rows]
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#970747")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E7E5E0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F7F4")]),
        ]))
        story.append(table)
    doc.build(story)
    return output.getvalue()
