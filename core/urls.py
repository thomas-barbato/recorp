from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from core import views as core_views
from django.contrib.auth import views as auth_views

app_name = "core"

urlpatterns = [
    path(
        "play/",
        core_views.DisplayGameView.as_view(template_name="play.html"),
        name="play_view",
    ),
    path(
        "play/tutorial",
        core_views.DisplayTutorialView.as_view(template_name="tutorial.html"),
        name="tutorial_view",
    ),
    path(
        "",
        core_views.IndexView.as_view(template_name="index.html"),
        name="index_view",
    ),
    path(
        "play/warp",
        core_views.ChangeSectorGameView.as_view(template_name="play.html"),
        name="changeSector_view",
    ),
    path('logout', auth_views.LogoutView.as_view(
        next_page='/', 
        http_method_names = ['post']
        ), 
        name='logout_view'),
]
