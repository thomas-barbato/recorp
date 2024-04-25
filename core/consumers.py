import json
import logging
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

from core.backend.store_in_cache import StoreInCache

logger = logging.getLogger("django")


class GameConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room = None
        self.room_group_name = None
        self.user = None
        self.game = None
        self.game_cache = None

    def connect(self):
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.room_group_name = f"play_{self.room}"
        self.user = self.scope["user"]
        self.accept()

        # join the room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name,
        )
        """
        if self.user.is_authenticated:
            store = StoreInCache(self.room_group_name, self.user.username)
            store.add_user()
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "user_join",
                    "user": store.get_user()[0],
                },
            )
        """
    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name,
        )
        self.close()

    # Receive message from web socket
    def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        message = data["message"]
        type = data["type"]

        if not self.user.is_authenticated:
            return

        # send chat message event to the room
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": type,
                "user": self.user.username,
                "message": message,
            },
        )
    
    def async_move(self, event):
        store = StoreInCache(self.room_group_name, self.user.username)
        new_coord = store.update_player_position(json.loads(event["message"]))
        if self.user.is_authenticated:
            self.send(
                text_data=json.dumps({"type": "player_move", "message": new_coord})
            )

    def send_message(self, event):
        pass

    def user_join(self, event):
        pass

    def user_leave(self, event):
        pass