import json
import logging
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction

logger = logging.getLogger("django")


class GameConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room = None
        self.room_group_name = None
        self.user = None
        self.game = None
        self.game_cache = None
        self.player_id = None

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
        response = {}
        message = json.loads(event["message"])
        p = PlayerAction(self.user.id)
        if p.get_player_id() == message["player"]:
            if p.destination_already_occupied(message["end_x"], message["end_y"]) is False:
                p.move(
                    end_x=message["end_x"],
                    end_y=message["end_y"]
                )
                
        store = StoreInCache(
            room_name=self.room_group_name, 
            user_calling=self.user
        )
        store.update_player_position(message)
        response = {"type": "player_move", "message": message}
    
        coord = p.get_other_player_coord(message["player"])
        response = {
            "type": "player_move", 
            "message": {
                "player": message["player"],
                "start_x": message["start_x"],
                "start_y": message["start_y"],
                "end_x": coord["coord_x"],
                "end_y": coord["coord_y"],
            }   
        }
            
        self.send(
            text_data=json.dumps(response)
        )
            

    def send_message(self, event):
        pass

    def user_join(self, event):
        pass

    def user_leave(self, event):
        pass