import re


GREETING_PATTERNS = [
    r"^\s*hi\s*$",
    r"^\s*hello\s*$",
    r"^\s*hey\s*$",
    r"^\s*hi there\s*$",
    r"^\s*hello there\s*$",
    r"^\s*good morning\s*$",
    r"^\s*good afternoon\s*$",
    r"^\s*good evening\s*$",
]


THANKS_PATTERNS = [
    r"^\s*thanks\s*$",
    r"^\s*thank you\s*$",
    r"^\s*thankyou\s*$",
    r"^\s*thanks a lot\s*$",
    r"^\s*okay thanks\s*$",
    r"^\s*ok thanks\s*$",
]


CAPABILITY_PATTERNS = [
    r"what can you do",
    r"how can you help",
    r"what do you do",
    r"what are you",
    r"who are you",
    r"help me",
]


SYMPTOM_TERMS = [
    "pain",
    "fever",
    "cold",
    "cough",
    "headache",
    "migraine",
    "vomit",
    "vomiting",
    "diarrhea",
    "constipation",
    "acidity",
    "rash",
    "itching",
    "redness",
    "acne",
    "dizzy",
    "dizziness",
    "weakness",
    "fatigue",
    "tired",
    "breathing",
    "breath",
    "wheezing",
    "asthma",
    "palpitation",
    "heartbeat",
    "numbness",
    "tingling",
    "seizure",
    "bleeding",
    "swelling",
    "sore throat",
    "blocked nose",
    "sinus",
    "ear pain",
    "joint pain",
    "back pain",
    "knee pain",
    "shoulder pain",
    "fracture",
    "stomach pain",
    "abdominal pain",
    "body pain",
]


FOLLOW_UP_PHRASES = [
    "since yesterday",
    "since today",
    "since morning",
    "since last night",
    "for one day",
    "for two days",
    "for 2 days",
    "for three days",
    "for 3 days",
    "for a week",
    "one day",
    "two days",
    "three days",
    "mild",
    "moderate",
    "severe",
    "yes",
    "no",
    "sometimes",
    "continuously",
    "on and off",
    "getting worse",
    "getting better",
]


def normalize(value):
    if not isinstance(value, str):
        return ""

    return re.sub(
        r"\s+",
        " ",
        value.lower().strip(),
    )


def matches_any_pattern(
    text,
    patterns,
):
    return any(
        re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )
        for pattern in patterns
    )


def history_has_medical_context(
    history,
):
    if not isinstance(history, list):
        return False

    for item in history[-8:]:
        if not isinstance(item, dict):
            continue

        content = normalize(
            item.get(
                "content",
                ""
            )
        )

        if not content:
            continue

        if any(
            term in content
            for term in SYMPTOM_TERMS
        ):
            return True

    return False


def detect_chat_intent(
    message,
    history=None,
):
    """
    Returns one of:
    - GREETING
    - THANKS
    - CAPABILITY
    - MEDICAL
    - FOLLOW_UP_MEDICAL
    - GENERAL
    """
    text = normalize(
        message
    )

    if not text:
        return "GENERAL"

    if matches_any_pattern(
        text,
        GREETING_PATTERNS,
    ):
        return "GREETING"

    if matches_any_pattern(
        text,
        THANKS_PATTERNS,
    ):
        return "THANKS"

    if matches_any_pattern(
        text,
        CAPABILITY_PATTERNS,
    ):
        return "CAPABILITY"

    if any(
        term in text
        for term in SYMPTOM_TERMS
    ):
        return "MEDICAL"

    if (
        history_has_medical_context(
            history
        )
        and (
            any(
                phrase in text
                for phrase in FOLLOW_UP_PHRASES
            )
            or len(
                text.split()
            ) <= 8
        )
    ):
        return "FOLLOW_UP_MEDICAL"

    return "GENERAL"


def get_static_reply(
    intent,
):
    if intent == "GREETING":
        return (
            "Hi! I'm SmartCare AI. I can help you understand symptoms, "
            "suggest a suitable department, show available doctors, "
            "and help you find appointment slots. How can I help you today?"
        )

    if intent == "THANKS":
        return (
            "You're welcome. If you have any symptoms, questions about "
            "which department to visit, or need help finding a doctor, "
            "I'm here to help."
        )

    if intent == "CAPABILITY":
        return (
            "I can help you describe symptoms, identify an appropriate "
            "hospital department, show available doctors and their next "
            "appointment slots, and guide you toward booking. I can also "
            "answer basic health-related questions, but I do not replace "
            "a doctor or provide a definitive diagnosis."
        )

    return None
