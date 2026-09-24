import logging
import os

logger = logging.getLogger(__name__)


def _clean_phone(value):
    """
    Return a provider-friendly phone number.

    Store production phone numbers in E.164 format, for example:
    +919876543210
    """
    if value is None:
        return ""

    return str(value).strip()


def _get_user_phone(user):
    """
    Safely read the phone field from the custom User model.
    """
    return _clean_phone(
        getattr(user, "phone", "")
    )


def _twilio_client():
    """
    Create the Twilio client only when credentials are configured.
    Importing lazily keeps local development working even before
    the twilio package is installed/configured.
    """
    account_sid = os.getenv(
        "TWILIO_ACCOUNT_SID",
        "",
    ).strip()

    auth_token = os.getenv(
        "TWILIO_AUTH_TOKEN",
        "",
    ).strip()

    if not account_sid or not auth_token:
        return None

    try:
        from twilio.rest import Client
    except ImportError:
        logger.warning(
            "Twilio credentials are configured but the "
            "'twilio' package is not installed."
        )
        return None

    return Client(
        account_sid,
        auth_token,
    )


def send_sms(phone, message):
    """
    Send an SMS.

    Returns True when the provider accepted the message.
    Returns False when SMS is disabled, not configured, or fails.
    """
    phone = _clean_phone(phone)

    if not phone:
        logger.info(
            "SMS skipped because recipient phone is empty."
        )
        return False

    from_number = os.getenv(
        "TWILIO_SMS_FROM",
        "",
    ).strip()

    if not from_number:
        return False

    client = _twilio_client()

    if client is None:
        return False

    try:
        client.messages.create(
            body=message,
            from_=from_number,
            to=phone,
        )
        return True
    except Exception:
        logger.exception(
            "Unable to send appointment SMS to %s.",
            phone,
        )
        return False


def send_whatsapp(phone, message):
    """
    Send a WhatsApp message through Twilio.

    TWILIO_WHATSAPP_FROM example:
    whatsapp:+14155238886

    The recipient is converted to whatsapp:<E.164 number>.
    """
    phone = _clean_phone(phone)

    if not phone:
        logger.info(
            "WhatsApp skipped because recipient phone is empty."
        )
        return False

    from_number = os.getenv(
        "TWILIO_WHATSAPP_FROM",
        "",
    ).strip()

    if not from_number:
        return False

    client = _twilio_client()

    if client is None:
        return False

    recipient = (
        phone
        if phone.startswith("whatsapp:")
        else f"whatsapp:{phone}"
    )

    sender = (
        from_number
        if from_number.startswith("whatsapp:")
        else f"whatsapp:{from_number}"
    )

    try:
        client.messages.create(
            body=message,
            from_=sender,
            to=recipient,
        )
        return True
    except Exception:
        logger.exception(
            "Unable to send appointment WhatsApp message to %s.",
            phone,
        )
        return False


def send_external_notification(phone, message):
    """
    Notification strategy controlled by APPOINTMENT_NOTIFICATION_CHANNEL.

    whatsapp:
        Try WhatsApp only.

    sms:
        Try SMS only.

    whatsapp_sms:
        Try WhatsApp first; if it fails, use SMS.

    both:
        Attempt both WhatsApp and SMS.

    Default: whatsapp_sms
    """
    channel = os.getenv(
        "APPOINTMENT_NOTIFICATION_CHANNEL",
        "whatsapp_sms",
    ).strip().lower()

    if channel == "whatsapp":
        return send_whatsapp(
            phone,
            message,
        )

    if channel == "sms":
        return send_sms(
            phone,
            message,
        )

    if channel == "both":
        whatsapp_sent = send_whatsapp(
            phone,
            message,
        )
        sms_sent = send_sms(
            phone,
            message,
        )
        return whatsapp_sent or sms_sent

    # Recommended default:
    # WhatsApp first, SMS fallback.
    whatsapp_sent = send_whatsapp(
        phone,
        message,
    )

    if whatsapp_sent:
        return True

    return send_sms(
        phone,
        message,
    )


def _patient_name(appointment):
    name = (
        appointment.patient
        .get_full_name()
        .strip()
    )

    return (
        name or
        appointment.patient.username
    )


def _doctor_name(appointment):
    user = appointment.doctor.user

    name = (
        user.get_full_name()
        .strip()
    )

    return (
        name or
        user.username
    )


def _appointment_date(appointment):
    return appointment.appointment_date.strftime(
        "%d %b %Y"
    )


def _appointment_time(appointment):
    return appointment.appointment_time.strftime(
        "%I:%M %p"
    )


def notify_doctor_new_appointment(appointment):
    """
    Called immediately after a patient successfully books.
    """
    phone = _get_user_phone(
        appointment.doctor.user
    )

    reason = (
        appointment.reason.strip()
        if appointment.reason
        else "Not provided"
    )

    message = (
        "SmartCare - New Appointment Request\n"
        f"Patient: {_patient_name(appointment)}\n"
        f"Date: {_appointment_date(appointment)}\n"
        f"Time: {_appointment_time(appointment)}\n"
        f"Reason: {reason}\n"
        "Please open SmartCare to accept or reject the appointment."
    )

    return send_external_notification(
        phone,
        message,
    )


def notify_patient_appointment_confirmed(appointment):
    """
    Called when the doctor accepts a PENDING appointment.
    """
    phone = _get_user_phone(
        appointment.patient
    )

    message = (
        "SmartCare - Appointment Confirmed\n"
        f"Doctor: Dr. {_doctor_name(appointment)}\n"
        f"Date: {_appointment_date(appointment)}\n"
        f"Time: {_appointment_time(appointment)}\n"
        "Your doctor has accepted your appointment."
    )

    return send_external_notification(
        phone,
        message,
    )


def notify_patient_appointment_rejected(appointment):
    """
    Called when the doctor rejects/cancels a PENDING appointment.
    """
    phone = _get_user_phone(
        appointment.patient
    )

    message = (
        "SmartCare - Appointment Update\n"
        f"Doctor: Dr. {_doctor_name(appointment)}\n"
        f"Date: {_appointment_date(appointment)}\n"
        f"Time: {_appointment_time(appointment)}\n"
        "The appointment request was not accepted. "
        "Please choose another available slot or doctor."
    )

    return send_external_notification(
        phone,
        message,
    )


def notify_doctor_patient_cancelled(appointment):
    """
    Optional but useful: notify the doctor when a patient cancels.
    """
    phone = _get_user_phone(
        appointment.doctor.user
    )

    message = (
        "SmartCare - Appointment Cancelled\n"
        f"Patient: {_patient_name(appointment)}\n"
        f"Date: {_appointment_date(appointment)}\n"
        f"Time: {_appointment_time(appointment)}\n"
        "The patient cancelled this appointment."
    )

    return send_external_notification(
        phone,
        message,
    )
