from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.http import HttpResponse


def healthz(_request):
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("healthz", healthz),
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/shipping/", include("apps.shipping.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/content/", include("apps.content.urls")),
    path("api/blog/", include("apps.blog.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "Tredific® Admin"
admin.site.site_title = "Tredific® Admin"
admin.site.index_title = "Operations"
