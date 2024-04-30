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
    def __init__(self, user_id):
        self.player = Player.objects.get(user_id=user_id)
        
    def get_coord(self):
        return self.player.coordinates
    
    def destination_already_occupied(self, end_x, end_y):
        return Player.objects.filter(coordinates__contains={"coord_x": end_x, "coord_y": end_y}).exists()
    
    def move(self, end_x, end_y):
        if self.destination_already_occupied(end_x, end_y) is False:
            self.player.coordinates = {"coord_x": end_x, "coord_y": end_y}
            self.player.save()
    