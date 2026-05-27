from django.db import models
from django.utils.text import slugify


class StaticPage(models.Model):
    """Editable content pages (About, Returns, Shipping, FAQ, etc.)."""
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    body = models.TextField(help_text="Markdown supported in the storefront.")
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class HomepageSection(models.Model):
    """Lightweight homepage block — heading, subheading, image, CTA."""

    KIND_CHOICES = [
        ("hero", "Hero"),
        ("banner", "Promo banner"),
        ("usp", "USP / Trust bar"),
    ]

    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    heading = models.CharField(max_length=200, blank=True)
    subheading = models.CharField(max_length=300, blank=True)
    image = models.ImageField(upload_to="homepage/", blank=True, null=True)
    image_url = models.URLField(blank=True)
    image_alt = models.CharField(max_length=200, blank=True)
    cta_label = models.CharField(max_length=80, blank=True)
    cta_url = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.kind}: {self.heading or self.id}"

    def src(self):
        if self.image:
            return self.image.url
        return self.image_url


class Testimonial(models.Model):
    name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField(default=5)
    body = models.TextField()
    location = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "-id"]

    def __str__(self):
        return f"{self.name} ({self.rating}★)"


# ----- New CMS models -----------------------------------------------------


class Banner(models.Model):
    """Admin-uploadable hero carousel slide.

    Order is controlled by `sort_order`; first slide on a fresh site is the
    brand story slide (whichever the admin sets sort_order=0 on).
    """
    KIND_BRAND_STORY = "brand_story"
    KIND_CATEGORY = "category"
    KIND_PROMO = "promo"
    KIND_SPLIT = "split"
    KIND_CHOICES = [
        (KIND_BRAND_STORY, "Brand story"),
        (KIND_CATEGORY, "Category"),
        (KIND_PROMO, "Promo"),
        (KIND_SPLIT, "Split Promo (Middle)"),
    ]

    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default=KIND_PROMO)
    headline = models.CharField(max_length=200)
    subheadline = models.CharField(max_length=300, blank=True)
    eyebrow = models.CharField(
        max_length=80, blank=True,
        help_text="Small label above the headline (e.g. 'Spring/Summer Edit').",
    )

    image = models.ImageField(upload_to="banners/", blank=True, null=True,
                              help_text="Desktop image. Recommended 1920×900.")
    mobile_image = models.ImageField(upload_to="banners/", blank=True, null=True,
                                     help_text="Optional separate mobile crop.")
    image_url = models.URLField(blank=True,
                                help_text="Fallback URL if no file uploaded.")
    image_alt = models.CharField(max_length=200, blank=True)

    cta_label = models.CharField(max_length=80, blank=True)
    cta_url = models.CharField(max_length=255, blank=True)
    cta_secondary_label = models.CharField(max_length=80, blank=True)
    cta_secondary_url = models.CharField(max_length=255, blank=True)

    overlay_opacity = models.PositiveSmallIntegerField(
        default=30, help_text="0–80. Darkens the image for text legibility.",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def src(self):
        if self.image:
            return self.image.url
        return self.image_url

    def mobile_src(self):
        if self.mobile_image:
            return self.mobile_image.url
        return self.src()

    def __str__(self):
        return f"[{self.get_kind_display()}] {self.headline}"


class Reel(models.Model):
    """Influencer reel — Instagram Reels or YouTube Shorts embed."""
    title = models.CharField(max_length=200, blank=True)
    embed_url = models.URLField(
        help_text=(
            "Instagram Reel URL (https://www.instagram.com/reel/...) "
            "or YouTube Shorts URL (https://youtube.com/shorts/...). "
            "Paste the public share URL — the storefront converts it to embeds."
        ),
    )
    thumbnail = models.ImageField(upload_to="reels/", blank=True, null=True)
    thumbnail_url = models.URLField(blank=True)
    creator_handle = models.CharField(max_length=120, blank=True,
                                       help_text="e.g. @priya.styles")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def thumb_src(self):
        if self.thumbnail:
            return self.thumbnail.url
        return self.thumbnail_url

    def __str__(self):
        return self.title or self.embed_url[:60]


class PopupReview(models.Model):
    """Short, punchy review shown via floating popup on collection/product pages."""
    user_name = models.CharField(max_length=120)
    photo = models.ImageField(upload_to="popup-reviews/", blank=True, null=True)
    photo_url = models.URLField(blank=True)
    rating = models.PositiveSmallIntegerField(default=5,
                                              help_text="1–5")
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    product_name = models.CharField(max_length=200, blank=True,
                                     help_text="Optional — what they bought.")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def src(self):
        if self.photo:
            return self.photo.url
        return self.photo_url

    def __str__(self):
        return f"{self.user_name} ({self.rating}★)"


class NewsletterSubscriber(models.Model):
    """Email captured from the storefront newsletter form."""
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email
