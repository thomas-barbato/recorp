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
)

class PlayerAction:
    def __init__(self, id):
        self.id = id
        self.player = Player.objects.get(user_id=id)
    
    def is_player_exists(self, player_id):
        return Player.objects.filter(id=player_id, user_id=self.user_id).exists()
    
    def get_player_id(self):
        return self.player.id
        
    def get_coord(self):
        return self.player.coordinates
    
    def get_other_player_coord(self, id):
        return Player.objects.filter(id=id).values_list('coordinates', flat=True)[0]
    
    def destination_already_occupied(self, end_x, end_y):
        return Player.objects.filter(coordinates__contains={"coord_x": end_x, "coord_y": end_y}).exists()
    
    def move(self, end_x, end_y):
        if self.destination_already_occupied(end_x, end_y) is False:
            self.player.coordinates = {"coord_x": end_x, "coord_y": end_y}
            self.player.save()
    