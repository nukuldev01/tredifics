from django.urls import include, path
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views


@method_decorator(
    ratelimit(key="ip", rate="20/h", method="POST", block=True), name="post"
)
class ThrottledTokenObtain(TokenObtainPairView):
    pass


router = DefaultRouter()
router.register(r"addresses", views.AddressViewSet, basename="address")

urlpatterns = [
    path("signup/", views.SignupView.as_view(), name="signup"),
    path("login/", ThrottledTokenObtain.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("otp/request/", views.OTPRequestView.as_view(), name="otp-request"),
    path("otp/verify/", views.OTPVerifyView.as_view(), name="otp-verify"),
    path("", include(router.urls)),
]
