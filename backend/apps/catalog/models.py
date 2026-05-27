from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.text import slugify

SIZE_CHOICES = [
    ("XS", "XS"), ("S", "S"), ("M", "M"), ("L", "L"), ("XL", "XL"),
    ("XXL", "XXL"), ("3XL", "3XL"), ("4XL", "4XL"), ("5XL", "5XL"),
    ("6XL", "6XL"), ("7XL", "7XL"), ("FREE", "Free Size"),
]


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="children",
    )
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    image_alt = models.CharField(max_length=200, blank=True)
    short_description = models.CharField(max_length=200, blank=True)
    long_description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Color(models.Model):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(max_length=7, default="#000000")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_PUBLISHED = "published"
    STATUS_DRAFT = "draft"
    STATUS_CHOICES = [(STATUS_PUBLISHED, "Published"), (STATUS_DRAFT, "Draft")]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    sku = models.CharField(max_length=40, unique=True)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products",
    )
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(max_length=3, default="INR")

    fabric = models.CharField(max_length=80, blank=True)
    occasion = models.CharField(max_length=80, blank=True)
    care_instructions = models.CharField(max_length=200, blank=True)
    country_of_origin = models.CharField(max_length=80, default="India")

    in_stock = models.BooleanField(default=True)
    cod_available = models.BooleanField(
        default=True, help_text="Cash on delivery available for this product."
    )

    is_featured = models.BooleanField(default=False)
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default=STATUS_PUBLISHED
    )

    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["sku"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:220]
        if not self.sku:
            self.sku = "TMP"
        super().save(*args, **kwargs)
        if self.sku == "TMP":
            self.sku = f"TRD-{self.category.slug.upper()[:4]}-{self.pk:05d}"
            super().save(update_fields=["sku"])

    @property
    def effective_price(self):
        return self.sale_price if self.sale_price else self.price

    @property
    def discount_percent(self):
        if self.sale_price and self.price > 0:
            return int(round((self.price - self.sale_price) / self.price * 100))
        return 0

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    image_url = models.URLField(blank=True)
    alt = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "id"]

    def src(self):
        if self.image:
            return self.image.url
        return self.image_url


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size = models.CharField(max_length=8, choices=SIZE_CHOICES)
    color = models.ForeignKey(Color, on_delete=models.PROTECT, related_name="variants")
    sku = models.CharField(max_length=60, unique=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    price_override = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    class Meta:
        unique_together = [("product", "size", "color")]
        ordering = ["product", "color", "size"]

    def save(self, *args, **kwargs):
        if not self.sku:
            super().save(*args, **kwargs)
            self.sku = f"{self.product.sku}-{self.color.name[:3].upper()}-{self.size}"
            super().save(update_fields=["sku"])
        else:
            super().save(*args, **kwargs)

    @property
    def effective_price(self):
        return self.price_override or self.product.effective_price

    def __str__(self):
        return f"{self.product.name} / {self.color.name} / {self.size}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
    )
    name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ {self.title or ''}"


class ReviewMedia(models.Model):
    """Photos / short videos attached to a review."""
    MEDIA_IMAGE = "image"
    MEDIA_VIDEO = "video"
    MEDIA_CHOICES = [(MEDIA_IMAGE, "Image"), (MEDIA_VIDEO, "Video")]

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="media")
    kind = models.CharField(max_length=10, choices=MEDIA_CHOICES, default=MEDIA_IMAGE)
    file = models.FileField(upload_to="reviews/")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def src(self):
        return self.file.url if self.file else ""


class ProductFAQ(models.Model):
    """Per-product FAQ items, admin-editable, surfaced on PDP."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="faqs")
    question = models.CharField(max_length=300)
    answer = models.TextField()
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.name}: {self.question[:60]}"


class ProductShowcase(models.Model):
    """'In real life' / styling lookbook images per product."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="showcase")
    image = models.ImageField(upload_to="showcase/", blank=True, null=True)
    image_url = models.URLField(blank=True)
    caption = models.CharField(max_length=200, blank=True)
    alt = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def src(self):
        return self.image.url if self.image else self.image_url

    def __str__(self):
        return f"{self.product.name} showcase #{self.id}"


class Wishlist(models.Model):
    """One row per (user, product). Persisted server-side."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist",
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "product")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} ❤ {self.product}"
