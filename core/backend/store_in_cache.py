import datetime
import json
import logging
from django.core.cache import cache
from django.contrib.auth.models import User


class StoreInCache:
    def __init__(self, room_name, value=[]):
        self.room = room_name
        self.value = value

    def get_or_set_cache(self, current_language):
        if cache.get(self.room):
            return cache.get(self.room)
        cache.set(
            self.room,
            {
                "sector_id": self.room,
                "users": [],
                "messages": [],
            },
        )
        return cache.get(self.room)

    def set_selected_card(self):
        in_cache = cache.get(self.room)

        if any("id" in d for d in self.value):
            # if first card have been picked
            in_cache["selected_card"] = {
                "card_id": self.value["id"],
                "username": self.value["username"],
            }
        else:
            # if a second card have been picked
            # useless with 2 cards, but with 3 it may be workeable
            # because for the third card self.value["cards"][2]
            # valide_pair will be used.
            # need to be tested.
            in_cache["selected_card"] = {
                "card_id": self.value["cards"][1],
                "username": self.value["username"],
            }

        cache.set(self.room, in_cache)

    def get_selected_card(self):
        in_cache = cache.get(self.room)
        return in_cache["selected_card"]

    def update_cards(self, validate_pair=False, username=""):
        in_cache = cache.get(self.room)
        value = in_cache["cards"]

        if validate_pair is True:
            found_item = next(item for item in value if item["id"] == self.value["id"])
            found_item_index = value.index(found_item)
            value[found_item_index]["is_displayed"] = self.value["is_displayed"]
            value[found_item_index]["picked_up_by"] = self.value["username"]
            in_cache["cards"] = value
        else:
            found_item = [item for item in value if item["id"] in self.value["cards"]]
            for index in found_item:
                found_item_index = value.index(index)
                value[found_item_index]["is_displayed"] = False
                value[found_item_index]["picked_up_by"] = ""
                in_cache["cards"] = value

        cache.set(self.room, in_cache)

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
        found_item = next(item for item in user_value if item["username"] == self.value)
        found_item_index = user_value.index(found_item)

        if self.value == username:
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
        if not [key for key in user_list if key["username"] == self.value]:
            user_list.append(
                {
                    "username": self.value,
                    "points": 0,
                    "created_date": self.get_datetime_json(datetime.datetime.now()),
                }
            )
            in_cache["users"] = user_list

            cache.set(self.room, in_cache)

    def get_user(self):
        user_array = []
        for key in cache.get(self.room)["users"]:
            if key["username"] == self.value:
                user_array.append(key)
        return user_array

    def delete_user(self):
        in_cache = cache.get(self.room)
        in_cache["users"] = [
            key for key in in_cache["users"] if key["username"] != self.value
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
                "value": self.value,
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
