from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Category, Color, Product, ProductVariant, Review

User = get_user_model()


def make_product(slug="test-kurti", sku="SKU-T",
                 status=Product.STATUS_PUBLISHED, price="1499"):
    category, _ = Category.objects.get_or_create(name="Kurti", slug="kurti")
    return Product.objects.create(
        name="Test Kurti", slug=slug, sku=sku, category=category,
        price=Decimal(price), status=status,
    )


class ProductAPITests(APITestCase):
    def setUp(self):
        self.published = make_product(slug="published-kurti", sku="SKU-P")
        self.draft = make_product(
            slug="draft-kurti", sku="SKU-D", status=Product.STATUS_DRAFT,
        )

    def test_list_returns_only_published(self):
        res = self.client.get("/api/products/")
        self.assertEqual(res.status_code, 200)
        slugs = [p["slug"] for p in res.data["results"]]
        self.assertIn("published-kurti", slugs)
        self.assertNotIn("draft-kurti", slugs)

    def test_detail_published(self):
        res = self.client.get("/api/products/published-kurti/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["slug"], "published-kurti")

    def test_detail_draft_is_404(self):
        self.assertEqual(
            self.client.get("/api/products/draft-kurti/").status_code, 404
        )

    def test_public_endpoint_ignores_stale_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not.a.real.jwt")
        self.assertEqual(self.client.get("/api/products/").status_code, 200)

    def test_search_matches_name(self):
        res = self.client.get("/api/products/?search=Kurti")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.data["count"], 1)


@override_settings(RATELIMIT_ENABLE=False)
class ReviewTests(APITestCase):
    def setUp(self):
        self.product = make_product()

    def test_new_review_defaults_to_unapproved(self):
        res = self.client.post("/api/reviews/", {
            "product": self.product.id, "name": "Asha",
            "rating": 5, "body": "Lovely fabric",
        }, format="multipart")
        self.assertEqual(res.status_code, 201)
        self.assertFalse(Review.objects.get(product=self.product).is_approved)

    def test_rating_must_be_within_1_to_5(self):
        res = self.client.post("/api/reviews/", {
            "product": self.product.id, "name": "Bad", "rating": 9, "body": "x",
        }, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.assertIn("rating", res.data)

    def test_only_approved_reviews_shown_on_product(self):
        Review.objects.create(product=self.product, name="Hidden",
                              rating=5, body="hidden", is_approved=False)
        Review.objects.create(product=self.product, name="Shown",
                              rating=4, body="shown", is_approved=True)
        res = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertEqual(res.data["review_count"], 1)
        self.assertEqual([r["name"] for r in res.data["reviews"]], ["Shown"])


class WishlistTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="w@example.com", email="w@example.com",
            password="Str0ng-Pass-92xQ",
        )
        self.product = make_product()

    def test_wishlist_requires_authentication(self):
        self.assertEqual(self.client.get("/api/wishlist/").status_code, 401)

    def test_toggle_adds_then_removes(self):
        self.client.force_authenticate(self.user)
        added = self.client.post(
            "/api/wishlist/toggle/", {"product_id": self.product.id}, format="json"
        )
        self.assertTrue(added.data["wishlisted"])
        removed = self.client.post(
            "/api/wishlist/toggle/", {"product_id": self.product.id}, format="json"
        )
        self.assertFalse(removed.data["wishlisted"])
