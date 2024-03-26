# chat/routing.py
from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r'ws/play_<str:room>/', consumers.GameConsumer.as_asgi()),
]