from rest_framework.test import APITestCase

from .models import BlogCategory, BlogPost


class BlogAPITests(APITestCase):
    def setUp(self):
        self.category = BlogCategory.objects.create(name="Style", slug="style")
        BlogPost.objects.create(
            title="Published Post", slug="published-post", body="Body text here",
            status=BlogPost.STATUS_PUBLISHED, category=self.category,
        )
        BlogPost.objects.create(
            title="Draft Post", slug="draft-post", body="x",
            status=BlogPost.STATUS_DRAFT,
        )

    def test_list_returns_only_published(self):
        res = self.client.get("/api/blog/posts/")
        self.assertEqual(res.status_code, 200)
        slugs = [p["slug"] for p in res.data["results"]]
        self.assertIn("published-post", slugs)
        self.assertNotIn("draft-post", slugs)

    def test_detail_returns_published(self):
        res = self.client.get("/api/blog/posts/published-post/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["slug"], "published-post")

    def test_detail_draft_is_404(self):
        res = self.client.get("/api/blog/posts/draft-post/")
        self.assertEqual(res.status_code, 404)
