from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.users.authentication import OptionalJWTAuthentication

from .models import Order
from .serializers import CheckoutSerializer, OrderSerializer
from .services import create_order_from_payload


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "public_id"

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user).prefetch_related("items")
        return Order.objects.none()

    @method_decorator(
        ratelimit(key="ip", rate="30/h", method="POST", block=True)
    )
    @action(detail=False, methods=["post"], url_path="checkout",
            permission_classes=[permissions.AllowAny],
            authentication_classes=[OptionalJWTAuthentication])
    def checkout(self, request):
        ser = CheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        try:
            order = create_order_from_payload(ser.validated_data, user=user)
        except ValueError as e:
            raise ValidationError(str(e))
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="lookup",
            permission_classes=[permissions.AllowAny],
            authentication_classes=[OptionalJWTAuthentication])
    def lookup(self, request):
        """Look up a guest order by public_id + email."""
        public_id = request.query_params.get("public_id")
        email = request.query_params.get("email")
        if not public_id or not email:
            raise ValidationError("public_id and email required")
        order = Order.objects.filter(public_id=public_id, email__iexact=email).first()
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)
