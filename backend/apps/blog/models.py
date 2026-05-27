from django.conf import settings
from django.db import models
from django.utils.text import slugify


class BlogCategory(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)

    class Meta:
        verbose_name_plural = "blog categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BlogPost(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"), (STATUS_PUBLISHED, "Published"),
    ]

    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True)
    excerpt = models.CharField(max_length=300, blank=True)
    body = models.TextField(help_text="Markdown supported on the storefront.")
    cover_image = models.ImageField(upload_to="blog/", blank=True, null=True)
    cover_image_url = models.URLField(
        blank=True, help_text="Fallback if no file uploaded."
    )
    cover_alt = models.CharField(max_length=200, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="blog_posts",
    )
    author_name = models.CharField(
        max_length=120, blank=True,
        help_text="Override of author display name (defaults to user's name).",
    )
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="posts",
    )

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_PUBLISHED)
    published_at = models.DateTimeField(null=True, blank=True)

    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)
    focus_keyword = models.CharField(max_length=80, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:240]
        super().save(*args, **kwargs)

    def cover_src(self):
        if self.cover_image:
            return self.cover_image.url
        return self.cover_image_url

    @property
    def reading_minutes(self):
        word_count = len(self.body.split())
        return max(1, round(word_count / 200))

    def __str__(self):
        return self.title
