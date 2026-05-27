from django.urls import path
from . import views

urlpatterns = [
    path("create-order/", views.CreatePaymentOrderView.as_view(), name="rzp-create"),
    path("verify/", views.VerifyPaymentView.as_view(), name="rzp-verify"),
    path("webhook/", views.WebhookView.as_view(), name="rzp-webhook"),
]
