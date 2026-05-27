import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    color = django_filters.CharFilter(method="filter_color")
    size = django_filters.CharFilter(method="filter_size")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    fabric = django_filters.CharFilter(field_name="fabric", lookup_expr="iexact")
    occasion = django_filters.CharFilter(field_name="occasion", lookup_expr="iexact")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["category", "color", "size", "fabric", "occasion", "featured"]

    def filter_color(self, qs, name, value):
        # comma separated colors
        colors = [c.strip() for c in value.split(",") if c.strip()]
        return qs.filter(variants__color__name__in=colors).distinct()

    def filter_size(self, qs, name, value):
        sizes = [s.strip() for s in value.split(",") if s.strip()]
        return qs.filter(variants__size__in=sizes).distinct()
