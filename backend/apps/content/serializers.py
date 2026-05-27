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
    provider = serializers.SerializerMethodField()
    embed_iframe_src = serializers.SerializerMethodField()

    class Meta:
        model = Reel
        fields = (
            "id", "title", "creator_handle", "embed_url",
            "thumb_src", "provider", "embed_iframe_src", "sort_order",
        )

    def get_thumb_src(self, obj):
        return _absolutize(obj.thumb_src(), self.context.get("request"))

    def get_provider(self, obj):
        url = obj.embed_url.lower()
        if "instagram.com" in url:
            return "instagram"
        if "youtube.com" in url or "youtu.be" in url:
            return "youtube"
        return "other"

    def get_embed_iframe_src(self, obj):
        url = obj.embed_url
        if "instagram.com" in url:
            # Strip query string (e.g. ?igsh=...) before appending /embed/
            # otherwise the path becomes /reel/<id>/?...==/embed/ which Instagram
            # serves as the regular page with X-Frame-Options: DENY.
            base = url.split("?")[0].rstrip("/")
            return base + "/embed/"
        if "youtube.com/shorts/" in url:
            slug = url.split("/shorts/")[-1].split("?")[0].strip("/")
            return f"https://www.youtube.com/embed/{slug}"
        if "youtube.com/watch" in url:
            qs = url.split("v=")[-1].split("&")[0]
            return f"https://www.youtube.com/embed/{qs}"
        if "youtu.be/" in url:
            slug = url.split("youtu.be/")[-1].split("?")[0]
            return f"https://www.youtube.com/embed/{slug}"
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
