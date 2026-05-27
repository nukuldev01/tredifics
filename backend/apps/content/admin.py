from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Banner, HomepageSection, NewsletterSubscriber, PopupReview, Reel,
    StaticPage, Testimonial,
)


@admin.register(StaticPage)
class StaticPageAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "updated_at")
    list_filter = ("is_published",)
    search_fields = ("title", "body")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(HomepageSection)
class HomepageSectionAdmin(admin.ModelAdmin):
    list_display = ("kind", "heading", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("kind", "is_active")


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "rating", "location", "is_active", "sort_order")
    list_editable = ("rating", "is_active", "sort_order")


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("preview", "kind", "headline", "sort_order", "is_active",
                    "updated_at")
    list_editable = ("sort_order", "is_active")
    list_filter = ("kind", "is_active")
    search_fields = ("headline", "subheadline")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Slide", {
            "fields": ("kind", "eyebrow", "headline", "subheadline",
                       "sort_order", "is_active", "overlay_opacity"),
        }),
        ("Imagery", {
            "fields": ("image", "mobile_image", "image_url", "image_alt"),
        }),
        ("Call to action", {
            "fields": ("cta_label", "cta_url",
                       "cta_secondary_label", "cta_secondary_url"),
        }),
        ("Audit", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def preview(self, obj):
        url = obj.src()
        if url:
            return format_html(
                '<img src="{}" style="height:40px;border-radius:4px;" />', url
            )
        return "—"


@admin.register(Reel)
class ReelAdmin(admin.ModelAdmin):
    list_display = ("thumb", "title", "creator_handle", "embed_url",
                    "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("title", "embed_url", "creator_handle")

    def thumb(self, obj):
        url = obj.thumb_src()
        if url:
            return format_html(
                '<img src="{}" style="height:48px;width:32px;'
                'object-fit:cover;border-radius:4px;" />', url
            )
        return "—"


@admin.register(PopupReview)
class PopupReviewAdmin(admin.ModelAdmin):
    list_display = ("avatar", "user_name", "rating", "title",
                    "product_name", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("rating", "is_active")
    search_fields = ("user_name", "title", "comment", "product_name")

    def avatar(self, obj):
        url = obj.src()
        if url:
            return format_html(
                '<img src="{}" style="height:32px;width:32px;'
                'object-fit:cover;border-radius:50%;" />', url
            )
        return "—"


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("email",)
    readonly_fields = ("created_at",)
