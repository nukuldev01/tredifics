from django.contrib import admin

from .models import PaymentEvent


@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
    list_display = ("event", "order", "razorpay_order_id",
                    "razorpay_payment_id", "created_at")
    list_filter = ("event",)
    search_fields = ("razorpay_order_id", "razorpay_payment_id", "order__email")
    readonly_fields = ("event", "order", "razorpay_order_id",
                       "razorpay_payment_id", "payload", "created_at")
