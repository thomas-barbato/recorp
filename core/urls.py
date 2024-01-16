from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

from core import views as core_views

app_name = "core"

urlpatterns = [
    path("play/", core_views.DisplayGameView.as_view(template_name="play.html"), name="play"),
    path("", core_views.lang_view, name="none")
]