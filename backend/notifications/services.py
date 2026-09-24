from .models import Notification


def create_notification(
    *,
    user,
    title,
    message,
    notification_type=Notification.NotificationType.SYSTEM,
    priority=Notification.Priority.NORMAL,
    action_url="",
    object_type="",
    object_id="",
    metadata=None,
):
    if user is None or not getattr(user, "pk", None):
        return None

    safe_title = str(title or "SmartCare Notification").strip()[:180]
    safe_message = str(message or safe_title).strip()

    return Notification.objects.create(
        user=user,
        title=safe_title,
        message=safe_message,
        notification_type=notification_type,
        priority=priority,
        action_url=str(action_url or "")[:500],
        object_type=str(object_type or "")[:100],
        object_id=str(object_id if object_id is not None else "")[:100],
        metadata=metadata if isinstance(metadata, dict) else {},
    )


def create_bulk_notifications(
    *,
    users,
    title,
    message,
    notification_type=Notification.NotificationType.SYSTEM,
    priority=Notification.Priority.NORMAL,
    action_url="",
    object_type="",
    object_id="",
    metadata=None,
):
    unique_users = {}
    for user in users or []:
        user_id = getattr(user, "pk", None)
        if user_id:
            unique_users[user_id] = user

    rows = [
        Notification(
            user=user,
            title=str(title or "SmartCare Notification").strip()[:180],
            message=str(message or title or "SmartCare Notification").strip(),
            notification_type=notification_type,
            priority=priority,
            action_url=str(action_url or "")[:500],
            object_type=str(object_type or "")[:100],
            object_id=str(object_id if object_id is not None else "")[:100],
            metadata=metadata if isinstance(metadata, dict) else {},
        )
        for user in unique_users.values()
    ]

    if not rows:
        return []

    return Notification.objects.bulk_create(rows)
