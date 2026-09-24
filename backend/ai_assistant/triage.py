import re


# ============================================================
# EMERGENCY RED FLAGS
# ============================================================

EMERGENCY_PATTERNS = [

    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "cannot breathe",
    "severe bleeding",
    "unconscious",
    "fainted",
    "seizure",
    "stroke",
    "face drooping",
    "slurred speech",
    "severe allergic reaction",
    "suicidal",
    "overdose",

]


# ============================================================
# DEPARTMENT KEYWORDS
# ============================================================

DEPARTMENT_RULES = {

    "Cardiology": [
        "chest pain",
        "palpitation",
        "heartbeat",
        "heart",
    ],

    "Dermatology": [
        "rash",
        "itching",
        "skin",
        "acne",
        "redness",
    ],

    "Orthopedics": [
        "joint pain",
        "back pain",
        "knee pain",
        "bone",
        "fracture",
        "shoulder pain",
    ],

    "ENT": [
        "ear pain",
        "sore throat",
        "blocked nose",
        "sinus",
        "hearing",
    ],

    "Gastroenterology": [
        "stomach pain",
        "abdominal pain",
        "vomiting",
        "diarrhea",
        "constipation",
        "acidity",
    ],

    "Neurology": [
        "migraine",
        "severe headache",
        "numbness",
        "tingling",
        "seizure",
        "dizziness",
    ],

    "Pulmonology": [
        "cough",
        "breathing",
        "wheezing",
        "asthma",
    ],

    "General Medicine": [
        "fever",
        "cold",
        "headache",
        "weakness",
        "body pain",
        "fatigue",
    ],

}


def normalize_text(text):

    text = text.lower()

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text,
    )

    return re.sub(
        r"\s+",
        " ",
        text,
    ).strip()


def contains_any(
    text,
    phrases,
):

    return any(
        phrase in text
        for phrase in phrases
    )


def detect_emergency(text):

    return contains_any(
        text,
        EMERGENCY_PATTERNS,
    )


def detect_department(text):

    scores = {}


    for department, keywords in (
        DEPARTMENT_RULES.items()
    ):

        score = sum(
            1
            for keyword in keywords
            if keyword in text
        )

        if score:

            scores[department] = (
                score
            )


    if not scores:

        return "General Medicine"


    return max(
        scores,
        key=scores.get,
    )


def determine_urgency(
    text,
    emergency,
):

    if emergency:
        return "EMERGENCY"


    urgent_words = [
        "severe",
        "very painful",
        "high fever",
        "persistent",
        "worsening",
        "blood",
    ]


    if contains_any(
        text,
        urgent_words,
    ):

        return "URGENT"


    return "ROUTINE"


def build_guidance(
    text,
    department,
    urgency,
):

    if urgency == "EMERGENCY":

        return (
            "Your description includes symptoms that may require urgent "
            "medical attention. Please seek emergency care immediately "
            "or contact your local emergency service. Do not rely on "
            "this chatbot for emergency assessment."
        )


    if urgency == "URGENT":

        return (
            "Your symptoms may need prompt clinical evaluation. "
            f"Consider arranging a consultation with {department} "
            "as soon as reasonably possible. If symptoms become severe, "
            "you develop breathing difficulty, fainting, confusion, "
            "heavy bleeding, or severe chest pain, seek emergency care."
        )


    return (
        f"Based on the symptoms you described, {department} may be "
        "an appropriate department to start with. For mild symptoms, "
        "rest, hydration, and monitoring may be reasonable while you "
        "arrange medical advice. If symptoms persist, worsen, or new "
        "concerning symptoms appear, consult a healthcare professional."
    )


def analyze_symptoms(
    message,
):

    text = normalize_text(
        message
    )


    emergency = (
        detect_emergency(
            text
        )
    )


    department = (
        detect_department(
            text
        )
    )


    urgency = (
        determine_urgency(
            text,
            emergency,
        )
    )


    reply = (
        build_guidance(
            text,
            department,
            urgency,
        )
    )


    return {

        "reply":
            reply,

        "department":
            department,

        "urgency":
            urgency,

        "emergency":
            emergency,

    }