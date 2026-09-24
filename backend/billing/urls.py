from django.urls import path

from .views import (
    PatientBillListView,
    ReceptionistBillListCreateView,
    ReceptionistBillDetailView,
    PatientCreatePaymentOrderView,
    PatientVerifyPaymentView,
    PatientBillPaymentListView,
    RazorpayWebhookView,
)


urlpatterns = [

    path(
        "patient/",
        PatientBillListView.as_view(),
        name="patient-bills",
    ),

    path(
        "receptionist/",
        ReceptionistBillListCreateView.as_view(),
        name="receptionist-bills",
    ),

    path(
        "receptionist/<int:bill_id>/",
        ReceptionistBillDetailView.as_view(),
        name="receptionist-bill-detail",
    ),



    path(
        "patient/<int:bill_id>/payment/create-order/",
        PatientCreatePaymentOrderView.as_view(),
        name="patient-payment-create-order",
    ),

    path(
        "patient/payment/verify/",
        PatientVerifyPaymentView.as_view(),
        name="patient-payment-verify",
    ),

    path(
        "patient/<int:bill_id>/payments/",
        PatientBillPaymentListView.as_view(),
        name="patient-bill-payments",
    ),

    path(
        "razorpay/webhook/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),

]
