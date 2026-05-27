"""Project-wide middleware."""
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse


class AdminLoginRateLimitMiddleware:
    """Throttle brute-force attempts against the Django admin login.

    Counts POST requests to the admin login URL per client IP and short-
    circuits with HTTP 429 once the threshold is exceeded. Uses the default
    cache; on a multi-process server, point the cache at Redis for an exact
    global limit.
    """

    MAX_ATTEMPTS = 10
    WINDOW_SECONDS = 300

    def __init__(self, get_response):
        self.get_response = get_response
        admin_url = str(getattr(settings, "ADMIN_URL", "admin/")).strip("/")
        self.login_path = f"/{admin_url}/login/"

    def __call__(self, request):
        if request.method == "POST" and request.path == self.login_path:
            ip = self._client_ip(request)
            key = f"adminlogin:{ip}"
            attempts = cache.get(key, 0)
            if attempts >= self.MAX_ATTEMPTS:
                return HttpResponse(
                    "Too many login attempts. Please try again in a few minutes.",
                    status=429,
                )
            cache.set(key, attempts + 1, self.WINDOW_SECONDS)
        return self.get_response(request)

    @staticmethod
    def _client_ip(request):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")
