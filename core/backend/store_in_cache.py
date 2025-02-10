import datetime
import json
import logging
from django.core.cache import cache
from django.contrib.auth.models import User
from core.backend.get_data import GetDataFromDB
from core.backend.player_actions import PlayerAction
from core.models import (
    Sector,
    Player,
    Module,
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
                element, elementResource = GetDataFromDB.get_table(table_key)
                
                if table_key == "warpzone":
                    
                    map_element = elementResource.objects.filter(warp_home_id=self.sector_pk).values(
                        "id",
                        "name", 
                        "data", 
                        "warp_destination_id",
                        "warp_home_id",
                        "warp_id",
                        "warp_id__name",
                        "warp_id__size",
                        "warp_id__data",
                        "warp_destination_id__name",
                    )[0]
                    
                    sector_data["sector_element"].append(
                        {
                            "item_id": map_element["id"],
                            "item_name": map_element['warp_id__name'],
                            "source_id": map_element['warp_id'],
                            "sector_id": map_element['warp_home_id'],
                            "animations": ["warpzone", map_element['warp_id__data']['animation']],
                            "data": {
                                "type": "warpzone",
                                "name": map_element["name"],
                                "coord_x": map_element['data']["coord_x"],
                                "coord_y": map_element['data']["coord_y"],
                                "description": map_element['data']["description"],
                                "destination_id": map_element['warp_destination_id'],
                                "destination_name": map_element['warp_destination_id__name'],
                            },
                            "size": map_element['warp_id__size'],
                        }
                    )
                    
                else:
                    
                    map_element = [
                        v
                        for k, v in element.objects.filter(name=table.source.name)
                        .values_list("data", flat=True)[0]
                        .items()
                        if v != "none"
                    ]
                    
                    

                    resource_quantity = GetDataFromDB.get_resource_quantity_value(
                        table.quantity, 100
                    )

                    sector_data["sector_element"].append(
                        {
                            "item_id": table.id,
                            "item_name": table.data["name"],
                            "resource": {
                                "id": table.resource_id,
                                "name": table.resource.name,
                                "quantity": table.quantity,
                                "quantity_str": resource_quantity,
                                "translated_quantity_str": resource_quantity,
                            },
                            "source_id": table.source_id,
                            "sector_id": table.sector_id,
                            "animations": map_element,
                            "data": {
                                "type": map_element[0],
                                "name": table.data["name"],
                                "coord_x": table.data["coord_x"],
                                "coord_y": table.data["coord_y"],
                                "description": table.data["description"],
                            },
                            "size": GetDataFromDB.get_specific_size(map_element[0]),
                        }
                    )

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
                            "npc_template_id__ship_id__ship_category_id__ship_size"
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
                    "name": module["name"],
                    "effect": module["effect"],
                    "description": module["description"],
                    "type": module["type"],
                    "id": module["id"],
                }
                for module in Module.objects.filter(
                    id__in=data["playership__module_id_list"]
                ).values("name", "description", "effect", "type", "id")
            ]

            max_hp = int(data["playership__max_hp"])
            max_movement = int(data["playership__max_movement"])

            for module in module_list:
                for k, v in module.items():
                    if isinstance(v, str) and "hull" in v:
                        max_hp += module["effect"]["hull_hp"]
                    if isinstance(v, str) and "propulsion" in v:
                        max_movement += module["effect"]["bonus_mvt"]
            sector_data["pc"].append(
                {
                    "user": {
                        "user": data["user_id"],
                        "player": data["id"],
                        "name": data["name"],
                        "coordinates": data["coordinates"],
                        "image": data["image"],
                        "description": data["description"],
                        "is_npc": data["is_npc"],
                        "current_ap": data["current_ap"],
                        "max_ap": data["max_ap"],
                        "archetype_name": data["archetype_id__name"],
                        "archetype_data": data["archetype_id__data"],
                        "sector_name": data["sector_id__name"],
                    },
                    "faction": {
                        "name": data["faction_id__name"],
                    },
                    "ship": {
                        "name": data["playership__ship_id__name"],
                        "image": data["playership__ship_id__image"],
                        "max_hp": max_hp,
                        "current_hp": int(data["playership__current_hp"]),
                        "max_movement": max_movement,
                        "current_movement": int(data["playership__current_movement"]),
                        "current_ballistic_defense": data[
                            "playership__current_ballistic_defense"
                        ],
                        "current_thermal_defense": data[
                            "playership__current_thermal_defense"
                        ],
                        "current_missile_defense": data[
                            "playership__current_missile_defense"
                        ],
                        "current_cargo_size": data["playership__current_cargo_size"],
                        "status": data["playership__status"],
                        "description": data["playership__ship_id__description"],
                        "module_slot_available": data[
                            "playership__ship_id__module_slot_available"
                        ],
                        "modules": module_list,
                        "modules_range": GetDataFromDB.is_in_range(
                            sector_data["sector"]["id"], data["user_id"], is_npc=False
                        ),
                        "ship_scanning_module_available": True if len([e['name'] for e in module_list if e['name'] == "spaceship probe"]) > 0 else False,
                        "category_name": data[
                            "playership__ship_id__ship_category__name"
                        ],
                        "category_description": data[
                            "playership__ship_id__ship_category__description"
                        ],
                        "size": data["playership__ship_id__ship_category__ship_size"],
                        "is_reversed": data["playership__is_reversed"],
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
            "coord_x": int(pos["end_x"]),
            "coord_y": int(pos["end_y"]),
        }

        player_position[found_player_index]["ship"]["current_movement"] -= pos[
            "move_cost"
        ]

        for player in player_position:
            if player["user"]["player"] == found_player["user"]["player"]:
                if player["user"]["coordinates"]["coord_y"] != int(
                    pos["end_y"]
                ) or player["user"]["coordinates"]["coord_x"] != int(pos["end_x"]):
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

    def get_user(self):
        user_array = []
        for key in cache.get(self.room)["users"]:
            if key["username"] == self.user_calling:
                user_array.append(key)
        return user_array

    def delete_user(self):
        in_cache = cache.get(self.room)
        in_cache["users"] = [
            key for key in in_cache["users"] if key["username"] != self.user_calling
        ]
        if not in_cache["selected_card"]["card_id"] is None:
            found_item = next(
                item
                for item in in_cache["cards"]
                if item["id"] == in_cache["selected_card"]["card_id"]
            )
            found_item_index = in_cache["cards"].index(found_item)
            in_cache["cards"][found_item_index]["is_displayed"] = False
            in_cache["cards"][found_item_index]["picked_up_by"] = ""

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
