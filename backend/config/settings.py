"""
Django settings for SmartHealthcare.

Development:
    DJANGO_ENV=development

Production:
    DJANGO_ENV=production
"""

import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(BASE_DIR / ".env")

ENVIRONMENT = os.getenv(
    "DJANGO_ENV",
    "development",
).strip().lower()

IS_PRODUCTION = ENVIRONMENT == "production"


# ============================================================
# SECRET KEY
# ============================================================

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY"
)

if not SECRET_KEY:

    if IS_PRODUCTION:
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be configured in production."
        )

    SECRET_KEY = (
        "development-only-change-me-before-production"
    )


# ============================================================
# DEBUG
# ============================================================

if IS_PRODUCTION:

    DEBUG = False

else:

    DEBUG = os.getenv(
        "DJANGO_DEBUG",
        "True",
    ).lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


# ============================================================
# ALLOWED HOSTS
# ============================================================

if IS_PRODUCTION:

    ALLOWED_HOSTS = [
        host.strip()
        for host in os.getenv(
            "DJANGO_ALLOWED_HOSTS",
            "",
        ).split(",")
        if host.strip()
    ]

    if not ALLOWED_HOSTS:
        raise RuntimeError(
            "DJANGO_ALLOWED_HOSTS must be configured "
            "in production."
        )

else:

    ALLOWED_HOSTS = [
        "127.0.0.1",
        "localhost",
    ]


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [

    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "corsheaders",

    # SmartCare
    "accounts",
    "departments",
    "appointments",
    "feedback",
    "chat",
    "medical_records",
    "laboratory",
    "billing",
    "ai_assistant",
    "notifications",
    "queue_management",
    "appointment_reminders",
    "audit_logs",
    "analytics",
    "reports",
    "system_settings",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [

    "django.middleware.security.SecurityMiddleware",

    # Keep CORS before CommonMiddleware.
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    # SmartCare audit logging
    "audit_logs.middleware.AuditLogMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL / WSGI
# ============================================================

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND":
            "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# DATABASE
# ============================================================

DATABASES = {
    "default": {

        "ENGINE":
            "django.db.backends.sqlite3",

        "NAME":
            BASE_DIR / "db.sqlite3",
    }
}


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME":
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator",
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = os.getenv(
    "DJANGO_TIME_ZONE",
    "Asia/Kolkata",
)

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# Optional project-level static directory.
#
# Only activate this automatically if the folder actually
# exists. This prevents collectstatic/check warnings.

PROJECT_STATIC_DIR = BASE_DIR / "static"

if PROJECT_STATIC_DIR.exists():

    STATICFILES_DIRS = [
        PROJECT_STATIC_DIR,
    ]


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# EMAIL
# ============================================================

MAILERS = {
    "default": {

        "BACKEND":
            "django.core.mail.backends.console.EmailBackend",
    },
}


# ============================================================
# CORS
# ============================================================

if IS_PRODUCTION:

    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "",
        ).split(",")
        if origin.strip()
    ]

else:

    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


CORS_ALLOW_CREDENTIALS = True


# ============================================================
# CSRF
# ============================================================

if IS_PRODUCTION:

    CSRF_TRUSTED_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CSRF_TRUSTED_ORIGINS",
            "",
        ).split(",")
        if origin.strip()
    ]

else:

    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": (

        "rest_framework_simplejwt.authentication."
        "JWTAuthentication",
    ),

    # Secure by default.
    # Public endpoints must explicitly use AllowAny.
    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_THROTTLE_CLASSES": (

        "rest_framework.throttling.AnonRateThrottle",

        "rest_framework.throttling.UserRateThrottle",
    ),

    "DEFAULT_THROTTLE_RATES": {

        "anon": os.getenv(
            "DRF_ANON_THROTTLE",
            "100/hour",
        ),

        "user": os.getenv(
            "DRF_USER_THROTTLE",
            "2000/hour",
        ),
    },
}


# ============================================================
# JWT
# ============================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME":
        timedelta(minutes=60),

    "REFRESH_TOKEN_LIFETIME":
        timedelta(days=7),

    "ROTATE_REFRESH_TOKENS":
        False,

    "BLACKLIST_AFTER_ROTATION":
        False,

    "AUTH_HEADER_TYPES":
        ("Bearer",),
}


# ============================================================
# CUSTOM USER
# ============================================================

AUTH_USER_MODEL = "accounts.User"


# ============================================================
# PRODUCTION HTTPS / SECURITY
# ============================================================

if IS_PRODUCTION:

    # --------------------------------------------------------
    # HTTPS
    # --------------------------------------------------------

    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True


    # --------------------------------------------------------
    # HSTS
    # --------------------------------------------------------

    SECURE_HSTS_SECONDS = int(
        os.getenv(
            "SECURE_HSTS_SECONDS",
            "31536000",
        )
    )

    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

    SECURE_HSTS_PRELOAD = True


    # --------------------------------------------------------
    # SECURITY HEADERS
    # --------------------------------------------------------

    SECURE_CONTENT_TYPE_NOSNIFF = True

    X_FRAME_OPTIONS = "DENY"

    SECURE_REFERRER_POLICY = (
        "strict-origin-when-cross-origin"
    )


    # --------------------------------------------------------
    # HTTPS REVERSE PROXY
    # --------------------------------------------------------
    #
    # Use when production HTTPS is terminated by a trusted
    # proxy such as Nginx / Render / Railway / etc.
    #

    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https",
    )


else:

    # ========================================================
    # DEVELOPMENT SECURITY
    # ========================================================

    SECURE_SSL_REDIRECT = False

    SESSION_COOKIE_SECURE = False

    CSRF_COOKIE_SECURE = False

    SECURE_HSTS_SECONDS = 0

    SECURE_HSTS_INCLUDE_SUBDOMAINS = False

    SECURE_HSTS_PRELOAD = False

    SECURE_CONTENT_TYPE_NOSNIFF = True

    X_FRAME_OPTIONS = "DENY"

    SECURE_REFERRER_POLICY = (
        "strict-origin-when-cross-origin"
    )


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)