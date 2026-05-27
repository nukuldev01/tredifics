import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, EmailOTP
from .serializers import (
    AddressSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    SignupSerializer,
    UserSerializer,
)

User = get_user_model()


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


@method_decorator(
    ratelimit(key="ip", rate="20/h", method="POST", block=True), name="post"
)
class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(
            {"user": UserSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@method_decorator(
    ratelimit(key="ip", rate="10/h", method="POST", block=True), name="post"
)
class OTPRequestView(generics.GenericAPIView):
    serializer_class = OTPRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        code = f"{secrets.randbelow(1000000):06d}"
        EmailOTP.objects.create(
            email=email,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_mail(
            subject="Your Tredific® login code",
            message=(
                f"Your verification code is {code}. It expires in 10 minutes.\n\n"
                "If you did not request this code, you can ignore this email."
            ),
            from_email=None,
            recipient_list=[email],
            fail_silently=True,
        )
        return Response({"detail": "OTP sent"})


@method_decorator(
    ratelimit(key="ip", rate="20/h", method="POST", block=True), name="post"
)
class OTPVerifyView(generics.GenericAPIView):
    serializer_class = OTPVerifySerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        code = ser.validated_data["code"]
        otp = (
            EmailOTP.objects.filter(email=email, code=code, consumed=False)
            .order_by("-created_at")
            .first()
        )
        if not otp or not otp.is_valid():
            return Response(
                {"detail": "Invalid or expired code"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        otp.consumed = True
        otp.save(update_fields=["consumed"])

        user, _ = User.objects.get_or_create(
            email=email, defaults={"username": email},
        )
        return Response({"user": UserSerializer(user).data, **_tokens_for(user)})
