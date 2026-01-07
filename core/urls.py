from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from core import views as core_views
from django.contrib.auth import views as auth_views
from django.views.i18n import JavaScriptCatalog

app_name = "core"

urlpatterns = [
    path(
        "",
        core_views.IndexView.as_view(template_name="index.html"),
        name="index_view",
    ),
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
    path(
        "play/modal-data/<str:element_type>/<int:element_id>/",
        core_views.modal_data_view,
        name="modal_data_view"
    ),
    path('play/session-check', core_views.session_check, name='session_check'),
    path("messages/", core_views.private_mail_modal, name="private_mail_modal"),
    path("messages/get/<str:pk>/", core_views.get_private_mail, name="get_message"),
    path("messages/delete/", core_views.delete_private_mail, name="delete_message"),
    path("messages/search/", core_views.search_private_mail, name="search_messages"),
    path("messages/search_players/", core_views.search_players_for_private_mail, name="search_players"),
    path('messages/unread-count/', core_views.get_unread_private_mail_count, name='get_unread_private_mail_count'),
    path('messages/mark-read/<int:message_id>/', core_views.mark_private_mail_as_read, name='mark_private_mail_as_read'),
    path("chat/get/<str:channel_type>/", core_views.get_chat_messages, name="get_chat_messages"),
    path('chat/mark-read/<str:channel_type>/', core_views.mark_messages_as_read, name='mark_messages_as_read'),
    path('chat/unread-counts/', core_views.get_unread_counts, name='get_unread_counts'),
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),
]
