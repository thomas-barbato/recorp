import json
import os
from django.core import serializers
from recorp.settings import BASE_DIR
from django.contrib.auth.models import User
from django.db.models import Q
from core.models import (
    Planet,
    Asteroid,
    Station,
    Resource,
    PlanetResource,
    AsteroidResource,
    StationResource,
    Faction,
    FactionResource,
    Security,
    Sector,
    Player,
    PlayerShip,
    PlayerShipResource,
    Ship,
    ShipCategory,
    Skill,
    Npc,
    NpcTemplateResource,
    NpcTemplate,
    NpcTemplateSkill,
    Module,
)


class GetDataFromDB:
    def __init__(self):
        pass

    @staticmethod
    def get_size():
        return [
            {"planet_data": {"size_x": 4, "size_y": 4}},
            {"station_data": {"size_x": 3, "size_y": 3}},
            {"asteroid_data": {"size_x": 1, "size_y": 1}},
            {"satellite_data": {"size_x": 3, "size_y": 3}},
            {"blackhole_data": {"size_x": 5, "size_y": 3}},
            {"star_data": {"size_x": 2, "size_y": 2}},
        ]

    @staticmethod
    def get_specific_size(element):
        return {
            "planet": {"size_x": 4, "size_y": 4},
            "station": {"size_x": 3, "size_y": 3},
            "asteroid": {"size_x": 1, "size_y": 1},
            "satellite": {"size_x": 3, "size_y": 3},
            "blackhole": {"size_x": 5, "size_y": 3},
            "star": {"size_x": 2, "size_y": 2},
        }[element]

    @staticmethod
    def get_fg_element_url(element):
        return os.listdir(
            os.path.join(
                BASE_DIR,
                "recorp",
                "static",
                "img",
                "atlas",
                "foreground",
                element,
            )
        )

    @staticmethod
    def get_bg_fg_url(bg_fg_choice):
        return os.listdir(
            os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", bg_fg_choice)
        )

    @staticmethod
    def get_map_size():
        return {"cols": 40, "rows": 40}

    @staticmethod
    def get_map_size_range():
        return {"cols": range(40), "rows": range(40)}

    @staticmethod
    def get_resolution_sized_map(device_type):
        return {
            "is_pc": {"col": 20, "row": 16},
            "is_mobile": {"col": 11, "row": 11},
            "is_tablet": {"col": 20, "row": 20},
        }[device_type]

    @staticmethod
    def get_fg_type():
        return [
            "planet",
            "asteroid",
            "station",
            "blackhole",
            "star",
            "satellite",
        ]

    @staticmethod
    def get_animation_queryset():
        return {
            "planet_data": json.loads(
                serializers.serialize(
                    "json",
                    Planet.objects.filter(data__contains={"type": "planet"}),
                )
            ),
            "satellite_data": json.loads(
                serializers.serialize(
                    "json",
                    Planet.objects.filter(data__contains={"type": "satellite"}),
                )
            ),
            "blackhole_data": json.loads(
                serializers.serialize(
                    "json",
                    Planet.objects.filter(data__contains={"type": "blackhole"}),
                )
            ),
            "star_data": json.loads(
                serializers.serialize(
                    "json",
                    Planet.objects.filter(data__contains={"type": "star"}),
                )
            ),
            "asteroid_data": json.loads(
                serializers.serialize("json", Asteroid.objects.all())
            ),
            "stations_data": json.loads(
                serializers.serialize("json", Station.objects.all())
            ),
        }

    @staticmethod
    def serialize_queryset(queryset):
        return json.loads(serializers.serialize("json", queryset))

    @staticmethod
    def get_resource_queryset():
        return Resource.objects.all()

    @staticmethod
    def get_table(table_name):
        return {
            "satellite": [Planet, PlanetResource],
            "star": [Planet, PlanetResource],
            "blackhole": [Planet, PlanetResource],
            "planet": [Planet, PlanetResource],
            "asteroid": [Asteroid, AsteroidResource],
            "station": [Station, StationResource],
            "faction": [Faction, FactionResource],
            "player": [User, Player, PlayerShipResource],
            "npc": [Npc, NpcTemplate, NpcTemplateResource, NpcTemplateSkill],
            "resource": Resource,
            "ship": Ship,
            "security": Security,
            "sector": Sector,
            "skill": Skill,
            "module": Module,
        }[table_name]

    @staticmethod
    def count_foreground_item_in_map(map_pk):
        return len(
            [
                v
                for k, v in Sector.objects.filter(id=map_pk)
                .values(
                    "planet_sector__sector_id",
                    "asteroid_sector__sector_id",
                    "station_sector__sector_id",
                )[0]
                .items()
                if v is not None
            ]
        )

    @staticmethod
    def check_if_table_pk_exists(table, pk):
        this_table = GetDataFromDB.get_table(table)
        return this_table.objects.filter(id=pk).exists()

    @staticmethod
    def remove_map(map_pk):
        Sector.objects.filter(id=map_pk).delete()

    @staticmethod
    def delete_items_from_sector(pk):
        sector = Sector.objects.get(id=pk)
        sector.planet_sector.all().delete()
        sector.asteroid_sector.all().delete()
        sector.station_sector.all().delete()

    @staticmethod
    def get_items_from_sector(pk):
        sector = Sector.objects.get(id=pk)
        return (
            sector.planet_sector.all(),
            sector.asteroid_sector.all(),
            sector.station_sector.all(),
        )

    @staticmethod
    def get_pc_from_sector(pk):
        return (
            Player.objects.filter(sector_id=pk)
            .select_related("playershipmodule")
            .values(
                "id",
                "name",
                "coordinates",
                "image",
                "description",
                "is_npc",
                "user_id",
                "current_ap",
                "max_ap",
                "faction_id__name",
                "archetype_id__name",
                "archetype_id__data",
                "sector_id__name",
                "playership__ship_id__name",
                "playership__ship_id__image",
                "playership__ship_id__description",
                "playership__is_current_ship",
                "playership__is_reversed",
                "playership__module_id_list",
                "playership__current_hp",
                "playership__max_hp",
                "playership__current_movement",
                "playership__max_movement",
                "playership__current_missile_defense",
                "playership__current_ballistic_defense",
                "playership__current_thermal_defense",
                "playership__current_cargo_size",
                "playership__status",
                "playership__ship_id__module_slot_available",
                "playership__ship_id__ship_category__name",
                "playership__ship_id__ship_category__description",
                "playership__ship_id__ship_category__ship_size",
            ),
            Npc.objects.filter(sector_id=pk).values(
                "id",
                "coordinates",
                "status",
                "hp",
                "npc_template_id__max_hp",
                "movement",
                "npc_template_id__max_movement",
                "ballistic_defense",
                "npc_template_id__max_ballistic_defense",
                "thermal_defense",
                "npc_template_id__max_thermal_defense",
                "missile_defense",
                "npc_template_id__max_missile_defense",
                "npc_template_id__module_id_list",
                "npc_template_id__difficulty",
                "npc_template_id__name",
                "npc_template_id__id",
                "faction_id__name",
                "npc_template_id__ship_id__image",
                "npc_template_id__ship_id__ship_category_id__ship_size",
                "npc_template_id__ship_id__ship_category_id__name",
                "npc_template_id__ship_id__ship_category_id__description",
                "npc_template_id__ship_id__name",
            ),
        )

    @staticmethod
    def get_npc_template_data(pk):
        template = [
            entry
            for entry in NpcTemplate.objects.filter(id=pk).values(
                "id",
                "name",
                "difficulty",
                "module_id_list",
                "max_hp",
                "max_movement",
                "max_missile_defense",
                "max_thermal_defense",
                "max_ballistic_defense",
                "hold_capacity",
                "behavior",
                "ship_id",
                "ship_id__image",
            )
        ]
        skills = [
            entry
            for entry in NpcTemplateSkill.objects.filter(npc_template_id=pk).values(
                "skill_id", "skill__name", "level"
            )
        ]
        resources = [
            entry
            for entry in NpcTemplateResource.objects.filter(npc_template_id=pk).values(
                "npc_template_id",
                "resource_id",
                "quantity",
                "can_be_randomized",
            )
        ]
        return (template, skills, resources)

    @staticmethod
    def check_if_no_missing_entry(data, data_item=None):
        missing_data = []
        for d_key, d_value in data.items():
            if (
                not d_value
                and d_value is not False
                or d_value == "none"
                or d_value == ""
            ):
                missing_data.append(d_key)

        if data_item:
            for i in data_item:
                for d_key, d_value in data_item[i].items():
                    if (
                        not d_value
                        and d_value is not False
                        or d_value == "none"
                        or d_value == ""
                    ):
                        missing_data.append(f"{d_key} (ITEM #{int(i)+1})")
        if len(missing_data) > 0:
            return True, missing_data
        else:
            return False, []

    @staticmethod
    def get_resource_quantity_value(value, max_value):
        result_value = 100 * (value / max_value)
        if max_value == value:
            result = "full"
        elif result_value >= 75.0 and result_value < 100.0:
            result = "above average"
        elif result_value >= 50.0 and result_value < 75.0:
            result = "average"
        elif result_value > 25.0 and result_value < 50.0:
            result = "below average"
        elif result_value > 0.0 and result_value <= 25.0:
            result = "depleted"
        elif value == 0:
            result = "empty"
        return result

    @staticmethod
    def get_template_data():
        # Use list to be able to use join and serialize...
        return list(
            NpcTemplate.objects.values(
                "id",
                "name",
                "ship_id__image",
                "max_hp",
                "max_movement",
                "difficulty",
                "max_missile_defense",
                "max_thermal_defense",
                "max_ballistic_defense",
                "behavior",
            )
        )

    @staticmethod
    def get_selected_ship_data(template_id):
        ship_id = NpcTemplate.objects.filter(id=template_id).values_list(
            "ship_id", flat=True
        )[0]
        return Ship.objects.filter(id=ship_id).values(
            "id", "name", "image", "ship_category_id__ship_size"
        )[0]

    @staticmethod
    def get_related_npc_on_sector_data(sector_id):
        # Use list to be able to use join and serialize...
        return list(
            Npc.objects.filter(sector_id=sector_id).values(
                "id",
                "coordinates",
                "npc_template_id__id",
                "npc_template_id__name",
                "npc_template_id__ship_id__image",
                "npc_template_id__ship_id__ship_category_id__ship_size",
                "npc_template_id__ship_id__name",
            )
        )

    @staticmethod
    def is_in_range(sector_id, current_user_id, is_npc = False):

        if is_npc is False:
            
            current_player = list(
                PlayerShip.objects.filter(
                    player_id__user_id=current_user_id, is_current_ship=True
                ).values(
                    "id",
                    "module_id_list",
                    "ship_id__ship_category_id__ship_size",
                    "player_id__coordinates",
                )
            )[0]
            current_player_module = list(
                Module.objects.filter(
                    (
                        Q(id__in=current_player["module_id_list"]) & Q(effect__has_key="range")
                    )
                ).values("id", "effect", "type"),
            )
            current_player_size_x = int(
                current_player["ship_id__ship_category_id__ship_size"]["size_x"]
            )
            current_player_size_y = int(
                current_player["ship_id__ship_category_id__ship_size"]["size_y"]
            )
            current_player_x = int(current_player["player_id__coordinates"]["coord_x"])
            current_player_y = int(current_player["player_id__coordinates"]["coord_y"])
            
        else:
            
            current_player = list(
                Npc.objects.filter(
                    id=current_user_id
                ).values(
                    "id",
                    "npc_template_id__module_id_list",
                    "npc_template_id__ship_id__ship_category_id__ship_size",
                    "coordinates",
                )
            )[0]
            current_player_module = list(
                Module.objects.filter(
                    (
                        Q(id__in=current_player["npc_template_id__module_id_list"]) & Q(effect__has_key="range")
                    )
                ).values("id", "effect", "type"),
            )
            current_player_size_x = int(
                current_player["npc_template_id__ship_id__ship_category_id__ship_size"]["size_x"]
            )
            current_player_size_y = int(
                current_player["npc_template_id__ship_id__ship_category_id__ship_size"]["size_y"]
            )
            current_player_x = int(current_player["coordinates"]["x"])
            current_player_y = int(current_player["coordinates"]["y"])

        sector_element_dict = {
            "pc": list(
                PlayerShip.objects.filter(
                    player_id__sector_id=sector_id, is_current_ship=True
                )
                .exclude(player_id__user_id=current_user_id)
                .values(
                    "id",
                    "player_id__coordinates",
                    "ship_id__ship_category_id__ship_size",
                )
            ),
            "npc": Npc.objects.filter(sector_id=sector_id).values(
                "id",
                "coordinates",
                "npc_template_id__ship_id__ship_category_id__ship_size",
            ),
            "asteroid": AsteroidResource.objects.filter(sector_id=sector_id).values(
                "id", "data", "source_id__size"
            ),
            "station": StationResource.objects.filter(sector_id=sector_id).values(
                "id", "data", "source_id__size"
            ),
            "other_element": PlanetResource.objects.filter(sector_id=sector_id).values(
                "id", "data", "source_id__size"
            ),
        }

        result_dict = {}

        sector_element_data_key = {
            "pc": {
                "size": {
                    "index": "ship_id__ship_category_id__ship_size",
                    "x": "size_x",
                    "y": "size_y",
                },
                "coord": {
                    "index": "player_id__coordinates",
                    "x": "coord_x",
                    "y": "coord_y",
                },
            },
            "npc": {
                "size": {
                    "index": "npc_template_id__ship_id__ship_category_id__ship_size",
                    "x": "size_x",
                    "y": "size_y",
                },
                "coord": {"index": "coordinates", "x": "x", "y": "y"},
            },
            "other_element": {
                "size": {
                    "index": "source_id__size",
                    "x": "size_x",
                    "y": "size_y",
                },
                "coord": {"index": "data", "x": "coord_x", "y": "coord_y"},
            },
        }

        for index, value in sector_element_dict.items():

            element = None
            result_dict[index] = {}

            if index == "asteroid" or index == "station" or index == "other_element":
                element = sector_element_data_key["other_element"]
            else:
                element = sector_element_data_key[index]

            for item in value:
                element_entire_pos = []

                element_size_x = int(
                    item[element["size"]["index"]][element["size"]["x"]]
                )
                element_size_y = int(
                    item[element["size"]["index"]][element["size"]["y"]]
                )

                element_coord_x = int(
                    item[element["coord"]["index"]][element["coord"]["x"]]
                )
                element_coord_y = int(
                    item[element["coord"]["index"]][element["coord"]["y"]]
                )

                element_start_y = (
                    (element_coord_y - element_size_y)
                    if (element_coord_y - element_size_y) > 0
                    else 0
                )
                element_end_y = (
                    (element_coord_y + element_size_y)
                    if (element_coord_y + element_size_y) <= 39
                    else 39
                )
                element_start_x = (
                    (element_coord_x - element_size_x)
                    if (element_coord_x - element_size_x) > 0
                    else 0
                )
                element_end_x = (
                    (element_coord_x + element_size_x)
                    if (element_coord_x + element_size_x) <= 39
                    else 39
                )

                for y in range(element_start_y, element_end_y, 1):
                    for x in range(element_start_x, element_end_x, 1):
                        element_entire_pos.append(f"{y}_{x}")

                for module in current_player_module:

                    module_id = module["id"]
                    module_range = int(module["effect"]["range"])
                    module_effect_is_in_range = False
                    module_type = module["type"]

                    current_player_start_y = (
                        (current_player_y - module_range - current_player_size_y)
                        if (current_player_y - module_range - current_player_size_y)
                        > 0
                        else 0
                    )
                    current_player_end_y = (
                        (current_player_y + module_range + current_player_size_y)
                        if (current_player_y + module_range + current_player_size_y)
                        <= 39
                        else 39
                    )
                    current_player_start_x = (
                        (current_player_x - module_range - current_player_size_x)
                        if (current_player_x - module_range - current_player_size_x)
                        > 0
                        else 0
                    )
                    current_player_end_x = (
                        (current_player_x + module_range + current_player_size_x)
                        if (current_player_x + module_range + current_player_size_x)
                        <= 39
                        else 39
                    )

                    for y in range(current_player_start_y, current_player_end_y, 1):
                        for x in range(current_player_start_x, current_player_end_x, 1):
                            if f"{y}_{x}" in element_entire_pos:
                                module_effect_is_in_range = True
                                break
                    
                    can_be_added_to_dict = False
                    
                    if index == "asteroid" or index == "station" or index == "other_element":
                        if module_type != "WEAPONRY" and module_type != "ELECTRONIC_WARFARE":
                            can_be_added_to_dict = True
                    else:
                        if module_type == "WEAPONRY" or module_type == "ELECTRONIC_WARFARE":
                            can_be_added_to_dict = True
                        
                    if can_be_added_to_dict:
                        result_dict[index][item["id"]] = []
                        result_dict[index][item["id"]].append(
                            {
                                "target_id": item["id"],
                                "module_id": module_id,
                                "type": module_type,
                                "is_in_range": module_effect_is_in_range,
                            }
                        )

        return result_dict
