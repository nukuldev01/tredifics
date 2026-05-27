from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"wishlist", views.WishlistViewSet, basename="wishlist")

urlpatterns = [
    path("", include(router.urls)),
    path("colors/", views.ColorListView.as_view(), name="colors"),
    path("reviews/", views.ReviewCreateView.as_view(), name="review-create"),
]
