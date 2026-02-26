"""Signals handling for session tracking and security logging.

We keep the existing LoggedInUser bookkeeping and add security logging for
login attempts (successes and failures) including IP, account, and User-Agent.
Additional security logging for authorization, account changes, and sensitive operations.
"""
import logging
from django.contrib.auth import user_logged_in, user_logged_out, user_login_failed
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from core.models import LoggedInUser, User

security_logger = logging.getLogger("security")


def _get_remote_ip(request):
    if not request:
        return "-"
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        # X-Forwarded-For may contain a comma-separated list
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "-")


def _get_user_agent(request):
    if not request:
        return "-"
    return request.META.get("HTTP_USER_AGENT", "-")


# ============================================================================
# 🔐 AUTHENTICATION LOGS
# ============================================================================

@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    # Maintain existing LoggedInUser index
    try:
        LoggedInUser.objects.get_or_create(user=user)
    except Exception:
        pass

    # Security log — successful login (WARNING level so it appears in focused logs)
    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    security_logger.warning(
        "[LOGIN SUCCESS] user_id=%s username=%s ip=%s user_agent=%s path=%s",
        user.id,
        getattr(user, "username", "<unknown>"),
        ip,
        user_agent,
        getattr(request, "path", "-"),
    )


@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    # credentials is a dict, may contain 'username' or 'email'
    username = credentials.get("username") or credentials.get("email") or "<unknown>"
    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    security_logger.warning(
        "[LOGIN FAILED] username=%s ip=%s user_agent=%s path=%s",
        username,
        ip,
        user_agent,
        getattr(request, "path", "-"),
    )


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    try:
        LoggedInUser.objects.filter(user=user).delete()
    except Exception:
        pass

    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    security_logger.warning(
        "[LOGOUT] user_id=%s username=%s ip=%s user_agent=%s path=%s",
        user.id,
        getattr(user, "username", "<unknown>"),
        ip,
        user_agent,
        getattr(request, "path", "-"),
    )


# ============================================================================
# 🛡️ AUTHORIZATION & SENSITIVE DATA CHANGE LOGS
# ============================================================================

@receiver(pre_save, sender=User)
def log_user_sensitive_changes(sender, instance, **kwargs):
    """Log changes to sensitive user fields"""
    if instance.pk is None:
        # New user creation (account signup)
        security_logger.warning(
            "[ACCOUNT CREATED] user_id=%s username=%s email=%s",
            instance.id,
            instance.username,
            instance.email,
        )
        return
    
    # Check if this is an update
    try:
        old_instance = User.objects.get(pk=instance.pk)
    except User.DoesNotExist:
        return
    
    # Log email changes
    if old_instance.email != instance.email:
        security_logger.warning(
            "[EMAIL CHANGED] user_id=%s username=%s old_email=%s new_email=%s",
            instance.id,
            instance.username,
            old_instance.email,
            instance.email,
        )
    
    # Log password changes (detected by checking hash change)
    if old_instance.password != instance.password:
        security_logger.warning(
            "[PASSWORD CHANGED] user_id=%s username=%s",
            instance.id,
            instance.username,
        )
    
    # Log permission/role changes
    if old_instance.is_staff != instance.is_staff:
        action = "GRANTED" if instance.is_staff else "REVOKED"
        security_logger.warning(
            "[STAFF PERMISSION %s] user_id=%s username=%s",
            action,
            instance.id,
            instance.username,
        )
    
    if old_instance.is_superuser != instance.is_superuser:
        action = "GRANTED" if instance.is_superuser else "REVOKED"
        security_logger.warning(
            "[SUPERUSER PERMISSION %s] user_id=%s username=%s",
            action,
            instance.id,
            instance.username,
        )
    
    if old_instance.is_active != instance.is_active:
        action = "ACTIVATED" if instance.is_active else "DEACTIVATED"
        security_logger.warning(
            "[ACCOUNT %s] user_id=%s username=%s",
            action,
            instance.id,
            instance.username,
        )