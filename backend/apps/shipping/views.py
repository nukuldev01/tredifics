from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny

from .models import ShippingRate


class ShippingRateSerializer(serializers.ModelSerializer):
    method_display = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = ShippingRate
        fields = (
            "id", "country", "method", "method_display", "price", "currency",
            "estimated_days_min", "estimated_days_max", "free_above",
        )


class ShippingRateListView(generics.ListAPIView):
    serializer_class = ShippingRateSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # public endpoint — ignore any stale JWT
    pagination_class = None

    def get_queryset(self):
        country = self.request.query_params.get("country", "").upper()
        qs = ShippingRate.objects.all()
        if country:
            qs = qs.filter(country=country)
        return qs
