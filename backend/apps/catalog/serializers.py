from rest_framework import serializers

from .models import (
    Category, Color, Product, ProductFAQ, ProductImage, ProductShowcase,
    ProductVariant, Review, ReviewMedia, Wishlist,
)


def _absolutize(url, request):
    """Convert relative /media/ paths to absolute URLs using request host.
    Already-absolute URLs and empty strings pass through unchanged."""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id", "name", "slug", "parent", "image_url", "image_alt",
            "short_description", "long_description", "sort_order",
            "meta_title", "meta_description",
        )

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            return _absolutize(obj.image.url, request)
        # Fall back to first product image
        first_product = (
            obj.products.filter(status="published")
            .prefetch_related("images").first()
        )
        if first_product:
            first_image = first_product.images.first()
            if first_image:
                return _absolutize(first_image.src(), request)
        return ""


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ("id", "name", "hex_code")


class ProductImageSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "src", "alt", "sort_order", "is_primary")

    def get_src(self, obj):
        return _absolutize(obj.src(), self.context.get("request"))


class ProductVariantSerializer(serializers.ModelSerializer):
    color = ColorSerializer(read_only=True)
    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(), write_only=True, source="color"
    )
    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = ProductVariant
        fields = (
            "id", "size", "color", "color_id", "sku",
            "stock", "price_override", "effective_price",
        )


class ReviewMediaSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()

    class Meta:
        model = ReviewMedia
        fields = ("id", "kind", "src", "sort_order")

    def get_src(self, obj):
        return _absolutize(obj.src(), self.context.get("request"))


class ReviewSerializer(serializers.ModelSerializer):
    media = ReviewMediaSerializer(many=True, read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = ("id", "product", "name", "rating", "title", "body",
                  "media", "created_at")
        read_only_fields = ("created_at",)


class ProductFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFAQ
        fields = ("id", "question", "answer", "sort_order")


class ProductShowcaseSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()

    class Meta:
        model = ProductShowcase
        fields = ("id", "src", "caption", "alt", "sort_order")

    def get_src(self, obj):
        return _absolutize(obj.src(), self.context.get("request"))


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    colors = serializers.SerializerMethodField()
    sizes = serializers.SerializerMethodField()
    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "sku", "category", "short_description",
            "price", "sale_price", "effective_price", "discount_percent",
            "currency", "is_featured", "in_stock", "cod_available",
            "images", "colors", "sizes",
        )

    def get_colors(self, obj):
        return sorted(set(obj.variants.values_list("color__name", flat=True)))

    def get_sizes(self, obj):
        return sorted(set(obj.variants.values_list("size", flat=True)))


class ProductDetailSerializer(ProductListSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    faqs = ProductFAQSerializer(many=True, read_only=True)
    showcase = ProductShowcaseSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description", "fabric", "occasion", "care_instructions",
            "country_of_origin", "variants", "reviews",
            "average_rating", "review_count", "faqs", "showcase",
            "meta_title", "meta_description",
        )

    def get_reviews(self, obj):
        approved = obj.reviews.filter(is_approved=True).prefetch_related("media")
        return ReviewSerializer(approved, many=True, context=self.context).data

    def get_average_rating(self, obj):
        ratings = list(obj.reviews.filter(is_approved=True).values_list("rating", flat=True))
        if not ratings:
            return 0
        return round(sum(ratings) / len(ratings), 1)

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True, source="product",
    )

    class Meta:
        model = Wishlist
        fields = ("id", "product", "product_id", "created_at")
        read_only_fields = ("id", "created_at")
