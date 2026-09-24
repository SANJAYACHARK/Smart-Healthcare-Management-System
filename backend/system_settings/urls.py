from django.urls import path
from .views import AdminSystemSettingView,PublicSystemSettingView
urlpatterns=[path("admin/",AdminSystemSettingView.as_view()),path("public/",PublicSystemSettingView.as_view())]
