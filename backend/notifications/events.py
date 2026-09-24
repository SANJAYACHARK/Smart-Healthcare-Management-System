from .models import Notification
from .services import create_notification


def _doctor_name(appointment):
    doctor = getattr(appointment, "doctor", None)
    user = getattr(doctor, "user", None)

    if user is None:
        return "your doctor"

    get_full_name = getattr(user, "get_full_name", None)

    if callable(get_full_name):
        full_name = (get_full_name() or "").strip()
        if full_name:
            return f"Dr. {full_name}"

    first_name = (getattr(user, "first_name", "") or "").strip()
    last_name = (getattr(user, "last_name", "") or "").strip()
    name = f"{first_name} {last_name}".strip()

    if name:
        return f"Dr. {name}"

    return "your doctor"


def _patient_name(appointment):
    patient = getattr(appointment, "patient", None)

    if patient is None:
        return "Patient"

    get_full_name = getattr(patient, "get_full_name", None)

    if callable(get_full_name):
        full_name = (get_full_name() or "").strip()
        if full_name:
            return full_name

    first_name = (getattr(patient, "first_name", "") or "").strip()
    last_name = (getattr(patient, "last_name", "") or "").strip()
    name = f"{first_name} {last_name}".strip()

    return name or "Patient"


def _appointment_when(appointment):
    date_value = getattr(appointment, "appointment_date", None)
    time_value = getattr(appointment, "appointment_time", None)

    date_text = (
        date_value.strftime("%d %b %Y")
        if date_value
        else ""
    )

    time_text = (
        time_value.strftime("%I:%M %p")
        if time_value
        else ""
    )

    return " at ".join(
        value
        for value in [date_text, time_text]
        if value
    )


def notify_in_app_doctor_new_appointment(appointment):
    doctor = getattr(appointment, "doctor", None)
    doctor_user = getattr(doctor, "user", None)

    if doctor_user is None:
        return None

    patient_name = _patient_name(appointment)
    when = _appointment_when(appointment)

    message = f"{patient_name} requested an appointment"
    if when:
        message += f" for {when}"
    message += "."

    return create_notification(
        user=doctor_user,
        title="New Appointment Request",
        message=message,
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.HIGH,
        action_url="/doctor/appointments",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "BOOKED",
            "appointment_status": getattr(appointment, "status", ""),
        },
    )


def notify_in_app_doctor_patient_cancelled(appointment):
    doctor = getattr(appointment, "doctor", None)
    doctor_user = getattr(doctor, "user", None)

    if doctor_user is None:
        return None

    patient_name = _patient_name(appointment)

    return create_notification(
        user=doctor_user,
        title="Appointment Cancelled",
        message=f"{patient_name} cancelled the appointment.",
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.NORMAL,
        action_url="/doctor/appointments",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "PATIENT_CANCELLED",
            "appointment_status": getattr(appointment, "status", ""),
        },
    )


def notify_in_app_patient_confirmed(appointment):
    patient = getattr(appointment, "patient", None)
    if patient is None:
        return None

    doctor_name = _doctor_name(appointment)
    when = _appointment_when(appointment)

    message = f"{doctor_name} accepted your appointment"
    if when:
        message += f" for {when}"
    message += "."

    return create_notification(
        user=patient,
        title="Appointment Confirmed",
        message=message,
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.HIGH,
        action_url="/patient/appointments",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "CONFIRMED",
            "appointment_status": getattr(appointment, "status", ""),
        },
    )


def notify_in_app_patient_rejected(appointment):
    patient = getattr(appointment, "patient", None)
    if patient is None:
        return None

    doctor_name = _doctor_name(appointment)

    return create_notification(
        user=patient,
        title="Appointment Request Declined",
        message=f"{doctor_name} could not accept your appointment request.",
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.HIGH,
        action_url="/patient/appointments",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "REJECTED",
            "appointment_status": getattr(appointment, "status", ""),
        },
    )


def notify_in_app_check_in(appointment):
    created = []

    patient = getattr(appointment, "patient", None)
    doctor = getattr(appointment, "doctor", None)
    doctor_user = getattr(doctor, "user", None)

    if patient is not None:
        patient_notification = create_notification(
            user=patient,
            title="Check-In Completed",
            message=(
                "You have been checked in. Please wait until the doctor "
                "starts your consultation."
            ),
            notification_type=Notification.NotificationType.APPOINTMENT,
            priority=Notification.Priority.NORMAL,
            action_url="/patient/appointments",
            object_type="Appointment",
            object_id=appointment.id,
            metadata={
                "event": "CHECKED_IN",
                "appointment_status": getattr(appointment, "status", ""),
            },
        )
        if patient_notification:
            created.append(patient_notification)

    if doctor_user is not None:
        patient_name = _patient_name(appointment)
        doctor_notification = create_notification(
            user=doctor_user,
            title="Patient Checked In",
            message=f"{patient_name} has checked in and is waiting for consultation.",
            notification_type=Notification.NotificationType.APPOINTMENT,
            priority=Notification.Priority.HIGH,
            action_url="/doctor/appointments",
            object_type="Appointment",
            object_id=appointment.id,
            metadata={
                "event": "CHECKED_IN",
                "appointment_status": getattr(appointment, "status", ""),
            },
        )
        if doctor_notification:
            created.append(doctor_notification)

    return created


def notify_in_app_patient_consultation_started(appointment):
    patient = getattr(appointment, "patient", None)
    if patient is None:
        return None

    doctor_name = _doctor_name(appointment)

    return create_notification(
        user=patient,
        title="Consultation Started",
        message=f"Your consultation with {doctor_name} has started.",
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.HIGH,
        action_url="/patient/appointments",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "IN_CONSULTATION",
            "appointment_status": getattr(appointment, "status", ""),
        },
    )


def notify_in_app_patient_consultation_completed(
    appointment,
    *,
    prescription_created=False,
):
    patient = getattr(appointment, "patient", None)
    if patient is None:
        return None

    message = "Your consultation has been completed."

    if prescription_created:
        message += " A prescription is now available in your account."

    return create_notification(
        user=patient,
        title="Consultation Completed",
        message=message,
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.NORMAL,
        action_url="/patient/medical-records",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "COMPLETED",
            "appointment_status": getattr(appointment, "status", ""),
            "prescription_created": bool(prescription_created),
        },
    )


def notify_in_app_patient_receptionist_cancelled(appointment):
    patient = getattr(appointment, "patient", None)
    if patient is None:
        return None

    return create_notification(
        user=patient,
        title="Appointment Cancelled",
        message=(
            "Your appointment was cancelled by the hospital reception. "
            "Please book another slot or contact the hospital for assistance."
        ),
        notification_type=Notification.NotificationType.APPOINTMENT,
        priority=Notification.Priority.HIGH,
        action_url="/patient/appointments",
        object_type="Appointment",
        object_id=appointment.id,
        metadata={
            "event": "RECEPTIONIST_CANCELLED",
            "appointment_status": getattr(appointment, "status", ""),
        },
    )



# ============================================================
# GENERIC NAME HELPERS
# ============================================================

def _user_name(user, fallback="User"):
    if user is None:
        return fallback

    get_full_name = getattr(user, "get_full_name", None)

    if callable(get_full_name):
        full_name = (get_full_name() or "").strip()

        if full_name:
            return full_name

    first_name = (
        getattr(user, "first_name", "")
        or ""
    ).strip()

    last_name = (
        getattr(user, "last_name", "")
        or ""
    ).strip()

    full_name = (
        f"{first_name} {last_name}"
        .strip()
    )

    return (
        full_name
        or getattr(user, "username", "")
        or fallback
    )


# ============================================================
# PRESCRIPTION
# ============================================================

def notify_in_app_patient_prescription_created(
    prescription,
):
    patient = getattr(
        prescription,
        "patient",
        None,
    )

    if patient is None:
        return None

    doctor = getattr(
        prescription,
        "doctor",
        None,
    )

    doctor_user = getattr(
        doctor,
        "user",
        None,
    )

    doctor_name = (
        _user_name(
            doctor_user,
            "your doctor",
        )
    )

    if doctor_name != "your doctor":
        doctor_name = f"Dr. {doctor_name}"

    return create_notification(
        user=patient,
        title="New Prescription",
        message=(
            f"{doctor_name} has created a new "
            "prescription for you."
        ),
        notification_type=(
            Notification
            .NotificationType
            .PRESCRIPTION
        ),
        priority=(
            Notification
            .Priority
            .HIGH
        ),
        action_url="/patient/prescriptions",
        object_type="Prescription",
        object_id=prescription.id,
        metadata={
            "event":
                "PRESCRIPTION_CREATED",
        },
    )


# ============================================================
# LABORATORY
# ============================================================

def notify_in_app_patient_lab_requested(
    lab_request,
):
    patient = getattr(
        lab_request,
        "patient",
        None,
    )

    if patient is None:
        return None

    doctor = getattr(
        lab_request,
        "doctor",
        None,
    )

    doctor_user = getattr(
        doctor,
        "user",
        None,
    )

    doctor_name = (
        _user_name(
            doctor_user,
            "Your doctor",
        )
    )

    if doctor_name != "Your doctor":
        doctor_name = f"Dr. {doctor_name}"

    test_name = (
        getattr(
            lab_request,
            "test_name",
            "",
        )
        or "lab test"
    )

    return create_notification(
        user=patient,
        title="Lab Test Requested",
        message=(
            f"{doctor_name} requested "
            f"{test_name} for you."
        ),
        notification_type=(
            Notification
            .NotificationType
            .LAB_REPORT
        ),
        priority=(
            Notification
            .Priority
            .NORMAL
        ),
        action_url="/patient/lab-reports",
        object_type="LabTestRequest",
        object_id=lab_request.id,
        metadata={
            "event":
                "LAB_REQUESTED",
            "status":
                getattr(
                    lab_request,
                    "status",
                    "",
                ),
            "test_name":
                test_name,
        },
    )


def notify_in_app_patient_lab_status(
    lab_request,
    *,
    previous_status=None,
):
    patient = getattr(
        lab_request,
        "patient",
        None,
    )

    if patient is None:
        return None

    status_value = getattr(
        lab_request,
        "status",
        "",
    )

    test_name = (
        getattr(
            lab_request,
            "test_name",
            "",
        )
        or "Lab test"
    )

    # Prevent duplicate notification when no actual
    # status transition happened.
    if (
        previous_status
        and previous_status == status_value
    ):
        return None

    if status_value == "PROCESSING":
        title = "Lab Test Processing"
        message = (
            f"{test_name} is now being processed."
        )
        priority = Notification.Priority.NORMAL

    elif status_value == "COMPLETED":
        title = "Lab Report Ready"
        message = (
            f"Your {test_name} report is ready "
            "to view."
        )
        priority = Notification.Priority.HIGH

    elif status_value == "CANCELLED":
        title = "Lab Test Cancelled"
        message = (
            f"Your {test_name} request was "
            "cancelled."
        )
        priority = Notification.Priority.HIGH

    else:
        return None

    return create_notification(
        user=patient,
        title=title,
        message=message,
        notification_type=(
            Notification
            .NotificationType
            .LAB_REPORT
        ),
        priority=priority,
        action_url="/patient/lab-reports",
        object_type="LabTestRequest",
        object_id=lab_request.id,
        metadata={
            "event":
                f"LAB_{status_value}",
            "status":
                status_value,
            "previous_status":
                previous_status,
            "test_name":
                test_name,
        },
    )


# ============================================================
# BILLING
# ============================================================

def notify_in_app_patient_bill_created(
    bill,
):
    patient = getattr(
        bill,
        "patient",
        None,
    )

    if patient is None:
        return None

    invoice_number = (
        getattr(
            bill,
            "invoice_number",
            "",
        )
        or "New invoice"
    )

    amount = getattr(
        bill,
        "amount",
        None,
    )

    amount_text = (
        f"₹{amount}"
        if amount is not None
        else ""
    )

    message = (
        f"{invoice_number} has been generated"
    )

    if amount_text:
        message += f" for {amount_text}"

    message += "."

    return create_notification(
        user=patient,
        title="New Bill Generated",
        message=message,
        notification_type=(
            Notification
            .NotificationType
            .BILLING
        ),
        priority=(
            Notification
            .Priority
            .HIGH
        ),
        action_url="/patient/billing",
        object_type="Bill",
        object_id=bill.id,
        metadata={
            "event":
                "BILL_CREATED",
            "invoice_number":
                invoice_number,
            "payment_status":
                getattr(
                    bill,
                    "payment_status",
                    "",
                ),
        },
    )


def notify_in_app_patient_bill_status(
    bill,
    *,
    previous_status=None,
):
    patient = getattr(
        bill,
        "patient",
        None,
    )

    if patient is None:
        return None

    status_value = getattr(
        bill,
        "payment_status",
        "",
    )

    if (
        previous_status
        and previous_status == status_value
    ):
        return None

    invoice_number = (
        getattr(
            bill,
            "invoice_number",
            "",
        )
        or "Your bill"
    )

    if status_value == "PAID":
        title = "Payment Completed"
        message = (
            f"{invoice_number} has been marked "
            "as paid."
        )
        priority = Notification.Priority.NORMAL

    elif status_value == "PARTIAL":
        title = "Partial Payment Updated"
        message = (
            f"{invoice_number} has been marked "
            "as partially paid."
        )
        priority = Notification.Priority.NORMAL

    elif status_value == "UNPAID":
        title = "Payment Status Updated"
        message = (
            f"{invoice_number} is currently unpaid."
        )
        priority = Notification.Priority.NORMAL

    else:
        return None

    return create_notification(
        user=patient,
        title=title,
        message=message,
        notification_type=(
            Notification
            .NotificationType
            .BILLING
        ),
        priority=priority,
        action_url="/patient/billing",
        object_type="Bill",
        object_id=bill.id,
        metadata={
            "event":
                f"BILL_{status_value}",
            "payment_status":
                status_value,
            "previous_status":
                previous_status,
            "invoice_number":
                invoice_number,
        },
    )


# ============================================================
# CHAT / MESSAGES
# ============================================================

def notify_in_app_chat_message(
    conversation,
    message,
):
    sender = getattr(
        message,
        "sender",
        None,
    )

    patient = getattr(
        conversation,
        "patient",
        None,
    )

    doctor = getattr(
        conversation,
        "doctor",
        None,
    )

    doctor_user = getattr(
        doctor,
        "user",
        None,
    )

    if sender is None:
        return None

    if (
        patient is not None
        and sender.id == patient.id
    ):
        recipient = doctor_user
        action_url = "/doctor/messages"
        sender_name = _user_name(
            patient,
            "Patient",
        )

    elif (
        doctor_user is not None
        and sender.id == doctor_user.id
    ):
        recipient = patient
        action_url = "/patient/messages"
        sender_name = _user_name(
            doctor_user,
            "Doctor",
        )

        if sender_name != "Doctor":
            sender_name = (
                f"Dr. {sender_name}"
            )

    else:
        return None

    if recipient is None:
        return None

    raw_text = (
        getattr(
            message,
            "message",
            "",
        )
        or ""
    ).strip()

    preview = raw_text

    if len(preview) > 90:
        preview = (
            preview[:87]
            + "..."
        )

    return create_notification(
        user=recipient,
        title="New Message",
        message=(
            f"{sender_name}: {preview}"
            if preview
            else (
                f"You received a new message "
                f"from {sender_name}."
            )
        ),
        notification_type=(
            Notification
            .NotificationType
            .MESSAGE
        ),
        priority=(
            Notification
            .Priority
            .NORMAL
        ),
        action_url=action_url,
        object_type="Message",
        object_id=message.id,
        metadata={
            "event":
                "MESSAGE_RECEIVED",
            "conversation_id":
                getattr(
                    conversation,
                    "id",
                    None,
                ),
            "sender_id":
                getattr(
                    sender,
                    "id",
                    None,
                ),
        },
    )
