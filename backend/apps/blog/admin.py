from django.contrib import admin
from django.utils.html import format_html

from .models import BlogCategory, BlogPost


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("preview", "title", "category", "status", "published_at",
                    "reading_minutes", "updated_at")
    list_filter = ("status", "category")
    list_editable = ("status",)
    search_fields = ("title", "excerpt", "body", "focus_keyword")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Content", {
            "fields": ("title", "slug", "category", "excerpt", "body",
                       "cover_image", "cover_image_url", "cover_alt"),
        }),
        ("Authoring", {
            "fields": ("author", "author_name", "status", "published_at"),
        }),
        ("SEO", {
            "fields": ("focus_keyword", "meta_title", "meta_description"),
            "classes": ("collapse",),
        }),
        ("Audit", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def preview(self, obj):
        url = obj.cover_src()
        if url:
            return format_html(
                '<img src="{}" style="height:40px;border-radius:4px;" />', url
            )
        return "—"
