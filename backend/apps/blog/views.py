from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostListSerializer


class BlogPostListView(generics.ListAPIView):
    queryset = (
        BlogPost.objects.filter(status=BlogPost.STATUS_PUBLISHED)
        .select_related("category", "author")
    )
    serializer_class = BlogPostListSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT


class BlogPostDetailView(generics.RetrieveAPIView):
    queryset = BlogPost.objects.filter(status=BlogPost.STATUS_PUBLISHED)
    serializer_class = BlogPostDetailSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
