from django.apps import AppConfig
from django.contrib.admin.apps import AdminConfig


class CustomAdminConfig(AdminConfig):
    default_site = "core.admin.CustomAdminSite"
    default_auto_field = "django.db.models.BigAutoField"


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
