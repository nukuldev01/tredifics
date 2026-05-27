from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Address, EmailOTP

User = get_user_model()
STRONG = "Str0ng-Pass-92xQ"


@override_settings(RATELIMIT_ENABLE=False)
class SignupTests(APITestCase):
    def test_rejects_weak_password(self):
        res = self.client.post("/api/auth/signup/", {
            "email": "weak@example.com", "password": "12345678",
            "first_name": "Weak", "country": "IN",
        }, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("password", res.data)

    def test_accepts_strong_password_and_returns_tokens(self):
        res = self.client.post("/api/auth/signup/", {
            "email": "strong@example.com", "password": STRONG,
            "first_name": "Strong", "country": "IN",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_password_is_hashed(self):
        self.client.post("/api/auth/signup/", {
            "email": "hash@example.com", "password": STRONG,
            "first_name": "H", "country": "IN",
        }, format="json")
        user = User.objects.get(email="hash@example.com")
        self.assertNotEqual(user.password, STRONG)
        self.assertTrue(user.check_password(STRONG))


@override_settings(RATELIMIT_ENABLE=False)
class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="log@example.com", email="log@example.com", password=STRONG,
        )

    def test_login_returns_tokens(self):
        res = self.client.post("/api/auth/login/", {
            "email": "log@example.com", "password": STRONG,
        }, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)

    def test_login_wrong_password_rejected(self):
        res = self.client.post("/api/auth/login/", {
            "email": "log@example.com", "password": "wrong-password",
        }, format="json")
        self.assertEqual(res.status_code, 401)

    def test_refresh_returns_new_tokens(self):
        login = self.client.post("/api/auth/login/", {
            "email": "log@example.com", "password": STRONG,
        }, format="json")
        res = self.client.post(
            "/api/auth/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        # ROTATE_REFRESH_TOKENS issues a fresh refresh token.
        self.assertIn("refresh", res.data)


@override_settings(RATELIMIT_ENABLE=False)
class OTPTests(APITestCase):
    def test_request_creates_code_and_sends_email(self):
        res = self.client.post(
            "/api/auth/otp/request/", {"email": "otp@example.com"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(EmailOTP.objects.filter(email="otp@example.com").count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_verify_valid_code_logs_in(self):
        otp = EmailOTP.objects.create(
            email="otp2@example.com", code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        res = self.client.post("/api/auth/otp/verify/", {
            "email": "otp2@example.com", "code": "123456",
        }, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        otp.refresh_from_db()
        self.assertTrue(otp.consumed)

    def test_verify_expired_code_rejected(self):
        EmailOTP.objects.create(
            email="otp3@example.com", code="123456",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        res = self.client.post("/api/auth/otp/verify/", {
            "email": "otp3@example.com", "code": "123456",
        }, format="json")
        self.assertEqual(res.status_code, 400)

    def test_verify_wrong_code_rejected(self):
        EmailOTP.objects.create(
            email="otp4@example.com", code="111111",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        res = self.client.post("/api/auth/otp/verify/", {
            "email": "otp4@example.com", "code": "999999",
        }, format="json")
        self.assertEqual(res.status_code, 400)


class AddressTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="addr@example.com", email="addr@example.com", password=STRONG,
        )

    def test_addresses_require_authentication(self):
        self.assertEqual(self.client.get("/api/auth/addresses/").status_code, 401)

    def test_user_sees_only_their_own_addresses(self):
        other = User.objects.create_user(
            username="other@example.com", email="other@example.com", password=STRONG,
        )
        Address.objects.create(
            user=other, full_name="Other", phone="1", line1="x",
            city="y", postal_code="1", country="IN",
        )
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/auth/addresses/")
        self.assertEqual(res.status_code, 200)
        results = res.data.get("results", res.data)
        self.assertEqual(len(results), 0)
