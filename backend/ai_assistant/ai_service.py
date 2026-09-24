import logging
import os

from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)

logger = logging.getLogger(__name__)


SYSTEM_INSTRUCTIONS = """
You are SmartCare AI, a health guidance assistant inside a hospital
management application.

Your job:
- Have a natural, useful conversation with the patient.
- Explain health information in simple language.
- Ask one or two useful follow-up questions when information is missing.
- Help the patient choose an appropriate hospital department.
- Encourage professional medical evaluation when appropriate.
- Never claim to provide a definitive diagnosis.
- Never prescribe prescription medicines or give dosage instructions.
- Do not tell the patient to stop or change prescribed treatment.
- Do not invent doctor names, appointment slots, fees, departments,
  test results, medical records, or hospital information.
- Doctor and appointment information supplied in SYSTEM CONTEXT is
  authoritative. If none is supplied, say none are currently available.
- For emergencies, clearly direct the patient to immediate emergency
  medical care rather than continuing routine symptom analysis.
- Keep responses concise enough for a chat interface.
"""


class AIServiceError(Exception):
    """User-safe AI service failure."""


def _client():
    api_key = os.getenv(
        "OPENAI_API_KEY",
        "",
    ).strip()

    if not api_key:
        raise AIServiceError(
            "AI service is not configured. "
            "Set OPENAI_API_KEY on the Django server."
        )

    return OpenAI(
        api_key=api_key,
    )


def _normalize_history(history):
    if not isinstance(history, list):
        return []

    normalized = []

    for item in history[-12:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role not in {"user", "assistant"}:
            continue

        if not isinstance(content, str):
            continue

        content = content.strip()

        if not content:
            continue

        normalized.append({
            "role": role,
            "content": content[:4000],
        })

    return normalized


def generate_health_reply(
    message,
    *,
    history=None,
    department=None,
    urgency=None,
    triage_guidance=None,
    doctor_context=None,
    medical_mode=True,
):
    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.5",
    ).strip() or "gpt-5.5"

    if medical_mode:

        context_lines = [
            "SYSTEM CONTEXT FOR THIS TURN:",
            f"Triage department: {department or 'Not determined'}",
            f"Triage urgency: {urgency or 'Not determined'}",
            (
                "Deterministic safety guidance: "
                f"{triage_guidance or 'None'}"
            ),
        ]

    else:

        context_lines = [
            "SYSTEM CONTEXT FOR THIS TURN:",
            (
                "This is a general conversational message. "
                "Do not infer symptoms, urgency, departments, "
                "doctors, or appointment recommendations unless "
                "the user actually describes a health problem."
            ),
        ]

    if doctor_context:
        context_lines.append(
            "Live available doctors/slots from the hospital database:"
        )

        for doctor in doctor_context[:5]:
            slot = doctor.get(
                "next_available_slot"
            )

            if slot:
                slot_text = (
                    f"{slot.get('display_date', '')} "
                    f"{slot.get('display_time', '')}"
                ).strip()
            else:
                slot_text = (
                    "No available slot in the next 14 days"
                )

            context_lines.append(
                "- "
                f"Dr. {doctor.get('name', 'Doctor')}; "
                f"{doctor.get('specialization') or 'Doctor'}; "
                f"department: {doctor.get('department_name') or '-'}; "
                f"experience: {doctor.get('experience_years', 0)} years; "
                f"fee: ₹{doctor.get('consultation_fee', '0')}; "
                f"next slot: {slot_text}"
            )
    else:
        context_lines.append(
            "Live available doctors/slots: none found."
        )

    input_messages = _normalize_history(
        history
    )

    input_messages.append({
        "role": "user",
        "content": (
            "\n".join(context_lines)
            + "\n\nPATIENT MESSAGE:\n"
            + message
        ),
    })

    try:
        response = _client().responses.create(
            model=model,
            instructions=SYSTEM_INSTRUCTIONS,
            input=input_messages,
            max_output_tokens=500,
        )

        reply = (
            response.output_text or ""
        ).strip()

        if not reply:
            raise AIServiceError(
                "AI returned an empty response."
            )

        return reply

    except AuthenticationError as exc:
        logger.exception(
            "OpenAI authentication failed."
        )
        raise AIServiceError(
            "AI authentication failed. Check OPENAI_API_KEY."
        ) from exc

    except RateLimitError as exc:
        logger.warning(
            "OpenAI rate limit reached: %s",
            exc,
        )
        raise AIServiceError(
            "The AI service is temporarily busy. Please try again shortly."
        ) from exc

    except APIConnectionError as exc:
        logger.warning(
            "Unable to connect to OpenAI: %s",
            exc,
        )
        raise AIServiceError(
            "Unable to reach the AI service. Please try again."
        ) from exc

    except APIStatusError as exc:
        logger.exception(
            "OpenAI API status error: %s",
            exc.status_code,
        )
        raise AIServiceError(
            "The AI service could not complete the request."
        ) from exc

    except AIServiceError:
        raise

    except Exception as exc:
        logger.exception(
            "Unexpected AI service error."
        )
        raise AIServiceError(
            "The AI service is temporarily unavailable."
        ) from exc
