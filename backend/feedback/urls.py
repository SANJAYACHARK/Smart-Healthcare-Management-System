from django.urls import path

from .views import (
    PatientFeedbackListCreateView,
    ReceptionistFeedbackListView,
)


urlpatterns = [

    path(
        "patient/",
        PatientFeedbackListCreateView.as_view(),
        name="patient-feedback",
    ),

    path(
        "receptionist/",
        ReceptionistFeedbackListView.as_view(),
        name="receptionist-feedback",
    ),

]