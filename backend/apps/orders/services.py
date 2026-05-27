"""Order creation logic — turn cart input into a saved Order."""
import logging
from decimal import Decimal

from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F
from django.db.models.functions import Greatest

from apps.catalog.models import ProductVariant
from apps.shipping.models import ShippingRate

from .models import Order, OrderItem

logger = logging.getLogger("apps.orders")


@transaction.atomic
def create_order_from_payload(payload: dict, user=None) -> Order:
    items_input = payload["items"]
    if not items_input:
        raise ValueError("Cart is empty")

    variant_ids = [i["variant_id"] for i in items_input]
    variants = {
        v.id: v for v in
        ProductVariant.objects.select_related("product", "color").filter(id__in=variant_ids)
    }

    subtotal = Decimal("0")
    line_rows = []
    for inp in items_input:
        v = variants.get(inp["variant_id"])
        if not v:
            raise ValueError(f"Unknown variant {inp['variant_id']}")
        qty = inp["quantity"]
        if qty < 1:
            raise ValueError("Quantity must be at least 1.")
        # Block ordering more than we can ship.
        if v.stock < qty:
            raise ValueError(
                f"Only {v.stock} left of {v.product.name} "
                f"({v.color.name} / {v.size})."
            )
        price = v.effective_price
        subtotal += price * qty
        first_image = v.product.images.first()
        line_rows.append({
            "variant": v,
            "name": v.product.name,
            "sku": v.sku,
            "size": v.size,
            "color": v.color.name,
            "unit_price": price,
            "quantity": qty,
            "image_url": (first_image.src() if first_image else ""),
        })

    country = payload["shipping_country"].upper()
    method = payload["shipping_method"]
    currency = payload.get("currency", "INR")

    rate = (
        ShippingRate.objects.filter(country=country, method=method)
        .order_by("-id")
        .first()
    )
    # Apply the "free shipping above X" rule server-side so the amount charged
    # always matches the total shown to the customer at checkout.
    if rate is None:
        raise ValueError(
            f"Shipping to {country} isn't available right now. "
            "Please contact us to complete this order."
        )
    if rate.free_above is not None and subtotal >= rate.free_above:
        shipping_total = Decimal("0")
    else:
        shipping_total = rate.price

    grand_total = subtotal + shipping_total

    order = Order.objects.create(
        user=user,
        email=payload["email"],
        phone=payload.get("phone", ""),
        shipping_address=payload["shipping_address"],
        billing_address=payload.get("billing_address"),
        shipping_country=country,
        shipping_method=method,
        currency=currency,
        subtotal=subtotal,
        shipping_total=shipping_total,
        grand_total=grand_total,
        status=Order.STATUS_PENDING,
        payment_status=Order.PAYMENT_PENDING,
        notes=payload.get("notes", ""),
    )
    for row in line_rows:
        OrderItem.objects.create(
            order=order,
            product=row["variant"].product,
            variant=row["variant"],
            name=row["name"],
            sku=row["sku"],
            size=row["size"],
            color=row["color"],
            image_url=row["image_url"],
            unit_price=row["unit_price"],
            quantity=row["quantity"],
        )
    return order


@transaction.atomic
def mark_order_paid(order_pk, payment_id: str = ""):
    """Idempotently move an order to PAID.

    Locks the order row, decrements variant stock exactly once, and confirms
    the order. Returns the updated Order when this call performed the
    transition, or None if it was already paid — so callers can avoid sending
    duplicate confirmation emails when both verify and the webhook fire.
    """
    order = Order.objects.select_for_update().get(pk=order_pk)
    if order.payment_status == Order.PAYMENT_PAID:
        return None
    for item in order.items.all():
        if item.variant_id:
            ProductVariant.objects.filter(pk=item.variant_id).update(
                stock=Greatest(F("stock") - item.quantity, 0)
            )
    order.payment_status = Order.PAYMENT_PAID
    if order.status == Order.STATUS_PENDING:
        order.status = Order.STATUS_CONFIRMED
    if payment_id and not order.razorpay_payment_id:
        order.razorpay_payment_id = payment_id
    order.save()
    return order


def send_order_confirmation(order: Order):
    lines = [
        f"  {item.quantity}× {item.name} ({item.color}/{item.size}) — "
        f"{order.currency} {item.line_total}"
        for item in order.items.all()
    ]
    body = (
        f"Hi,\n\nThanks for your Tredific order {order.display_id}.\n\n"
        + "\n".join(lines)
        + f"\n\nShipping ({order.shipping_method}): {order.currency} {order.shipping_total}"
        + f"\nTotal: {order.currency} {order.grand_total}\n\n"
        + "We'll email you again as soon as it ships.\n— Team Tredific"
    )
    try:
        send_mail(
            subject=f"Tredific order {order.display_id} confirmed",
            message=body,
            from_email=None,
            recipient_list=[order.email],
            fail_silently=False,
        )
    except Exception:
        logger.exception(
            "Order confirmation email failed for %s", order.display_id
        )
