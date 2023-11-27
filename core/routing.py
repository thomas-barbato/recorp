# chat/routing.py
from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r'ws/room3_<str:room>/', consumers.GameConsumer.as_asgi()),
]