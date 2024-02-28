import json
import os
from django.core import serializers
from recorp.settings import BASE_DIR
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
    Security
)


class GetMapDataFromDB:
    def __init__(self):
        pass

    @staticmethod
    def get_size():
        return [
            {"planet_data": {"size_x": 4, "size_y": 4}},
            {"station_data": {"size_x": 3, "size_y": 3}},
            {"asteroid_data": {"size_x": 1, "size_y": 1}}
        ]

    @staticmethod
    def get_fg_element_url(element):
        return os.listdir(
            os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", "foreground", element)
        )

    @staticmethod
    def get_bg_fg_url(bg_fg_choice):
        return os.listdir(
            os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", bg_fg_choice)
        )

    @staticmethod
    def get_map_size():
        return {"cols": 20, "rows": 15}

    @staticmethod
    def get_map_size_range():
        return {"cols": range(20), "rows": range(15)}

    @staticmethod
    def get_fg_type():
        return ["planet", "asteroid", "station"]

    @staticmethod
    def get_animation_queryset():
        return {
            "planet_data": json.loads(serializers.serialize("json", Planet.objects.all())),
            "asteroid_data": json.loads(serializers.serialize("json", Asteroid.objects.all())),
            "stations_data": json.loads(serializers.serialize("json", Station.objects.all()))
        }

    @staticmethod
    def get_resource_queryset():
        return Resource.objects.all()

    @staticmethod
    def get_table(table_name):
        return {
            "planet": [Planet, PlanetResource],
            "asteroid": [Asteroid, AsteroidResource],
            "station": [Station, StationResource],
            "faction": [Faction, FactionResource],
            "security": Security,
        }[table_name]


