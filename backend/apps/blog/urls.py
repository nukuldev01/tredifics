from django.urls import path

from . import views

urlpatterns = [
    path("posts/", views.BlogPostListView.as_view(), name="blog-list"),
    path("posts/<slug:slug>/", views.BlogPostDetailView.as_view(), name="blog-detail"),
]
