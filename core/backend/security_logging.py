"""Security logging utilities for authorization and access control"""
import logging
from django.contrib.auth.models import User

security_logger = logging.getLogger("security")


def _get_remote_ip(request):
    """Extract client IP from request, handling proxies"""
    if not request:
        return "-"
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "-")


def _get_user_agent(request):
    """Extract User-Agent from request"""
    if not request:
        return "-"
    return request.META.get("HTTP_USER_AGENT", "-")


def log_unauthorized_access(request, resource_type: str, resource_id=None, reason: str = ""):
    """
    Log unauthorized access attempts
    
    Args:
        request: Django request object
        resource_type: Type of resource (e.g., "admin_panel", "api_endpoint", "user_data")
        resource_id: ID of the resource being accessed (optional)
        reason: Reason for denial (e.g., "insufficient_permissions", "account_not_active")
    """
    user_id = request.user.id if request.user.is_authenticated else None
    username = request.user.username if request.user.is_authenticated else "anonymous"
    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    
    security_logger.warning(
        "[UNAUTHORIZED ACCESS] resource=%s resource_id=%s user_id=%s username=%s ip=%s reason=%s user_agent=%s path=%s",
        resource_type,
        resource_id,
        user_id,
        username,
        ip,
        reason,
        user_agent,
        getattr(request, "path", "-"),
    )


def log_sensitive_resource_access(request, resource_type: str, resource_id=None, action: str = "read"):
    """
    Log access to sensitive resources (admin panel, user data, etc.)
    
    Args:
        request: Django request object
        resource_type: Type of resource (e.g., "admin_panel", "user_profile", "payment_data")
        resource_id: ID of the resource being accessed (optional)
        action: Action performed (read, modify, delete)
    """
    user_id = request.user.id if request.user.is_authenticated else None
    username = request.user.username if request.user.is_authenticated else "anonymous"
    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    
    security_logger.warning(
        "[SENSITIVE ACCESS] resource=%s resource_id=%s action=%s user_id=%s username=%s ip=%s user_agent=%s path=%s",
        resource_type,
        resource_id,
        action,
        user_id,
        username,
        ip,
        user_agent,
        getattr(request, "path", "-"),
    )


def log_admin_action(request, action: str, target_user_id: int = None, target_username: str = None, details: str = ""):
    """
    Log admin actions (user modifications, deletions, permission changes)
    
    Args:
        request: Django request object
        action: Type of action (e.g., "user_created", "user_deleted", "permission_changed")
        target_user_id: ID of the user being acted upon
        target_username: Username of the user being acted upon
        details: Additional details about the action
    """
    user_id = request.user.id if request.user.is_authenticated else None
    username = request.user.username if request.user.is_authenticated else "unknown"
    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    
    security_logger.warning(
        "[ADMIN ACTION] action=%s admin_user_id=%s admin_username=%s target_user_id=%s target_username=%s ip=%s details=%s user_agent=%s path=%s",
        action,
        user_id,
        username,
        target_user_id,
        target_username,
        ip,
        details,
        user_agent,
        getattr(request, "path", "-"),
    )


def log_account_lockout(request, username: str, ip: str, reason: str = "brute_force"):
    """
    Log account lockout events (includes axes lockouts)
    
    Args:
        request: Django request object or None
        username: Username of the locked account
        ip: IP address from which the attack came
        reason: Reason for lockout (brute_force, suspicious_activity, etc.)
    """
    user_agent = _get_user_agent(request) if request else "-"
    
    security_logger.warning(
        "[ACCOUNT LOCKED] username=%s ip=%s reason=%s user_agent=%s",
        username,
        ip,
        reason,
        user_agent,
    )


def log_suspicious_activity(request, activity_type: str, details: str = ""):
    """
    Log suspicious activities (SQL injection attempts, XSS attempts, etc.)
    
    Args:
        request: Django request object
        activity_type: Type of suspicious activity
        details: Additional details
    """
    user_id = request.user.id if request.user.is_authenticated else None
    username = request.user.username if request.user.is_authenticated else "anonymous"
    ip = _get_remote_ip(request)
    user_agent = _get_user_agent(request)
    
    security_logger.error(
        "[SUSPICIOUS ACTIVITY] type=%s user_id=%s username=%s ip=%s details=%s user_agent=%s path=%s",
        activity_type,
        user_id,
        username,
        ip,
        details,
        user_agent,
        getattr(request, "path", "-"),
    )
