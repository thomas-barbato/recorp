import json
import pprint
import os
from django.core import serializers
from recorp.settings import BASE_DIR
from django.contrib.auth.models import User
from django.db.models import Q
from core.models import (
    Planet,
    Asteroid,
    Station,
    Warp,
    WarpZone,
    SectorWarpZone,
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
            {"planet_data": {"x": 4, "y": 4}},
            {"station_data": {"x": 3, "y": 3}},
            {"asteroid_data": {"x": 1, "y": 1}},
            {"satellite_data": {"x": 3, "y": 3}},
            {"blackhole_data": {"x": 5, "y": 3}},
            {"star_data": {"x": 2, "y": 2}},
            {"warpzone_data": {"x": 2, "y": 3}},
        ]

    @staticmethod
    def get_specific_size(element):
        return {
            "planet": {"x": 4, "y": 4},
            "station": {"x": 3, "y": 3},
            "asteroid": {"x": 1, "y": 1},
            "satellite": {"x": 3, "y": 3},
            "blackhole": {"x": 5, "y": 3},
            "star": {"x": 2, "y": 2},
            "warpzone": {"x": 2, "y": 3},
        }[element]

    @staticmethod
    def get_fg_element_url(element):
        return os.listdir(
            os.path.join(
                BASE_DIR,
                "recorp",
                "static",
                "img",
                "foreground",
                element,
            )
        )

    @staticmethod
    def get_bg_fg_url(bg_fg_choice):
        return os.listdir(
            os.path.join(BASE_DIR, "recorp", "static", "img", bg_fg_choice)
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
            "is_mobile": {"col": 10, "row": 10},
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
            "warpzone",
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
            "warpzone_data": json.loads(
                serializers.serialize("json", Warp.objects.all())
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
            "warpzone": [Warp, WarpZone, SectorWarpZone],
            "warpzone_only": WarpZone,
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
        Npc.objects.filter(Sector=map_pk).delete()

    @staticmethod
    def delete_items_from_sector(pk):
        sector = Sector.objects.get(id=pk)
        sector.planet_sector.all().delete()
        sector.asteroid_sector.all().delete()
        sector.station_sector.all().delete()
        sector.warp_sector.all().delete()
        sector.npc_sector.all().delete()

    @staticmethod
    def get_items_from_sector(pk, with_npc=False):
        sector = Sector.objects.get(id=pk)
        if with_npc:
            player_id_list = Player.objects.filter(sector_id=pk).values("id")
            return (
                sector.planet_sector.values(
                    "source_id__size", "data", "coordinates", "id", "source_id", "source_id__data__type"
                ),
                sector.asteroid_sector.values(
                    "source_id__size", "data", "coordinates", "id", "source_id", "source_id__data__type"
                ),
                sector.station_sector.values(
                    "source_id__size", "data", "coordinates", "id", "source_id", "source_id__data__type"
                ),
                sector.warp_sector.values(
                    "source_id__size", "data", "coordinates", "source_id", "id", "sector_id"
                ),
                sector.npc_sector.values(
                    "id",
                    "npc_template_id__ship_id__ship_category_id__size",
                    "npc_template_id__ship_id__image",
                    "npc_template_id__ship_id__name",
                    "npc_template_id",
                    "coordinates", 
                ),
                PlayerShip.objects.filter(
                    player_id__in=player_id_list,
                    is_current_ship=True,
                ).values(
                    "ship_id__ship_category_id__size",
                    "player_id__coordinates",
                )
            )

        return (
            sector.planet_sector.all(),
            sector.asteroid_sector.all(),
            sector.station_sector.all(),
            sector.warp_sector.all(),
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
                "playership__ship_id__ship_category__size",
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
                "npc_template_id__ship_id__ship_category_id__size",
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
            if not d_value and d_value is not False or d_value == "":
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
        return NpcTemplate.objects.filter(id=template_id).values(
            "id", "ship_id", "ship_id__name", "ship_id__image", "ship_id__ship_category_id__size"
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
                "npc_template_id__ship_id__ship_category_id__size",
                "npc_template_id__ship_id__name",
            )
        )

    @staticmethod
    def is_in_range(sector_id, current_user_id, is_npc=False):
        result_dict = {}
        player_zone_range = []
        current_size = None

        index_foreground_element = ["other_element", "asteroid", "warpzone", "station"]
        index_pc_npc = ["pc", "npc"]
        index_module_type = ["WEAPONRY", "ELECTRONIC_WARFARE"]

        current_player_x = 0
        current_player_y = 0

        if is_npc is False:

            current_player = [e for e in PlayerShip.objects.filter(
                    player_id__user_id=current_user_id, is_current_ship=True
                ).values(
                    "id",
                    "module_id_list",
                    "ship_id__ship_category_id__size",
                    "player_id__coordinates",
                )][0]
            current_player_module = [e for e in Module.objects.filter(
                    (
                        Q(id__in=current_player["module_id_list"])
                        & Q(effect__has_key="range")
                    )
                ).values("id", "effect", "type")]
            player_size_x = int(current_player["ship_id__ship_category_id__size"]["x"])
            player_size_y = int(current_player["ship_id__ship_category_id__size"]["y"])

            current_size = {
                "x": player_size_x,
                "y": player_size_y,
            }

            if current_player.get("player_id__coordinates"):
                # a npc
                if current_player["player_id__coordinates"].get("x"):
                    current_player_x = int(
                        current_player["player_id__coordinates"]["x"]
                    )
                    current_player_y = int(
                        current_player["player_id__coordinates"]["y"]
                    )
                else:
                    # not a player or a npc
                    current_player_x = int(
                        current_player["player_id__coordinates"]["x"]
                    )
                    current_player_y = int(
                        current_player["player_id__coordinates"]["y"]
                    )

        else:

            current_player = [e for e in Npc.objects.filter(id=current_user_id).values(
                    "id",
                    "npc_template_id__module_id_list",
                    "npc_template_id__ship_id__ship_category_id__size",
                    "coordinates",
                )][0]
            current_player_module = [e for e in Module.objects.filter(
                    (
                        Q(id__in=current_player["npc_template_id__module_id_list"])
                        & Q(effect__has_key="range")
                    )
                ).values("id", "effect", "type")]

            npc_size_x = int(
                current_player["npc_template_id__ship_id__ship_category_id__size"]["x"]
            )
            npc_size_y = int(
                current_player["npc_template_id__ship_id__ship_category_id__size"]["y"]
            )

            current_size = {
                "x": npc_size_x,
                "y": npc_size_y,
            }

            current_player_x = int(current_player["coordinates"]["x"])
            current_player_y = int(current_player["coordinates"]["y"])
        sector_element_dict = {
            "pc": [e for e in PlayerShip.objects.filter(
                    player_id__sector_id=sector_id, is_current_ship=True
                )
                .exclude(player_id__user_id=current_user_id)
                .values(
                    "id",
                    "player_id__coordinates",
                    "ship_id__ship_category_id__size",
                )],
            "npc": [e for e in Npc.objects.filter(sector_id=sector_id).values(
                "id",
                "coordinates",
                "npc_template_id__ship_id__ship_category_id__size",
            )],
            "asteroid": [e for e in AsteroidResource.objects.filter(sector_id=sector_id).values(
                "id", "source_id__size", "coordinates", "data__name"
            )],
            "station": [e for e in StationResource.objects.filter(sector_id=sector_id).values(
                "id", "source_id__size", "coordinates", "data__name"
            )],
            "warpzone": [e for e in WarpZone.objects.filter(sector_id=sector_id).values(
                "id", "source_id__size", "coordinates", "data__name"
            )],
            "other_element": [e for e in PlanetResource.objects.filter(sector_id=sector_id).values(
                "id", "source_id__size", "coordinates", "data__name"
            )],
        }
        for index, _ in sector_element_dict.items():
            result_dict[index] = []
            for item in sector_element_dict[index]:
                for module in current_player_module:
                    if module['type'] in index_module_type:
                        module_id = module["id"]
                        module_range = int(module["effect"]["range"])
                        module_type = module["type"]
                        module_effect_is_in_range = False
                        
                        current_player_start_x = 0
                        current_player_start_y = 0
                        element_start_x = 0
                        element_start_y = 0

                        if current_size["x"] > 1:
                            current_player_start_x = current_player_x - module_range
                            current_player_end_x = (
                                current_player_x + module_range + current_size["x"]
                            )
                        else:
                            current_player_start_x = current_player_x - module_range
                            current_player_end_x = current_player_x + module_range + 1

                        if current_size["y"] > 1:
                            current_player_start_y = current_player_y - module_range
                            current_player_end_y = (
                                current_player_y + module_range + current_size["y"]
                            )
                        else:
                            current_player_start_y = current_player_y - module_range
                            current_player_end_y = current_player_y + module_range + 1

                        player_zone_range = [
                            f"{y}_{x}"
                            for y in range(current_player_start_y, current_player_end_y)
                            for x in range(current_player_start_x, current_player_end_x)
                        ]
                        
                        current_player_start_x = current_player_start_x if current_player_start_x >= 0 else 0
                        current_player_end_x = current_player_end_x if current_player_end_x <= 39 else 39
                        current_player_start_y = current_player_start_y if current_player_start_y >= 0 else 0
                        current_player_end_y = current_player_end_y if current_player_end_y <= 39 else 39

                        if index == "npc":
                            element_size_x = int(
                                item["npc_template_id__ship_id__ship_category_id__size"]["x"]
                            )
                            element_size_y = int(
                                item["npc_template_id__ship_id__ship_category_id__size"]["y"]
                            )
                            element_start_x = int(
                                item["coordinates"]["x"]
                            )
                            element_start_y = int(
                                item["coordinates"]["y"]
                            )

                        elif index == "pc":
                            element_size_x = int(
                                item["ship_id__ship_category_id__size"]["x"]
                            )
                            element_size_y = int(
                                item["ship_id__ship_category_id__size"]["y"]
                            )
                            element_start_x = int(
                                item["player_id__coordinates"]["x"]
                            )
                            element_start_y = int(
                                item["player_id__coordinates"]["y"]
                            )
                        else:
                            element_size_x = int(item["source_id__size"]["x"])
                            element_size_y = int(item["source_id__size"]["y"])
                            element_start_x = int(
                                item["source_id__size"]["x"]
                            )
                            element_start_y = int(
                                item["source_id__size"]["y"]
                            )
                        if element_size_y == 1 and element_size_x == 1:
                            if (
                                f"{element_start_y}_{element_start_x}"
                                in player_zone_range
                            ):
                                module_effect_is_in_range = True
                        else:
                            element_zone_range = [
                                f"{y}_{x}"
                                for y in range(
                                    element_start_y,
                                    element_start_y + element_size_y,
                                )
                                for x in range(
                                    element_start_x,
                                    element_start_x + element_size_x,
                                )
                            ]
                            if (
                                len(set(player_zone_range).intersection(element_zone_range))
                                > 0
                            ):
                                module_effect_is_in_range = True

                        data = {
                            "target_id": item["id"],
                            "module_id": module_id,
                            "type": module_type,
                            "name": item["data__name"] if item.get("data__name") else None,
                            "is_in_range": module_effect_is_in_range,
                        }
                        result_dict[index].append(data)  
        return result_dict
