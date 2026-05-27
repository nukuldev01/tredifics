from django.db import models

from apps.orders.models import Order


class PaymentEvent(models.Model):
    """Audit log of every payment-related event we receive from Razorpay."""

    EVENT_CREATED = "order.created"
    EVENT_VERIFIED = "payment.verified"
    EVENT_WEBHOOK_PAID = "webhook.paid"
    EVENT_WEBHOOK_FAILED = "webhook.failed"
    EVENT_WEBHOOK_REFUND = "webhook.refunded"
    EVENT_VERIFY_FAILED = "verify.signature_failed"

    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_events",
    )
    event = models.CharField(max_length=64)
    razorpay_order_id = models.CharField(max_length=64, blank=True)
    razorpay_payment_id = models.CharField(max_length=64, blank=True)
    payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["razorpay_order_id"]),
            models.Index(fields=["razorpay_payment_id"]),
        ]

    def __str__(self):
        return f"{self.event} @ {self.created_at:%Y-%m-%d %H:%M}"
