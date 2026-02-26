"""Signals handling for session tracking and security logging.

We keep the existing LoggedInUser bookkeeping and add security logging for
login attempts (successes and failures) including IP and account where
available.
"""
import logging
from django.contrib.auth import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from core.models import LoggedInUser

security_logger = logging.getLogger("security")


def _get_remote_ip(request):
    if not request:
        return "-"
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        # X-Forwarded-For may contain a comma-separated list
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "-")


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    # Maintain existing LoggedInUser index
    try:
        LoggedInUser.objects.get_or_create(user=user)
    except Exception:
        pass

    # Security log — successful login (WARNING level so it appears in focused logs)
    ip = _get_remote_ip(request)
    security_logger.warning(
        "LOGIN SUCCESS - user=%s ip=%s path=%s",
        getattr(user, "username", "<unknown>"),
        ip,
        getattr(request, "path", "-"),
    )


@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    # credentials is a dict, may contain 'username' or 'email'
    username = credentials.get("username") or credentials.get("email") or "<unknown>"
    ip = _get_remote_ip(request)
    security_logger.warning(
        "LOGIN FAILED - username=%s ip=%s path=%s",
        username,
        ip,
        getattr(request, "path", "-"),
    )


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    try:
        LoggedInUser.objects.filter(user=user).delete()
    except Exception:
        pass

    ip = _get_remote_ip(request)
    security_logger.warning(
        "LOGOUT - user=%s ip=%s path=%s",
        getattr(user, "username", "<unknown>"),
        ip,
        getattr(request, "path", "-"),
    )