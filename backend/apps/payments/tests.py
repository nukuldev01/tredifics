import hashlib
import hmac
import json
from decimal import Decimal

from django.conf import settings
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.catalog.models import Category, Color, Product, ProductVariant
from apps.orders.models import Order
from apps.orders.services import create_order_from_payload
from apps.shipping.models import ShippingRate


def _rzp_signature(order_id, payment_id):
    body = f"{order_id}|{payment_id}".encode()
    return hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()


class PaymentTestBase(APITestCase):
    def setUp(self):
        category, _ = Category.objects.get_or_create(name="Kurti", slug="kurti")
        color, _ = Color.objects.get_or_create(name="Red")
        product = Product.objects.create(
            name="Kurti", slug="kurti-pay", sku="SKU-PAY",
            category=category, price=Decimal("1000"),
        )
        self.variant = ProductVariant.objects.create(
            product=product, size="M", color=color, stock=10,
        )
        ShippingRate.objects.create(
            country="IN", method="standard", price=Decimal("0"),
        )

    def make_order(self, razorpay_order_id):
        order = create_order_from_payload({
            "email": "buyer@example.com",
            "items": [{"variant_id": self.variant.id, "quantity": 1}],
            "shipping_address": {}, "shipping_country": "IN",
            "shipping_method": "standard", "currency": "INR",
        })
        order.razorpay_order_id = razorpay_order_id
        order.save(update_fields=["razorpay_order_id"])
        return order


class VerifyPaymentTests(PaymentTestBase):
    def test_valid_signature_marks_order_paid(self):
        order = self.make_order("order_THIS")
        res = self.client.post("/api/payments/verify/", {
            "public_id": str(order.public_id),
            "razorpay_order_id": "order_THIS",
            "razorpay_payment_id": "pay_1",
            "razorpay_signature": _rzp_signature("order_THIS", "pay_1"),
        }, format="json")
        self.assertEqual(res.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PAYMENT_PAID)

    def test_bad_signature_rejected_and_marked_failed(self):
        order = self.make_order("order_THIS")
        res = self.client.post("/api/payments/verify/", {
            "public_id": str(order.public_id),
            "razorpay_order_id": "order_THIS",
            "razorpay_payment_id": "pay_1",
            "razorpay_signature": "0000bad0000",
        }, format="json")
        self.assertEqual(res.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PAYMENT_FAILED)

    def test_payment_cannot_be_replayed_against_another_order(self):
        # B1 regression: a genuine signature for one order must NOT pay another.
        victim = self.make_order("order_VICTIM")
        attacker_sig = _rzp_signature("order_CHEAP", "pay_cheap")
        res = self.client.post("/api/payments/verify/", {
            "public_id": str(victim.public_id),
            "razorpay_order_id": "order_CHEAP",
            "razorpay_payment_id": "pay_cheap",
            "razorpay_signature": attacker_sig,
        }, format="json")
        self.assertEqual(res.status_code, 400)
        victim.refresh_from_db()
        self.assertNotEqual(victim.payment_status, Order.PAYMENT_PAID)


@override_settings(RAZORPAY_WEBHOOK_SECRET="test-webhook-secret")
class WebhookTests(PaymentTestBase):
    def _post(self, payload):
        body = json.dumps(payload).encode()
        sig = hmac.new(b"test-webhook-secret", body, hashlib.sha256).hexdigest()
        return self.client.post(
            "/api/payments/webhook/", data=body,
            content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=sig,
        )

    def test_bad_signature_rejected(self):
        res = self.client.post(
            "/api/payments/webhook/", data=b"{}",
            content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE="wrong",
        )
        self.assertEqual(res.status_code, 400)

    def test_captured_event_marks_order_paid(self):
        order = self.make_order("order_WH")
        res = self._post({
            "event": "payment.captured",
            "payload": {"payment": {"entity": {
                "order_id": "order_WH", "id": "pay_WH",
            }}},
        })
        self.assertEqual(res.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PAYMENT_PAID)
