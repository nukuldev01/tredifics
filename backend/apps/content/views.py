from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Banner, HomepageSection, NewsletterSubscriber, PopupReview, Reel,
    StaticPage, Testimonial,
)
from .serializers import (
    BannerSerializer,
    HomepageSectionSerializer,
    NewsletterSubscriberSerializer,
    PopupReviewSerializer,
    ReelSerializer,
    StaticPageSerializer,
    TestimonialSerializer,
)


class StaticPageDetailView(generics.RetrieveAPIView):
    queryset = StaticPage.objects.filter(is_published=True)
    serializer_class = StaticPageSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT


class HomepageSectionListView(generics.ListAPIView):
    queryset = HomepageSection.objects.filter(is_active=True)
    serializer_class = HomepageSectionSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
    pagination_class = None


class TestimonialListView(generics.ListAPIView):
    queryset = Testimonial.objects.filter(is_active=True)
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
    pagination_class = None


class BannerListView(generics.ListAPIView):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
    pagination_class = None


class ReelListView(generics.ListAPIView):
    queryset = Reel.objects.filter(is_active=True)
    serializer_class = ReelSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
    pagination_class = None


class PopupReviewListView(generics.ListAPIView):
    queryset = PopupReview.objects.filter(is_active=True)
    serializer_class = PopupReviewSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
    pagination_class = None


@method_decorator(
    ratelimit(key="ip", rate="20/h", method="POST", block=True), name="post"
)
class NewsletterSubscribeView(APIView):
    """Capture an email address from the storefront newsletter form."""
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT

    def post(self, request):
        ser = NewsletterSubscriberSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        existing = NewsletterSubscriber.objects.filter(email__iexact=email).first()
        if existing:
            if not existing.is_active:
                existing.is_active = True
                existing.save(update_fields=["is_active"])
        else:
            NewsletterSubscriber.objects.create(email=email)
        return Response({"detail": "Subscribed"}, status=status.HTTP_201_CREATED)
