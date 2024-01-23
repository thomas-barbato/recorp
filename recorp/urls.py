from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin

admin.autodiscover()

from core.admin import admin_site

admin_site._registry.update(admin.site._registry)

urlpatterns = (
    i18n_patterns(
        path("admin/", admin_site.urls),
        path("", include("core.urls", namespace="core")),
    )
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
)
