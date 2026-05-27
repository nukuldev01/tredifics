from decimal import Decimal

from rest_framework.test import APITestCase

from .models import ShippingRate


class ShippingRateAPITests(APITestCase):
    def setUp(self):
        ShippingRate.objects.create(
            country="IN", method="standard",
            price=Decimal("60"), free_above=Decimal("1999"),
        )
        ShippingRate.objects.create(
            country="IN", method="express", price=Decimal("150"),
        )

    def test_list_returns_rates(self):
        res = self.client.get("/api/shipping/rates/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 2)

    def test_filter_by_country(self):
        self.assertEqual(
            len(self.client.get("/api/shipping/rates/?country=in").data), 2
        )
        self.assertEqual(
            len(self.client.get("/api/shipping/rates/?country=US").data), 0
        )

    def test_public_endpoint_ignores_stale_token(self):
        # Regression: an expired/garbage JWT must not 401 a public endpoint.
        self.client.credentials(HTTP_AUTHORIZATION="Bearer garbage.token.value")
        res = self.client.get("/api/shipping/rates/")
        self.assertEqual(res.status_code, 200)
