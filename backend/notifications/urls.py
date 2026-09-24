from django.urls import path

from .views import (
    NotificationClearReadView,
    NotificationDeleteView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
)

app_name = "notifications"

urlpatterns = [
    path("", NotificationListView.as_view(), name="list"),
    path("unread-count/", NotificationUnreadCountView.as_view(), name="unread-count"),
    path("<int:notification_id>/read/", NotificationMarkReadView.as_view(), name="mark-read"),
    path("mark-all-read/", NotificationMarkAllReadView.as_view(), name="mark-all-read"),
    path("<int:notification_id>/delete/", NotificationDeleteView.as_view(), name="delete"),
    path("clear-read/", NotificationClearReadView.as_view(), name="clear-read"),
]
