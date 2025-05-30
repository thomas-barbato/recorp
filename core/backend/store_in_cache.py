import datetime
import json
import logging
from django.core.cache import cache
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from core.backend.get_data import GetDataFromDB
from core.backend.player_actions import PlayerAction
from core.models import (
    Sector,
    Player,
    Module,
    PlayerShipModule
)


class StoreInCache:
    def __init__(self, room_name, user_calling):
        self.room = room_name
        self.sector_pk = self.room.split("_")[1]
        self.user_calling = user_calling

    def get_or_set_cache(self, need_to_be_recreated=False):
        if need_to_be_recreated:
            cache.set(self.room, [])
            self.set_sector_data(self.sector_pk) 
        else:           
            if not cache.get(self.room):
                self.set_sector_data(self.sector_pk)
        return cache.get(self.room)

    def set_sector_data(self, pk):
        planets, asteroids, stations, warpzones = GetDataFromDB.get_items_from_sector(
            self.sector_pk
        )
        foreground_table_set = {
            "planet": planets,
            "asteroid": asteroids,
            "station": stations,
            "warpzone": warpzones,
        }
        sector_pc, sector_npc = GetDataFromDB.get_pc_from_sector(self.sector_pk)
        sector = Sector.objects.get(id=pk)
        sector_data = dict()
        sector_data["sector_element"] = []
        sector_data["pc"] = []
        sector_data["npc"] = []
        sector_data["messages"] = []

        sector_data["sector"] = {
            "id": pk,
            "name": sector.name,
            "description": sector.description,
            "image": sector.image,
            "security": {
                "id": sector.security_id,
                "name": sector.security.name,
                "translated_name": sector.security.name,
            },
            "faction": {
                "id": sector.faction_id,
                "name": sector.faction.name,
                "is_faction_level_starter": sector.is_faction_level_starter,
                "translated_text_faction_level_starter": [],
            },
        }
        for table_key, table_value in foreground_table_set.items():
            for table in table_value:
                if table_key == "warpzone":
                    _, elementResource, elementZone = GetDataFromDB.get_table(table_key)
                    
                    map_element = elementResource.objects.filter(sector_id=self.sector_pk).values(
                        "id",
                        "name", 
                        "data", 
                        "sector_id",
                        "source_id",
                        "source_id__name",
                        "source_id__size",
                        "source_id__data",
                        "coordinates",
                    )
                    
                    for m in map_element:
                    
                        map_element_destination = elementZone.objects.filter(warp_home_id=m["id"]).values(
                            "warp_destination_id",
                            "warp_destination_id__name",
                            "warp_home_id"
                        )[0]
                        
                        sector_data["sector_element"].append(
                            {
                                "item_id": m["id"],
                                "item_name": m['source_id__name'],
                                "source_id": m['source_id'],
                                "sector_id": m['sector_id'],
                                "animations": m['source_id__data']['animation'],
                                "data": {
                                    "type": "warpzone",
                                    "name": m["name"],
                                    "coordinates": m['coordinates'],
                                    "size": m['source_id__size'],
                                    "description": m['data']["description"],
                                    "warp_home_id": map_element_destination["warp_home_id"],
                                    "destination_id": map_element_destination['warp_destination_id'],
                                    "destination_name": map_element_destination['warp_destination_id__name'],
                                },
                                "size": m['source_id__size'],
                            }
                        )
                    
                else:
                    
                    _, elementResource = GetDataFromDB.get_table(table_key)
                    resource = elementResource.objects.filter(sector_id=self.sector_pk).values(
                        'id',
                        'data',
                        'coordinates',
                        'quantity',
                        'source_id',
                        'sector_id',
                        'source_id__size',
                        'source_id__name',
                        'source_id__data',
                    )
                    for r in resource:
                        resource_quantity = GetDataFromDB.get_resource_quantity_value(
                            r["quantity"], 100
                        )
                        data_to_append = {
                                "item_id": r["id"] ,
                                "item_name": r["data"]["name"],
                                "resource": {
                                    "id": r["source_id"],
                                    "name": r["source_id__name"],
                                    "quantity": r["quantity"],
                                    "quantity_str": resource_quantity,
                                    "translated_quantity_str": resource_quantity,
                                },
                                "source_id": r["source_id"],
                                "sector_id": r["sector_id"],
                                "animations": r["source_id__data"]["animation"],
                                "data": {
                                    "type": r["source_id__data"]["type"],
                                    "name": r["data"]["name"],
                                    "coordinates": r["coordinates"],
                                    "description": r["data"]["description"],
                                },
                                "size": r["source_id__size"],
                            }
                        if data_to_append not in sector_data["sector_element"]:
                            sector_data["sector_element"].append(data_to_append)  

        for data in sector_npc:
            module_list = [
                {
                    "name": module["name"],
                    "effect": module["effect"],
                    "description": module["description"],
                    "type": module["type"],
                    "id": module["id"],
                }
                for module in Module.objects.filter(
                    id__in=data["npc_template_id__module_id_list"]
                ).values("name", "description", "effect", "type", "id")
            ]

            max_hp = int(data["npc_template_id__max_hp"])
            max_movement = int(data["npc_template_id__max_movement"])

            sector_data["npc"].append(
                {
                    "npc": {
                        "id": data["id"],
                        "name": data["npc_template_id__name"],
                        "coordinates": data["coordinates"],
                    },
                    "faction": {
                        "name": data["faction_id__name"],
                    },
                    "ship": {
                        "name": data["npc_template_id__ship_id__name"],
                        "image": data["npc_template_id__ship_id__image"],
                        "current_hp": int(data["hp"]),
                        "max_hp": max_hp,
                        "current_movement": int(data["movement"]),
                        "max_movement": max_movement,
                        "current_ballistic_defense": data["ballistic_defense"],
                        "current_thermal_defense": data["thermal_defense"],
                        "current_missile_defense": data["missile_defense"],
                        "status": data["status"],
                        "category_name": data[
                            "npc_template_id__ship_id__ship_category_id__name"
                        ],
                        "category_description": data[
                            "npc_template_id__ship_id__ship_category_id__description"
                        ],
                        "size": data[
                            "npc_template_id__ship_id__ship_category_id__size"
                        ],
                        "modules": module_list,
                        "modules_range": GetDataFromDB.is_in_range(
                            sector_data["sector"]["id"], data["id"], is_npc=True
                        ),
                    },
                }
            )

        for data in sector_pc:
            module_list = [
                {
                    "name": module["module_id__name"],
                    "effect": module["module_id__effect"],
                    "description": module["module_id__description"],
                    "type": module["module_id__type"],
                    "id": module["module_id"],
                }
                for module in PlayerShipModule.objects.filter(
                    player_ship_id=data["player_ship_id"]
                ).values("module_id__name", "module_id__description", "module_id__effect", "module_id__type", "module_id")
            ]
            
            sector_data["pc"].append(
                {
                    "user": {
                        "user": data["player_ship_id__player_id__user_id"],
                        "player": data["player_ship_id__player_id"],
                        "name": data["player_ship_id__player_id__name"],
                        "coordinates": data["player_ship_id__player_id__coordinates"],
                        "image": data["player_ship_id__player_id__image"],
                        "description": data["player_ship_id__player_id__description"],
                        "is_npc": data["player_ship_id__player_id__is_npc"],
                        "current_ap": data["player_ship_id__player_id__current_ap"],
                        "max_ap": data["player_ship_id__player_id__max_ap"],
                        "archetype_name": data["player_ship_id__player_id__archetype_id__name"],
                        "archetype_data": data["player_ship_id__player_id__archetype_id__data"],
                        "sector_name": data["player_ship_id__player_id__sector_id__name"],
                    },
                    "faction": {
                        "name": data["player_ship_id__player_id__faction_id__name"],
                    },
                    "ship": {
                        "name": data["player_ship_id__ship_id__name"],
                        "image": data["player_ship_id__ship_id__image"],
                        "description": data["player_ship_id__ship_id__description"],
                        "max_hp": data["player_ship_id__max_hp"],
                        "current_hp": int(data["player_ship_id__current_hp"]),
                        "max_movement": int(data["player_ship_id__max_movement"]),
                        "current_movement": int(data["player_ship_id__current_movement"]),
                        "current_ballistic_defense": data[
                            "player_ship_id__current_ballistic_defense"
                        ],
                        "current_thermal_defense": data[
                            "player_ship_id__current_thermal_defense"
                        ],
                        "current_missile_defense": data[
                            "player_ship_id__current_missile_defense"
                        ],
                        "current_cargo_size": data["player_ship_id__current_cargo_size"],
                        "status": data["player_ship_id__status"],
                        "module_slot_available": data[
                            "player_ship_id__ship_id__module_slot_available"
                        ],
                        "module_slot_already_in_use": len(module_list),
                        "modules": module_list,
                        "modules_range": GetDataFromDB.is_in_range(
                            sector_data["sector"]["id"], data["player_ship_id__player_id__user_id"], is_npc=False
                        ),
                        "ship_scanning_module_available": True if len([e['name'] for e in module_list if e['name'] == "spaceship probe"]) > 0 else False,
                        "category_name": data[
                            "player_ship_id__ship_id__ship_category__name"
                        ],
                        "category_description": data[
                            "player_ship_id__ship_id__ship_category__description"
                        ],
                        "size": data["player_ship_id__ship_id__ship_category__size"],
                        "is_reversed": data["player_ship_id__is_reversed"],
                    },
                }
            )
        cache.set(self.room, sector_data)

    def get_specific_player_data(
        self, player_id, category="", subcategory="", search=""
    ):
        in_cache = cache.get(self.room)
        cache_data = in_cache[category]
        player = player_id

        try:
            found_player = next(p for p in cache_data if player == p["user"]["player"])

        except StopIteration:
            return

        found_player_index = cache_data.index(found_player)
        
        if subcategory != "" and search != "":
            return cache_data[found_player_index][subcategory][search]
        return cache_data[found_player_index]

    def get_specific_sector_data(self, search_item):
        if not cache.get(self.room):
            self.set_sector_data(self.sector_pk)
        return cache.get(self.room)[search_item]

    def update_player_position(self, pos):
        in_cache = cache.get(self.room)
        player_position = in_cache["pc"]
        player = pos["player"]

        try:
            found_player = next(
                p for p in player_position if player == p["user"]["player"]
            )

        except StopIteration:
            return

        found_player_index = player_position.index(found_player)
        player_position[found_player_index]["user"]["coordinates"] = {
            "x": int(pos["end_x"]),
            "y": int(pos["end_y"]),
        }

        player_position[found_player_index]["ship"]["current_movement"] -= pos[
            "move_cost"
        ]

        for player in player_position:
            if player["user"]["player"] == found_player["user"]["player"]:
                if player["user"]["coordinates"]["y"] != int(
                    pos["end_y"]
                ) or player["user"]["coordinates"]["x"] != int(pos["end_x"]):
                    player_index = player_position.index(player)
                    player_position.pop(player_index)

        in_cache["pc"] = player_position
        cache.set(self.room, in_cache)
        
        
    def update_player_range_finding(self):
        in_cache = cache.get(self.room)
        player_position = in_cache["pc"]
        player = PlayerAction(self.user_calling)

        try:
            found_player = next(
                p for p in player_position if player.get_player_id() == p["user"]["player"]
            )

        except StopIteration:
            return
        
        found_player_index = player_position.index(found_player)
        player_position[found_player_index]["ship"]["modules_range"] = GetDataFromDB.is_in_range(
            player.get_player_sector(), self.user_calling, is_npc=False
        )
        
        in_cache["pc"] = player_position
        cache.set(self.room, in_cache)
        

    def update_ship_is_reversed(self, data, user_id, status):
        in_cache = cache.get(self.room)
        pc_cache = in_cache["pc"]
        user = data["user"]

        try:
            player = next(p for p in pc_cache if user == p["user"]["user"])

        except StopIteration:
            return

        player_index = pc_cache.index(player)
        player_id = pc_cache[player_index]["user"]["player"]
        pc_cache[player_index]["ship"]["is_reversed"] = status
        in_cache["pc"] = pc_cache
        cache.set(self.room, in_cache)

        return pc_cache[player_index]["ship"]["is_reversed"], player_id

    def get_user_index(self, player_id):
        in_cache = cache.get(self.room)
        player_data = in_cache["pc"]
        player = player_id

        try:
            found_player = next(
                p for p in player_data if player == p["user"]["player"]
            )
        except StopIteration:
            return

        found_player_index = player_data.index(found_player)
        return found_player_index
    
    def transfert_player_to_other_cache(self, destination_sector, new_coordinates):
        
        PlayerAction(self.user_calling).set_player_sector(
            destination_sector, 
            new_coordinates
        )
        room_name = f"play_{destination_sector}"
        return room_name
        
    def get_user(self, player_id, room_name = None):
        in_cache = cache.get(room_name)
        return [
                key for key in in_cache['pc'] if key["user"]["player"] == player_id
            ]
        
    def delete_player_from_cache(self, player_id, old_room = None):
        if player_id != self.user_calling:
            in_cache = cache.get(old_room)
            in_cache["pc"] = [
                key for key in in_cache['pc'] if key["user"]["player"] != player_id
            ]
            cache.set(self.room, in_cache)

    def add_msg(self, user):
        in_cache = cache.get(self.room)
        new_msg = in_cache["messages"]
        new_msg.append(
            {
                "username": user,
                "value": self.user_calling,
                "created_date": self.get_datetime_json(datetime.datetime.now()),
            }
        )
        in_cache["messages"] = new_msg
        cache.set(self.room, in_cache)

    def get_sorted_messages(self):
        return sorted(
            [key for key in cache.get(self.room)["messages"]],
            key=lambda d: d["created_date"],
        )

    def get_datetime_json(self, date_time):
        return json.dumps(date_time, indent=4, sort_keys=True, default=str)
    
    def notify_room_users(room_id, message):
        
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        channel_layer.group_send(f"room_{room_id}", {
            "type": "async_remove_ship",
            "message": message
        })