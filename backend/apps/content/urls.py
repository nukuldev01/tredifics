from django.urls import path
from . import views

urlpatterns = [
    path("pages/<slug:slug>/", views.StaticPageDetailView.as_view(), name="static-page"),
    path("homepage/", views.HomepageSectionListView.as_view(), name="homepage-sections"),
    path("testimonials/", views.TestimonialListView.as_view(), name="testimonials"),
    path("banners/", views.BannerListView.as_view(), name="banners"),
    path("reels/", views.ReelListView.as_view(), name="reels"),
    path("popup-reviews/", views.PopupReviewListView.as_view(), name="popup-reviews"),
    path("newsletter/", views.NewsletterSubscribeView.as_view(), name="newsletter"),
]
