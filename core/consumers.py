import json
import logging
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction

#logger = logging.getLogger("django")


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
        
        if self.user.is_authenticated:
            store = StoreInCache(self.room_group_name, self.user)
            store.get_or_set_cache()
            """
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
        store = StoreInCache(
            room_name=self.room_group_name, 
            user_calling=self.user
        )
        if p.get_player_id() == message["player"]:
            if p.destination_already_occupied(message["end_x"], message["end_y"]) is False:
                if p.move_have_been_registered(end_x=message["end_x"],end_y=message["end_y"],move_cost=int(message["move_cost"])):
                    store.update_player_position(message)
        
        response = {
            "type": "player_move", 
            "message": {
                "player": p.get_other_player_name(message["player"]),
                "player_user_id": p.get_other_player_user_id(message["player"]),
                "is_reversed": message["is_reversed"],
                "start_id_array": message["start_id_array"],
                "destination_id_array": message["destination_id_array"],
                "end_x": message["end_x"],
                "end_y": message["end_y"],
                "movement_remaining": p.get_other_player_movement_remaining(message["player"]),
                "max_movement": store.get_specific_player_data(message["player"], "pc_npc", "ship", "max_movement")
            }   
        }
        
        self.send(
            text_data=json.dumps(response)
        )
    
    def async_reverse_ship(self, event):
        response = {}
        message = json.loads(event["message"])
        store = StoreInCache(
            room_name=self.room_group_name, 
            user_calling=self.user
        )
        
        p = PlayerAction(self.user.id)
        p.set_reverse_ship_status()
        data = store.update_ship_is_reversed(message, self.user.id, p.get_reverse_ship_status())

        response = {
            "type": "async_reverse_ship", 
            "message": {
                "id_array": message['id_array'],
                "is_reversed": data[0],
                "player_id": data[1]
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