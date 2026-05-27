from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "variant", "name", "sku", "size", "color",
                       "unit_price", "quantity", "image_url")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "email", "shipping_country", "status", "payment_status",
        "grand_total", "currency", "created_at",
    )
    list_filter = ("status", "payment_status", "shipping_country", "shipping_method")
    search_fields = ("email", "phone", "razorpay_order_id", "razorpay_payment_id")
    readonly_fields = (
        "public_id", "razorpay_order_id", "razorpay_payment_id",
        "subtotal", "shipping_total", "tax_total", "discount_total", "grand_total",
        "shipping_address", "billing_address",
        "created_at", "updated_at",
    )
    inlines = [OrderItemInline]
    actions = ["mark_confirmed", "mark_shipped", "mark_delivered", "mark_cancelled"]

    fieldsets = (
        ("Status", {
            "fields": ("status", "payment_status", "notes"),
        }),
        ("Customer", {
            "fields": ("user", "email", "phone"),
        }),
        ("Addresses", {
            "fields": ("shipping_address", "billing_address",
                       "shipping_country", "shipping_method"),
        }),
        ("Totals", {
            "fields": ("currency", "subtotal", "shipping_total",
                       "tax_total", "discount_total", "grand_total"),
        }),
        ("Payment", {
            "fields": ("razorpay_order_id", "razorpay_payment_id"),
            "classes": ("collapse",),
        }),
        ("Audit", {
            "fields": ("public_id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def _bulk_status(self, request, queryset, status, label):
        updated = queryset.update(status=status)
        self.message_user(request, f"{updated} order(s) marked {label}.")

    def mark_confirmed(self, request, qs):
        self._bulk_status(request, qs, Order.STATUS_CONFIRMED, "confirmed")
    mark_confirmed.short_description = "Mark selected orders as Confirmed"

    def mark_shipped(self, request, qs):
        self._bulk_status(request, qs, Order.STATUS_SHIPPED, "shipped")
    mark_shipped.short_description = "Mark selected orders as Shipped"

    def mark_delivered(self, request, qs):
        self._bulk_status(request, qs, Order.STATUS_DELIVERED, "delivered")
    mark_delivered.short_description = "Mark selected orders as Delivered"

    def mark_cancelled(self, request, qs):
        self._bulk_status(request, qs, Order.STATUS_CANCELLED, "cancelled")
    mark_cancelled.short_description = "Mark selected orders as Cancelled"
