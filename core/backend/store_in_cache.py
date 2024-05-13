import datetime
import json
import logging
from django.core.cache import cache
from django.contrib.auth.models import User
from core.backend.get_data import GetMapDataFromDB
from core.models import (
    Sector,
    Player,
)


class StoreInCache:
    def __init__(self, room_name, user_calling):
        self.room = room_name
        self.sector_pk = self.room.split("_")[1]
        self.user_calling = user_calling

    def get_or_set_cache(self):
        if not cache.get(self.room):
            self.set_sector_data(self.sector_pk)
        return cache.get(self.room)

    def set_sector_data(self, pk):
        planets, asteroids, stations = GetMapDataFromDB.get_items_from_sector(
            self.sector_pk
        )
        foreground_table_set = {
            "planet": planets,
            "asteroid": asteroids,
            "station": stations,
        };
        sector_pc_npc = GetMapDataFromDB.get_pc_npc_from_sector(self.sector_pk);
        sector = Sector.objects.get(id=pk);
        sector_data = dict();
        sector_data["sector_element"] = [];
        sector_data["pc_npc"] = [];

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
                element, _ = GetMapDataFromDB.get_table(table_key)
                map_element = [
                    v
                    for k, v in element.objects.filter(name=table.source.name)
                    .values_list("data", flat=True)[0]
                    .items()
                    if v != "none"
                ]
                
                resource_quantity = GetMapDataFromDB.get_resource_quantity_value(
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
                            "translated_quantity_str": resource_quantity
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
                        "size": GetMapDataFromDB.get_specific_size(map_element[0]),
                    }
                )
                
        for data in sector_pc_npc:
            sector_data["pc_npc"].append(
                {
                    "user": {
                        "user": data["user_id"],
                        "player": data["id"],
                        "name": data["name"],
                        "coordinates": data["coordinates"],
                        "image": data["image"],
                        "description": data["description"],
                        "is_npc": data["is_npc"],
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
                        "description": data["playership__ship_id__description"],
                        "module_slot_available": data[
                            "playership__ship_id__module_slot_available"
                        ],
                        "category_name": data[
                            "playership__ship_id__ship_category__name"
                        ],
                        "category_description": data[
                            "playership__ship_id__ship_category__description"
                        ],
                        "max_speed": data[
                            "playership__ship_id__ship_category__max_speed"
                        ],
                        "size": data["playership__ship_id__ship_category__ship_size"],
                        "is_reversed": False,
                    },
                }
            )
        cache.set(self.room, sector_data)

    def update_player_position(self, pos):
        in_cache = cache.get(self.room)
        player_position = in_cache["pc_npc"]
        player = pos["player"]
        try:
            found_player = next(
                p
                for p in player_position
                if player == p["user"]["player"]
            )
            
        except StopIteration:
            return
        
        found_player_index = player_position.index(found_player)
        player_position[found_player_index]["user"]["coordinates"] = {
            "coord_x" : int(pos["end_x"]), "coord_y" : int(pos["end_y"])
        }
        
        in_cache["pc_npc"] = player_position
        cache.set(self.room, in_cache)  
        
    def update_ship_is_reversed(self, data, user_id):
        in_cache = cache.get(self.room)
        pc_cache = in_cache["pc_npc"]
        user = data["user"]
        
        try:
            player = next(
                p
                for p in pc_cache
                if user == p["user"]["user"]
            )
            
        except StopIteration:
            return
        
        player_index = pc_cache.index(player)
        ship_is_reversed = pc_cache[player_index]["ship"]["is_reversed"]
        
        if user == user_id:
            pc_cache[player_index]["ship"]["is_reversed"] = True if ship_is_reversed is False else False
            in_cache["pc_npc"] = pc_cache
            cache.set(self.room, in_cache)
        
        return ship_is_reversed
            

    def get_cardname_by_id(self, cards):
        in_cache = cache.get(self.room)["cards"]
        found_card = [
            key["short_name"].split("_")[0] for key in in_cache if key["id"] in cards
        ]

        if found_card:
            return found_card[0] == found_card[1] if len(found_card) >= 2 else False

    def set_user_score(self, username):
        in_cache = cache.get(self.room)
        user_value = in_cache["users"]
        found_item = next(item for item in user_value if item["username"] == self.user_calling)
        found_item_index = user_value.index(found_item)

        if self.user_calling == username:
            user_value[found_item_index]["points"] += 5
            in_cache["users"] = user_value
            in_cache["pairs_found"] += 1
            cache.set(self.room, in_cache)
            return (
                in_cache["users"][found_item_index]["points"],
                in_cache["pairs_found"],
                in_cache["users"][found_item_index]["username"],
            )
        else:
            return (
                in_cache["users"][found_item_index]["points"] + 5,
                in_cache["pairs_found"] + 1,
                in_cache["users"][found_item_index]["username"],
            )

    def add_user(self):
        in_cache = cache.get(self.room)
        user_list = in_cache["users"]
        if not [key for key in user_list if key["username"] == self.user_calling]:
            user_list.append(
                {
                    "username": self.user_calling,
                    "points": 0,
                    "created_date": self.get_datetime_json(datetime.datetime.now()),
                }
            )
            in_cache["users"] = user_list

            cache.set(self.room, in_cache)

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

    def get_all_users(self):
        return sorted(
            [key for key in cache.get(self.room)["users"]],
            key=lambda d: d["created_date"],
        )

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

    def update_cache_reload(self):
        in_cache = cache.get(self.room)

        if in_cache["have_been_reloaded"] == 0:
            final_cards = []
            for index, card in enumerate(""):
                card["id"] = index
                final_cards.append(card)
            in_cache["cards"] = final_cards
            in_cache["users"] = [
                {
                    "username": key["username"],
                    "points": 0,
                    "created_date": key["created_date"],
                }
                for key in in_cache["users"]
            ]
            in_cache["current_position"] = 0
            in_cache["pairs_found"] = 0
            in_cache["have_been_reloaded"] = 1
            in_cache["selected_card"] = {"card_id": None, "username": None}
            in_cache["best_player"] = {"username": "", "points": 0}

            cache.set(self.room, in_cache)

        return cache.get(self.room)

    def delete_cache_reload(self):
        in_cache = cache.get(self.room)

        if in_cache["have_been_reloaded"] == 1:
            in_cache["have_been_reloaded"] = 0
            cache.set(self.room, in_cache)
