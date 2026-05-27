from django.db import models


class ShippingRate(models.Model):
    METHOD_STANDARD = "standard"
    METHOD_EXPRESS = "express"
    METHOD_CHOICES = [
        (METHOD_STANDARD, "Standard"),
        (METHOD_EXPRESS, "Express"),
    ]

    country = models.CharField(max_length=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    estimated_days_min = models.PositiveIntegerField(default=4)
    estimated_days_max = models.PositiveIntegerField(default=10)
    free_above = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Free shipping when order subtotal exceeds this value (same currency).",
    )

    class Meta:
        unique_together = [("country", "method")]
        ordering = ["country", "method"]

    def __str__(self):
        return f"{self.country} / {self.get_method_display()} — {self.currency} {self.price}"
