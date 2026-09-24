import re

from .models import AuditLog


SENSITIVE_KEYS = {
    "password",
    "old_password",
    "new_password",
    "confirm_password",
    "token",
    "access",
    "refresh",
    "authorization",
    "razorpay_signature",
    "gateway_signature",
    "key_secret",
    "webhook_secret",
    "auth_token",
}


def client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def module_from_path(path):
    parts = [part for part in path.split("/") if part]
    if parts and parts[0] == "api":
        parts = parts[1:]
    return (parts[0] if parts else "system").replace("-", "_").upper()


def action_from_method(method):
    return {
        "POST": AuditLog.Action.CREATE,
        "PUT": AuditLog.Action.UPDATE,
        "PATCH": AuditLog.Action.UPDATE,
        "DELETE": AuditLog.Action.DELETE,
    }.get(method.upper(), AuditLog.Action.OTHER)


def object_from_path(path):
    parts = [part for part in path.split("/") if part]
    object_id = ""
    for part in reversed(parts):
        if part.isdigit():
            object_id = part
            break

    object_type = ""
    if object_id:
        try:
            index = parts.index(object_id)
            if index > 0:
                object_type = parts[index - 1].replace("-", "_").upper()
        except ValueError:
            pass

    return object_type, object_id


def safe_metadata(data):
    if not isinstance(data, dict):
        return {}

    result = {}
    for key, value in data.items():
        lowered = str(key).lower()
        if lowered in SENSITIVE_KEYS or any(
            token in lowered
            for token in ("password", "secret", "signature", "token")
        ):
            continue

        if isinstance(value, (str, int, float, bool)) or value is None:
            text = value
            if isinstance(value, str) and len(value) > 200:
                text = value[:200] + "…"
            result[str(key)] = text

    return result


def write_audit_log(
    *,
    request,
    action=None,
    module=None,
    description=None,
    object_type="",
    object_id="",
    response_status=None,
    metadata=None,
):
    user = getattr(request, "user", None)
    authenticated = bool(user and getattr(user, "is_authenticated", False))

    if not authenticated:
        return None

    role = getattr(user, "role", "") or (
        "ADMIN" if getattr(user, "is_superuser", False) else ""
    )

    full_name = ""
    if hasattr(user, "get_full_name"):
        full_name = user.get_full_name().strip()

    resolved_object_type, resolved_object_id = object_from_path(request.path)
    object_type = object_type or resolved_object_type
    object_id = str(object_id or resolved_object_id or "")

    resolved_module = module or module_from_path(request.path)
    resolved_action = action or action_from_method(request.method)

    if not description:
        verb = {
            AuditLog.Action.CREATE: "created or submitted",
            AuditLog.Action.UPDATE: "updated",
            AuditLog.Action.DELETE: "deleted",
        }.get(resolved_action, "performed an action on")

        target = object_type.replace("_", " ").title() if object_type else resolved_module.title()
        if object_id:
            target = f"{target} #{object_id}"

        description = f"{full_name or user.username} {verb} {target}."

    return AuditLog.objects.create(
        actor=user,
        actor_username=getattr(user, "username", "") or "",
        actor_name=full_name,
        role=role,
        action=resolved_action,
        module=resolved_module,
        description=description[:500],
        object_type=object_type[:100],
        object_id=object_id[:100],
        request_method=request.method[:10],
        request_path=request.path[:500],
        response_status=response_status,
        ip_address=client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        metadata=safe_metadata(metadata or {}),
    )
