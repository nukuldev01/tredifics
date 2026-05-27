from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Banner, NewsletterSubscriber, StaticPage


class ContentAPITests(APITestCase):
    def test_banners_returns_only_active(self):
        Banner.objects.create(kind="brand_story", headline="Active", is_active=True)
        Banner.objects.create(kind="promo", headline="Inactive", is_active=False)
        res = self.client.get("/api/content/banners/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["headline"], "Active")

    def test_banners_ignore_stale_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer junk.token")
        self.assertEqual(self.client.get("/api/content/banners/").status_code, 200)

    def test_static_page_detail(self):
        StaticPage.objects.create(
            title="About Us", slug="about-us", body="Hello", is_published=True,
        )
        res = self.client.get("/api/content/pages/about-us/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["slug"], "about-us")

    def test_unpublished_static_page_404(self):
        StaticPage.objects.create(
            title="Hidden", slug="hidden", body="x", is_published=False,
        )
        self.assertEqual(
            self.client.get("/api/content/pages/hidden/").status_code, 404
        )


@override_settings(RATELIMIT_ENABLE=False)
class NewsletterTests(APITestCase):
    def test_subscribe(self):
        res = self.client.post(
            "/api/content/newsletter/", {"email": "fan@example.com"}, format="json"
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_subscribe_is_idempotent_case_insensitive(self):
        self.client.post(
            "/api/content/newsletter/", {"email": "fan@example.com"}, format="json"
        )
        self.client.post(
            "/api/content/newsletter/", {"email": "FAN@example.com"}, format="json"
        )
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_subscribe_rejects_invalid_email(self):
        res = self.client.post(
            "/api/content/newsletter/", {"email": "not-an-email"}, format="json"
        )
        self.assertEqual(res.status_code, 400)
