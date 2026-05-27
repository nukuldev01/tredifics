from django.contrib import admin

from .models import (
    Category, Color, Product, ProductFAQ, ProductImage, ProductShowcase,
    ProductVariant, Review, ReviewMedia, Wishlist,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "image_url", "alt", "sort_order", "is_primary")


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ("size", "color", "stock", "price_override", "sku")
    readonly_fields = ("sku",)


class ProductFAQInline(admin.TabularInline):
    model = ProductFAQ
    extra = 1
    fields = ("question", "answer", "sort_order", "is_active")


class ProductShowcaseInline(admin.TabularInline):
    model = ProductShowcase
    extra = 1
    fields = ("image", "image_url", "caption", "alt", "sort_order", "is_active")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ("name", "hex_code")
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "sku", "category", "price", "sale_price",
        "status", "is_featured", "in_stock", "cod_available", "updated_at",
    )
    list_filter = ("status", "is_featured", "category", "in_stock", "cod_available")
    search_fields = ("name", "sku", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("sku", "created_at", "updated_at")
    inlines = [
        ProductImageInline, ProductVariantInline,
        ProductFAQInline, ProductShowcaseInline,
    ]
    fieldsets = (
        ("Basics", {
            "fields": ("name", "slug", "sku", "category", "status",
                       "is_featured", "cod_available"),
        }),
        ("Description", {"fields": ("short_description", "description")}),
        ("Pricing", {"fields": ("price", "sale_price", "currency")}),
        ("Attributes", {
            "fields": ("fabric", "occasion", "care_instructions",
                       "country_of_origin", "in_stock"),
        }),
        ("SEO", {
            "fields": ("meta_title", "meta_description"),
            "classes": ("collapse",),
        }),
        ("Audit", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


class ReviewMediaInline(admin.TabularInline):
    model = ReviewMedia
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "name", "rating", "is_approved", "created_at")
    list_filter = ("rating", "is_approved")
    search_fields = ("product__name", "name", "body")
    inlines = [ReviewMediaInline]
    actions = ["approve_reviews", "reject_reviews"]

    def approve_reviews(self, request, qs):
        n = qs.update(is_approved=True)
        self.message_user(request, f"{n} reviews approved.")
    approve_reviews.short_description = "Approve selected reviews"

    def reject_reviews(self, request, qs):
        n = qs.update(is_approved=False)
        self.message_user(request, f"{n} reviews rejected.")
    reject_reviews.short_description = "Reject selected reviews"


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "created_at")
    search_fields = ("user__email", "product__name")
    readonly_fields = ("user", "product", "created_at")
