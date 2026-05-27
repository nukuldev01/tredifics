from decimal import Decimal

from django.conf import settings
from rest_framework import serializers

from apps.catalog.models import ProductVariant

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id", "product", "variant", "name", "sku", "size", "color",
            "image_url", "unit_price", "quantity", "line_total",
        )
        read_only_fields = fields


class OrderItemInputSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    """Input payload to create an order."""

    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    items = OrderItemInputSerializer(many=True)
    shipping_address = serializers.DictField()
    billing_address = serializers.DictField(required=False)
    shipping_country = serializers.ChoiceField(
        choices=[code for code, _ in settings.SUPPORTED_COUNTRIES]
    )
    shipping_method = serializers.ChoiceField(choices=["standard", "express"])
    currency = serializers.ChoiceField(
        choices=sorted(set(settings.CURRENCY_BY_COUNTRY.values())), default="INR"
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    display_id = serializers.CharField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "display_id", "public_id", "email", "phone",
            "shipping_address", "billing_address",
            "currency", "subtotal", "shipping_total", "tax_total",
            "discount_total", "grand_total",
            "shipping_country", "shipping_method",
            "status", "payment_status",
            "razorpay_order_id", "razorpay_payment_id",
            "items", "notes", "created_at", "updated_at",
        )
        read_only_fields = fields
