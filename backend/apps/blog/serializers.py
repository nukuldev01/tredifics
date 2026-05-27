from rest_framework import serializers

from .models import BlogCategory, BlogPost


def _absolutize(url, request):
    """Turn a relative /media/ path into an absolute URL using the request
    host. Already-absolute and empty values pass through unchanged."""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ("id", "name", "slug")


class BlogPostListSerializer(serializers.ModelSerializer):
    cover_src = serializers.SerializerMethodField()
    category = BlogCategorySerializer(read_only=True)
    author_display = serializers.SerializerMethodField()
    reading_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogPost
        fields = (
            "id", "title", "slug", "excerpt", "cover_src", "cover_alt",
            "category", "author_display", "reading_minutes",
            "published_at",
        )

    def get_cover_src(self, obj):
        return _absolutize(obj.cover_src(), self.context.get("request"))

    def get_author_display(self, obj):
        if obj.author_name:
            return obj.author_name
        if obj.author:
            return (obj.author.get_full_name() or obj.author.email)
        return "Tredific Editorial"


class BlogPostDetailSerializer(BlogPostListSerializer):
    related = serializers.SerializerMethodField()

    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + (
            "body", "meta_title", "meta_description", "focus_keyword",
            "related",
        )

    def get_related(self, obj):
        qs = (
            BlogPost.objects.filter(status=BlogPost.STATUS_PUBLISHED)
            .exclude(pk=obj.pk)
        )
        if obj.category:
            qs = qs.filter(category=obj.category)
        return BlogPostListSerializer(qs[:3], many=True, context=self.context).data
