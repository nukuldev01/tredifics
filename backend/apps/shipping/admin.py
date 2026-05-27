from django.contrib import admin

from .models import ShippingRate


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ("country", "method", "price", "currency",
                    "estimated_days_min", "estimated_days_max", "free_above")
    list_filter = ("country", "method")
    search_fields = ("country",)
