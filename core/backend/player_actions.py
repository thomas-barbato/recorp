import json
import os
from django.core import serializers
from recorp.settings import BASE_DIR
from django.contrib.auth.models import User
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
)


class PlayerAction:
    def __init__(self, id):
        self.id = id
        self.player = Player.objects.filter(user_id=id).all()
        self.player_id = self.get_player_id()

    def is_player_exists(self, player_id):
        return Player.objects.filter(id=player_id, user_id=self.id).exists()

    def get_player_id(self):
        return Player.objects.filter(user_id=self.id).values_list("id", flat=True)[0]

    def get_player_faction(self):
        return Player.objects.filter(user_id=self.id).values_list(
            "faction_id", flat=True
        )[0]

    def get_player_sector(self):
        return Player.objects.filter(user_id=self.id).values_list(
            "sector_id", flat=True
        )[0]

    def get_coord(self):
        return Player.objects.filter(user_id=self.id).values_list(
            "coordinates", flat=True
        )[0]

    def get_other_player_name(self, other_player_id):
        return Player.objects.filter(id=other_player_id).values_list("name", flat=True)[
            0
        ]

    def get_other_player_user_id(self, other_player_id):
        return Player.objects.filter(id=other_player_id).values_list(
            "user_id", flat=True
        )[0]

    def get_other_player_coord(self, other_player_id):
        return Player.objects.filter(id=other_player_id).values_list(
            "coordinates", flat=True
        )[0]

    def destination_already_occupied(self, end_x, end_y):
        return Player.objects.filter(
            coordinates__contains={"coord_x": end_x, "coord_y": end_y}
        ).exists()

    def get_reverse_ship_status(self):
        return PlayerShip.objects.filter(
            player_id=self.player_id, is_current_ship=True
        ).values_list("is_reversed", flat=True)[0]

    def get_other_player_movement(self, other_player_id):
        return PlayerShip.objects.filter(
            player_id=other_player_id, is_current_ship=True
        ).values_list("max_movement", flat=True)[0]

    def get_other_player_movement_remaining(self, other_player_id):
        return PlayerShip.objects.filter(
            player_id=other_player_id, is_current_ship=True
        ).values_list("current_movement", flat=True)[0]
    
    def set_reverse_ship_status(self):
        playership_reverse_status = PlayerShip.objects.filter(
            player_id=self.player_id, is_current_ship=True
        )
        playership_reverse_status.update(
            is_reversed=(
                True
                if playership_reverse_status.values_list("is_reversed", flat=True)[0]
                == False
                else False
            )
        )

    def __check_if_player_can_move_and_update(self, move_cost):
        playership_movement_value = PlayerShip.objects.filter(
            player_id=self.player_id,
            is_current_ship=True,
            current_movement__gte=move_cost,
        )
        if playership_movement_value.exists():
            current_movement_value = playership_movement_value.values_list(
                "current_movement", flat=True
            )[0]
            if (current_movement_value - move_cost) >= 0:
                playership_movement_value.update(
                    current_movement=current_movement_value - move_cost
                )
                return True

    def move_have_been_registered(self, end_x, end_y, move_cost):
        if self.__check_if_player_can_move_and_update(move_cost) is True:
            Player.objects.filter(user_id=self.id).update(
                coordinates={"coord_x": end_x, "coord_y": end_y}
            )
            return True
        