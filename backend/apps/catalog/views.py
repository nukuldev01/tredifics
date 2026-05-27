from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .filters import ProductFilter
from .models import (
    Category, Color, Product, Review, ReviewMedia, Wishlist,
)
from .serializers import (
    CategorySerializer,
    ColorSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewSerializer,
    WishlistSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"
    authentication_classes = []  # public endpoint — ignore any stale JWT


class ColorListView(generics.ListAPIView):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    pagination_class = None
    authentication_classes = []  # public endpoint — ignore any stale JWT


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Product.objects.filter(status=Product.STATUS_PUBLISHED)
        .select_related("category")
        .prefetch_related("images", "variants__color", "reviews",
                          "faqs", "showcase")
    )
    lookup_field = "slug"
    authentication_classes = []  # public endpoint — ignore any stale JWT
    filterset_class = ProductFilter
    search_fields = ("name", "description", "sku")
    ordering_fields = ("price", "created_at", "name")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @action(detail=False, methods=["get"], url_path="facets")
    def facets(self, request):
        qs = self.filter_queryset(self.get_queryset())
        colors = sorted(set(
            qs.values_list("variants__color__name", flat=True)
            .exclude(variants__color__name__isnull=True)
        ))
        sizes = sorted(set(
            qs.values_list("variants__size", flat=True)
            .exclude(variants__size__isnull=True)
        ))
        prices = [float(p) for p in qs.values_list("price", flat=True) if p is not None]
        return Response({
            "colors": [c for c in colors if c],
            "sizes": [s for s in sizes if s],
            "min_price": min(prices) if prices else 0,
            "max_price": max(prices) if prices else 0,
            "count": qs.count(),
        })

    @action(detail=True, methods=["get"], url_path="related")
    def related(self, request, slug=None):
        """Return up to 8 related products in the same category, excluding self."""
        product = self.get_object()
        qs = (
            Product.objects.filter(
                status=Product.STATUS_PUBLISHED, category=product.category,
            )
            .exclude(pk=product.pk)
            .prefetch_related("images", "variants__color")[:8]
        )
        return Response(ProductListSerializer(qs, many=True).data)


@method_decorator(
    ratelimit(key="ip", rate="10/h", method="POST", block=True), name="post"
)
class ReviewCreateView(generics.CreateAPIView):
    """Create a review, optionally with media files attached.

    Accepts both application/json and multipart/form-data. For the latter,
    attach files in the `media` field (can repeat).
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        review = ser.save(user=user)

        # Attach uploaded media files (if any)
        files = request.FILES.getlist("media")
        for i, f in enumerate(files):
            kind = ReviewMedia.MEDIA_VIDEO if str(f.content_type or "").startswith("video") \
                   else ReviewMedia.MEDIA_IMAGE
            ReviewMedia.objects.create(
                review=review, kind=kind, file=f, sort_order=i,
            )

        return Response(
            ReviewSerializer(review).data, status=status.HTTP_201_CREATED,
        )


class WishlistViewSet(viewsets.ModelViewSet):
    """Per-user wishlist. GET /api/wishlist/ + POST + DELETE /api/wishlist/<id>/."""
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Wishlist.objects.filter(user=self.request.user)
            .select_related("product")
            .prefetch_related("product__images", "product__variants__color")
        )

    def perform_create(self, serializer):
        product = serializer.validated_data["product"]
        obj, _ = Wishlist.objects.get_or_create(
            user=self.request.user, product=product,
        )
        serializer.instance = obj

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        """Toggle a product in/out of the wishlist by product id."""
        product_id = request.data.get("product_id") or request.data.get("product")
        if not product_id:
            return Response(
                {"detail": "product_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found"}, status=404)
        existing = Wishlist.objects.filter(
            user=request.user, product=product,
        ).first()
        if existing:
            existing.delete()
            return Response({"wishlisted": False})
        Wishlist.objects.create(user=request.user, product=product)
        return Response({"wishlisted": True})
