"""Custom authentication classes."""
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class OptionalJWTAuthentication(JWTAuthentication):
    """JWT authentication that never returns 401 for a bad token.

    A valid Bearer token still resolves to the matching user; an absent,
    expired, or malformed token is simply treated as an anonymous request.
    Use this on public endpoints that *optionally* personalise the response
    when a logged-in user is present (e.g. checkout) so that a stale token
    left in the browser cannot block the request.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError, AuthenticationFailed):
            return None
