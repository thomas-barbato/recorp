from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.conf import settings
from django.contrib import messages
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.translation import gettext as _

from core.backend.security_logging import log_account_lockout

try:
    from axes.models import AccessAttempt
except Exception:  # pragma: no cover - fallback when axes is unavailable in local env
    AccessAttempt = None


def _remote_ip(request) -> str:
    if request is None:
        return "-"
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "-")


def _cooloff_delta() -> timedelta:
    """Return cooloff duration as timedelta.

    Axes uses AXES_COOLOFF_TIME. Numeric values are interpreted as hours,
    timedelta values are used directly.
    """
    value = getattr(settings, "AXES_COOLOFF_TIME", None)
    uses_legacy_duration = False
    if value is None:
        # Backward-compat fallback (legacy setting name in this project)
        value = getattr(settings, "AXES_COOLOFF_DURATION", None)
        uses_legacy_duration = True

    if isinstance(value, timedelta):
        return value

    if isinstance(value, (int, float)):
        if uses_legacy_duration:
            # Historical project setting stored seconds.
            return timedelta(seconds=float(value))
        # Axes native numeric semantics: hours.
        return timedelta(hours=float(value))

    # Safe default to avoid permanent lockout if setting is malformed
    return timedelta(minutes=15)


def _lock_session_key(username: str, ip: str) -> str:
    return f"axes_lockout_until:{username or 'unknown'}:{ip or '-'}"


def _extract_attempt_time(attempt: Any):
    for field_name in ("attempt_time", "created", "modified", "updated_at"):
        dt = getattr(attempt, field_name, None)
        if dt is not None:
            return dt
    return None


def _latest_attempt_time(username: str, ip: str):
    if AccessAttempt is None:
        return None

    base = AccessAttempt.objects.all()

    # Prefer strict match first when possible.
    if username and ip:
        item = base.filter(username__iexact=username, ip_address=ip).order_by("-attempt_time").first()
        dt = _extract_attempt_time(item)
        if dt:
            return dt

    if username:
        item = base.filter(username__iexact=username).order_by("-attempt_time").first()
        dt = _extract_attempt_time(item)
        if dt:
            return dt

    if ip:
        item = base.filter(ip_address=ip).order_by("-attempt_time").first()
        dt = _extract_attempt_time(item)
        if dt:
            return dt

    item = base.order_by("-attempt_time").first()
    return _extract_attempt_time(item)


def _parse_session_unlock_at(request, session_key: str):
    if not hasattr(request, "session"):
        return None
    raw = request.session.get(session_key)
    if not raw:
        return None
    try:
        dt = timezone.datetime.fromisoformat(raw)
    except Exception:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def _compute_unlock_at(request, username: str, ip: str):
    now = timezone.now()
    cooloff = _cooloff_delta()

    candidates = []

    attempt_time = _latest_attempt_time(username, ip)
    if attempt_time is not None:
        if timezone.is_naive(attempt_time):
            attempt_time = timezone.make_aware(attempt_time, timezone.get_current_timezone())
        candidates.append(attempt_time + cooloff)

    session_key = _lock_session_key(username, ip)
    session_unlock_at = _parse_session_unlock_at(request, session_key)
    if session_unlock_at is not None and session_unlock_at > now:
        candidates.append(session_unlock_at)

    if candidates:
        return max(candidates)

    return now + cooloff


def _format_remaining(seconds: int) -> str:
    seconds = max(1, int(seconds))
    minutes, sec = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)

    if hours > 0:
        return _("%(h)d h %(m)d min") % {"h": hours, "m": minutes}
    if minutes > 0:
        return _("%(m)d min %(s)d s") % {"m": minutes, "s": sec}
    return _("%(s)d s") % {"s": sec}


def axes_lockout_response(request, credentials=None, *args, **kwargs):
    """Custom Axes lockout response.

    Replaces Axes default plain-text lock page with a redirect back to the login
    page and a user-facing message containing remaining lockout time.
    """
    username = ""
    if isinstance(credentials, dict):
        username = (credentials.get("username") or credentials.get("email") or "").strip()
    if not username:
        username = str(kwargs.get("username") or "").strip()

    ip = _remote_ip(request)
    unlock_at = _compute_unlock_at(request, username, ip)
    remaining_seconds = max(1, int((unlock_at - timezone.now()).total_seconds()))

    if hasattr(request, "session"):
        request.session[_lock_session_key(username, ip)] = unlock_at.isoformat()
        request.session.modified = True

    message = _(
        "Compte temporairement bloque apres trop de tentatives. "
        "Reessayez dans %(remaining)s."
    ) % {"remaining": _format_remaining(remaining_seconds)}

    messages.error(request, message)
    log_account_lockout(request, username=username or "<unknown>", ip=ip, reason="brute_force")

    target = getattr(request, "path", None) or "/"
    return redirect(target)
