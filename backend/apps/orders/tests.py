from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

from apps.catalog.models import Category, Color, Product, ProductVariant
from apps.shipping.models import ShippingRate

from .models import Order
from .services import create_order_from_payload, mark_order_paid


def build_variant(stock=5, price="1000"):
    category, _ = Category.objects.get_or_create(name="Kurti", slug="kurti")
    color, _ = Color.objects.get_or_create(name="Red")
    product = Product.objects.create(
        name="Kurti", slug="kurti-x", sku="SKU-O", category=category,
        price=Decimal(price),
    )
    return ProductVariant.objects.create(
        product=product, size="M", color=color, stock=stock,
    )


class OrderServiceTests(TestCase):
    def setUp(self):
        self.variant = build_variant(stock=5, price="1000")
        ShippingRate.objects.create(
            country="IN", method="standard",
            price=Decimal("60"), free_above=Decimal("1999"),
        )

    def _payload(self, qty=1, country="IN"):
        return {
            "email": "buyer@example.com",
            "items": [{"variant_id": self.variant.id, "quantity": qty}],
            "shipping_address": {"city": "Jaipur"},
            "shipping_country": country, "shipping_method": "standard",
            "currency": "INR",
        }

    def test_totals_use_server_prices(self):
        order = create_order_from_payload(self._payload(qty=2))
        self.assertEqual(order.subtotal, Decimal("2000"))
        self.assertEqual(order.grand_total, order.subtotal + order.shipping_total)

    def test_free_shipping_above_threshold(self):
        order = create_order_from_payload(self._payload(qty=2))  # 2000 >= 1999
        self.assertEqual(order.shipping_total, Decimal("0"))

    def test_shipping_charged_below_threshold(self):
        order = create_order_from_payload(self._payload(qty=1))  # 1000 < 1999
        self.assertEqual(order.shipping_total, Decimal("60"))
        self.assertEqual(order.grand_total, Decimal("1060"))

    def test_oversell_is_blocked(self):
        with self.assertRaises(ValueError):
            create_order_from_payload(self._payload(qty=99))

    def test_country_without_shipping_rate_rejected(self):
        with self.assertRaises(ValueError):
            create_order_from_payload(self._payload(country="US"))

    def test_mark_order_paid_decrements_stock_exactly_once(self):
        order = create_order_from_payload(self._payload(qty=2))
        first = mark_order_paid(order.pk, payment_id="pay_1")
        self.variant.refresh_from_db()
        self.assertIsNotNone(first)
        self.assertEqual(self.variant.stock, 3)
        second = mark_order_paid(order.pk, payment_id="pay_1")
        self.variant.refresh_from_db()
        self.assertIsNone(second)
        self.assertEqual(self.variant.stock, 3)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PAYMENT_PAID)
        self.assertEqual(order.status, Order.STATUS_CONFIRMED)

    def test_display_id_format(self):
        order = create_order_from_payload(self._payload(qty=1))
        self.assertEqual(order.display_id, f"TRD{order.id:06d}")


@override_settings(RATELIMIT_ENABLE=False)
class CheckoutAPITests(APITestCase):
    def setUp(self):
        self.variant = build_variant(stock=10, price="500")
        ShippingRate.objects.create(
            country="IN", method="standard", price=Decimal("60"),
        )

    def _payload(self, country="IN"):
        return {
            "email": "buyer@example.com",
            "items": [{"variant_id": self.variant.id, "quantity": 1}],
            "shipping_address": {"city": "Jaipur"},
            "shipping_country": country, "shipping_method": "standard",
            "currency": "INR",
        }

    def test_checkout_creates_order(self):
        res = self.client.post(
            "/api/orders/checkout/", self._payload(), format="json"
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_rejects_unsupported_country(self):
        res = self.client.post(
            "/api/orders/checkout/", self._payload(country="ZZ"), format="json"
        )
        self.assertEqual(res.status_code, 400)

    def test_checkout_works_with_stale_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer stale.dead.token")
        res = self.client.post(
            "/api/orders/checkout/", self._payload(), format="json"
        )
        self.assertEqual(res.status_code, 201)

    def test_guest_order_lookup_requires_matching_email(self):
        order = create_order_from_payload(self._payload())
        ok = self.client.get(
            f"/api/orders/lookup/?public_id={order.public_id}"
            "&email=buyer@example.com"
        )
        self.assertEqual(ok.status_code, 200)
        wrong = self.client.get(
            f"/api/orders/lookup/?public_id={order.public_id}"
            "&email=intruder@example.com"
        )
        self.assertEqual(wrong.status_code, 404)
