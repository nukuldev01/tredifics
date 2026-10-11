from rest_framework import serializers

from .models import (
    Banner, HomepageSection, PopupReview, Reel, StaticPage, Testimonial,
)


def _absolutize(url, request):
    """Turn a Django media path like '/media/foo.jpg' into an absolute URL
    using the current request host. Pass URLs that already start with http(s)
    through unchanged. Empty / None returns ''."""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class StaticPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaticPage
        fields = ("title", "slug", "body", "meta_title",
                  "meta_description", "updated_at")


class HomepageSectionSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()

    class Meta:
        model = HomepageSection
        fields = ("id", "kind", "sort_order", "heading", "subheading",
                  "src", "image_alt", "cta_label", "cta_url")

    def get_src(self, obj):
        return _absolutize(obj.src(), self.context.get("request"))


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ("id", "name", "rating", "body", "location")


class BannerSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()
    mobile_src = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = (
            "id", "kind", "eyebrow", "headline", "subheadline",
            "src", "mobile_src", "image_alt",
            "cta_label", "cta_url", "cta_secondary_label", "cta_secondary_url",
            "overlay_opacity", "sort_order",
        )

    def get_src(self, obj):
        return _absolutize(obj.src(), self.context.get("request"))

    def get_mobile_src(self, obj):
        return _absolutize(obj.mobile_src(), self.context.get("request"))


class ReelSerializer(serializers.ModelSerializer):
    thumb_src = serializers.SerializerMethodField()
    video_src = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()
    embed_iframe_src = serializers.SerializerMethodField()

    class Meta:
        model = Reel
        fields = (
            "id", "title", "creator_handle", "embed_url",
            "video_src", "thumb_src", "provider", "embed_iframe_src", "sort_order",
        )

    def get_thumb_src(self, obj):
        return _absolutize(obj.thumb_src(), self.context.get("request"))

    def get_video_src(self, obj):
        if getattr(obj, "video_file", None):
            return _absolutize(obj.video_file.url, self.context.get("request"))
        url = (obj.embed_url or "").strip().lower()
        if url.endswith(".mp4") or url.endswith(".webm") or url.endswith(".mov"):
            return obj.embed_url
        return ""

    def get_provider(self, obj):
        if getattr(obj, "video_file", None):
            return "direct"
        url = (obj.embed_url or "").strip().lower()
        if url.endswith(".mp4") or url.endswith(".webm") or url.endswith(".mov"):
            return "direct"
        if "instagram.com" in url:
            return "instagram"
        if "youtube.com" in url or "youtu.be" in url:
            return "youtube"
        return "other"

    def get_embed_iframe_src(self, obj):
        if getattr(obj, "video_file", None):
            return ""
        url = (obj.embed_url or "").strip()
        if not url:
            return ""
        url_lower = url.lower()
        if url_lower.endswith(".mp4") or url_lower.endswith(".webm") or url_lower.endswith(".mov"):
            return ""

        # Instagram Reels or Posts
        if "instagram.com" in url_lower:
            import re
            # Extract shortcode from /reel/CODE, /reels/CODE, /p/CODE, or /share/reel/CODE
            m = re.search(r"instagram\.com/(?:reel|reels|p|share/reel)/([A-Za-z0-9_-]+)", url)
            if m:
                code = m.group(1)
                return f"https://www.instagram.com/reel/{code}/embed/"
            base = url.split("?")[0].rstrip("/")
            return base + "/embed/"

        # YouTube Shorts or Videos
        if "youtube.com/shorts/" in url_lower:
            slug = url.split("/shorts/")[-1].split("?")[0].strip("/")
            return f"https://www.youtube.com/embed/{slug}?autoplay=1"
        if "youtube.com/watch" in url_lower:
            qs = url.split("v=")[-1].split("&")[0]
            return f"https://www.youtube.com/embed/{qs}?autoplay=1"
        if "youtu.be/" in url_lower:
            slug = url.split("youtu.be/")[-1].split("?")[0].strip("/")
            return f"https://www.youtube.com/embed/{slug}?autoplay=1"
        return url


class PopupReviewSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()

    class Meta:
        model = PopupReview
        fields = (
            "id", "user_name", "src", "rating", "title", "comment",
            "product_name", "created_at",
        )

    def get_src(self, obj):
        return _absolutize(obj.src(), self.context.get("request"))


class NewsletterSubscriberSerializer(serializers.Serializer):
    email = serializers.EmailField()
