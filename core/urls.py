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
        "account/create",
        core_views.CreateAccountView.as_view(template_name="create-account.html"),
        name="create_account",
    ),
    path(
        "play/create_character",
        core_views.CreateCharacterView.as_view(template_name="create-character.html"),
        name="create_character",
    ),
    path(
        "account/password_recovery",
        core_views.PasswordRecoveryView.as_view(template_name="password_recovery.html"),
        name="password_recovery",
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
    path('play/session-check', core_views.session_check, name='session_check')
]
