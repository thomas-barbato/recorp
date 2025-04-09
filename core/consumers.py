import json
import logging
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

from core.backend.store_in_cache import StoreInCache
from core.backend.inter_channel_groups import send_message_to_group
from core.backend.player_actions import PlayerAction
from core.backend.get_data import GetDataFromDB

# logger = logging.getLogger("django")


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
            store.get_or_set_cache(need_to_be_recreated=False)

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
        store = StoreInCache(room_name=self.room_group_name, user_calling=self.user)
        player_id = p.get_player_id()
        response = {}
        if player_id == message["player"]:
            if (
                p.destination_already_occupied(message["end_x"], message["end_y"])
                is False
            ):
                if p.move_have_been_registered(
                    end_x=message["end_x"],
                    end_y=message["end_y"],
                    move_cost=int(message["move_cost"]),
                ):
                    store.update_player_position(message)
                    store.update_player_range_finding()
                    response = {
                        "type": "player_move",
                        "message": {
                            "user_id": p.get_other_player_user_id(message["player"]),
                            "player": store.get_specific_player_data(
                                p.get_player_id(), "pc"
                            ),
                            "sector": store.get_specific_sector_data("sector"),
                            "move_cost": message["move_cost"],
                            "modules_range": store.get_specific_player_data(
                                player_id, "pc", "ship", "modules_range"
                            ),
                            "size": store.get_specific_player_data(
                                player_id, "pc", "ship", "size"
                            ),
                        },
                    }
        else:
            store.update_player_range_finding()
            response = {
                "type": "player_move",
                "message": {
                    "player": p.get_other_player_name(message["player"]),
                    "player_id": message["player"],
                    "user_id": p.get_other_player_user_id(message["player"]),
                    "is_reversed": message["is_reversed"],
                    "start_id_array": message["start_id_array"],
                    "destination_id_array": message["destination_id_array"],
                    "end_x": message["end_x"],
                    "end_y": message["end_y"],
                    "movement_remaining": p.get_other_player_movement_remaining(
                        message["player"]
                    ),
                    "max_movement": store.get_specific_player_data(
                        message["player"], "pc", "ship", "max_movement"
                    ),
                    "modules_range": store.get_specific_player_data(
                        player_id, "pc", "ship", "modules_range"
                    ),
                    "size": store.get_specific_player_data(
                        message["player"], "pc", "ship", "size"
                    ),
                },
            }

        self.send(text_data=json.dumps(response))

    def async_reverse_ship(self, event):
        response = {}
        message = json.loads(event["message"])
        store = StoreInCache(room_name=self.room_group_name, user_calling=self.user)

        p = PlayerAction(self.user.id)
        p.set_reverse_ship_status()
        data = store.update_ship_is_reversed(
            message, self.user.id, p.get_reverse_ship_status()
        )

        response = {
            "type": "async_reverse_ship",
            "message": {
                "id_array": message["id_array"],
                "is_reversed": data[0],
                "player_id": data[1],
            },
        }

        self.send(text_data=json.dumps(response))

    def async_travel(self, event):
        
        response = {}
        message = json.loads(event["message"])
        
        store = StoreInCache(room_name=self.room_group_name, user_calling=self.user)
        ship_pos = PlayerAction(message["player"]).get_spaceship_coord_and_size(
            message["player"]
        )
        data = store.get_user(message['player'], self.room_group_name)
        
        if message["player"] == self.user.id:
            
            destination_sector_id, new_coordinates = PlayerAction(
                self.user.id
            ).player_travel_to_destination(
                message["warpzone_name"], message["source_id"]
            )
            store.transfert_player_to_other_cache(
                destination_sector_id, new_coordinates
            )
            response = {
                "type": "async_travel",
                "message": {
                    "user_can_travel": True,
                    "player": message["player"],
                    "warpzone_name": message["warpzone_name"],
                    "source_id": destination_sector_id
                },
            }
            #store.delete_player_from_cache(message["player"])
            self.send(text_data=json.dumps(response))

        else:
            response = {
                "type": "async_travel",
                "message": {
                    "position": data[0]['user']['coordinates'],
                    "size": ship_pos["ship_id__ship_category_id__size"],
                    "player_id": message["player"] 
                },
            }
            
            #store.delete_player_from_cache(message["player"])
            self.send(text_data=json.dumps(response))


    def async_player_enter_in_sector(self, event):
        message = json.loads(event["message"])
        player_id = message["data"]['player']
        sector_id = message["data"]["source_id"]
        room_name = f"play_{sector_id}"
        
        message = {
            "sector": message["data"]["source_id"],
            "player_data": StoreInCache(room_name, self.user).get_user(player_id, room_name),
        }
        
        async_to_sync(self.channel_layer.group_send)(
            room_name,
            {
                "type": "user_join",
                "message": message,
            },
        )


    def user_join(self, event):
        message = event["message"]
        response = {
            "type": "user_join",
            "message": message,
        }

        self.send(text_data=json.dumps(response))



    def send_message(self, event):
        pass

    def user_leave(self, event):
        pass
