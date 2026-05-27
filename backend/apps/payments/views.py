"""Razorpay create-order, verify, and webhook endpoints."""
import hashlib
import hmac
import json

import razorpay
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.services import mark_order_paid, send_order_confirmation

from .models import PaymentEvent


def _client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateOrderSerializer(serializers.Serializer):
    public_id = serializers.UUIDField()


class VerifySerializer(serializers.Serializer):
    public_id = serializers.UUIDField()
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class CreatePaymentOrderView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT

    def post(self, request):
        ser = CreateOrderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            order = Order.objects.get(public_id=ser.validated_data["public_id"])
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)

        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            return Response({"detail": "Razorpay credentials not configured"}, status=500)

        amount_minor = int(order.grand_total * 100)
        rp_order = _client().order.create({
            "amount": amount_minor,
            "currency": order.currency,
            "receipt": order.display_id,
            "payment_capture": 1,
            "notes": {"order_id": str(order.public_id)},
        })
        order.razorpay_order_id = rp_order["id"]
        order.save(update_fields=["razorpay_order_id"])

        PaymentEvent.objects.create(
            order=order,
            event=PaymentEvent.EVENT_CREATED,
            razorpay_order_id=rp_order["id"],
            payload=rp_order,
        )

        return Response({
            "razorpay_order_id": rp_order["id"],
            "amount": amount_minor,
            "currency": order.currency,
            "key_id": settings.RAZORPAY_KEY_ID,
            "order_display_id": order.display_id,
        })


class VerifyPaymentView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT

    def post(self, request):
        ser = VerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            order = Order.objects.get(public_id=data["public_id"])
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)

        # Bind the payment to THIS order. Without this check, a genuine
        # signature from a cheap order could be replayed against an expensive
        # order's public_id to mark it paid.
        if not order.razorpay_order_id or \
                order.razorpay_order_id != data["razorpay_order_id"]:
            PaymentEvent.objects.create(
                order=order, event=PaymentEvent.EVENT_VERIFY_FAILED,
                razorpay_order_id=data["razorpay_order_id"],
                razorpay_payment_id=data["razorpay_payment_id"],
                payload=data,
            )
            return Response(
                {"detail": "Payment does not match this order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        body = f"{data['razorpay_order_id']}|{data['razorpay_payment_id']}".encode()
        expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, data["razorpay_signature"]):
            order.payment_status = Order.PAYMENT_FAILED
            order.save(update_fields=["payment_status"])
            PaymentEvent.objects.create(
                order=order, event=PaymentEvent.EVENT_VERIFY_FAILED,
                razorpay_order_id=data["razorpay_order_id"],
                razorpay_payment_id=data["razorpay_payment_id"],
                payload=data,
            )
            return Response({"detail": "Signature mismatch"}, status=status.HTTP_400_BAD_REQUEST)

        # Signature good and bound to this order — mark paid (idempotent).
        paid = mark_order_paid(order.pk, payment_id=data["razorpay_payment_id"])

        PaymentEvent.objects.create(
            order=order, event=PaymentEvent.EVENT_VERIFIED,
            razorpay_order_id=data["razorpay_order_id"],
            razorpay_payment_id=data["razorpay_payment_id"],
            payload=data,
        )

        if paid is not None:
            send_order_confirmation(paid)
        return Response({"status": "ok", "display_id": order.display_id})


@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(APIView):
    """Razorpay webhook receiver."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "") or ""
        signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
        body = request.body
        # Fail closed: an unconfigured webhook secret means we cannot trust
        # anything that arrives here.
        if not secret:
            return Response(
                {"detail": "Webhook secret not configured"}, status=503,
            )
        expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return Response({"detail": "Bad signature"}, status=400)

        try:
            payload = json.loads(body.decode())
        except json.JSONDecodeError:
            return Response({"detail": "Invalid JSON"}, status=400)

        event_name = payload.get("event", "")
        entity = (
            payload.get("payload", {}).get("payment", {}).get("entity")
            or payload.get("payload", {}).get("refund", {}).get("entity")
            or {}
        )
        rp_order_id = entity.get("order_id", "")
        rp_payment_id = entity.get("id", "") if event_name.startswith("payment") else ""

        order = Order.objects.filter(razorpay_order_id=rp_order_id).first()

        if event_name == "payment.captured":
            if order:
                paid = mark_order_paid(order.pk, payment_id=rp_payment_id)
                if paid is not None:
                    send_order_confirmation(paid)
            event = PaymentEvent.EVENT_WEBHOOK_PAID
        elif event_name == "payment.failed":
            # Never let a late "failed" event undo a successful payment.
            if order and order.payment_status != Order.PAYMENT_PAID:
                order.payment_status = Order.PAYMENT_FAILED
                order.save(update_fields=["payment_status"])
            event = PaymentEvent.EVENT_WEBHOOK_FAILED
        elif event_name.startswith("refund"):
            if order:
                order.payment_status = Order.PAYMENT_REFUNDED
                order.save(update_fields=["payment_status"])
            event = PaymentEvent.EVENT_WEBHOOK_REFUND
        else:
            event = event_name or "unknown"

        PaymentEvent.objects.create(
            order=order, event=event,
            razorpay_order_id=rp_order_id, razorpay_payment_id=rp_payment_id,
            payload=payload,
        )

        return Response({"status": "ok"})
