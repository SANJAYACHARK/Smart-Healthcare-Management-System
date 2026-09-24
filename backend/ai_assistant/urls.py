from django.urls import path

from .views import (
    SymptomCheckerView,
)


urlpatterns = [

    path(
        "symptom-checker/",
        SymptomCheckerView.as_view(),
        name="symptom-checker",
    ),

]