import json
import logging
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

logger = logging.getLogger("django")


class GameConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def connect(self):
        pass

        if self.user.is_authenticated:
            pass

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name,
        )
        self.close()

    # Receive message from web socket
    def receive(self, text_data=None, bytes_data=None):
        pass

    def send_message(self, event):
        pass

    def user_join(self, event):
        pass

    def user_leave(self, event):
        pass

    def click_on_card(self, event):
        pass