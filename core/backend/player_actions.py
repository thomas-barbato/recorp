import json
import os
from django.core import serializers
from recorp.settings import BASE_DIR
from django.contrib.auth.models import User
from core.backend.get_data import GetDataFromDB
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
    Warp,
    WarpZone,
    SectorWarpZone,
)


class PlayerAction:
    def __init__(self, id):
        self.id = id
        self.player = Player.objects.filter(user_id=id).all()
        self.player_id = self.get_player_id()

    def is_player_exists(self, player_id):
        return Player.objects.filter(id=player_id, user_id=self.id).exists()

    def get_player_id(self):
        return self.player.values_list("id", flat=True)[0]
    
    def get_player_sector_id(self):
        return self.player.values_list("sector_id", flat=True)[0]

    def get_player_faction(self):
        return self.player.values_list("faction_id", flat=True)[0]

    def get_player_sector(self):
        return self.player.values_list("sector_id", flat=True)[0]

    def get_coord(self):
        return self.player.values_list("coordinates", flat=True)[0]

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
        
    def get_spaceship_coord_and_size(self, other_player_id):
        return PlayerShip.objects.filter(
            player_id=other_player_id,
            is_current_ship=True
        ).values(
            'player_id__coordinates',
            'ship_id__ship_category_id__size'
        )[0]

    def destination_already_occupied(self, end_x, end_y):
        return Player.objects.filter(
            coordinates__contains={"x": end_x, "y": end_y}
        ).exists()

    def get_reverse_ship_status(self):
        return PlayerShip.objects.filter(
            player_id=self.player_id, is_current_ship=True
        ).values_list("is_reversed", flat=True)[0]

    def get_player_ship_size(self):
        return PlayerShip.objects.filter(
            player_id=self.player_id, is_current_ship=True
        ).values(
            "ship_id__ship_category_id__size",
        )[0]

    def get_other_player_movement(self, other_player_id):
        return PlayerShip.objects.filter(
            player_id=other_player_id, is_current_ship=True
        ).values_list("max_movement", flat=True)[0]

    def get_other_player_movement_remaining(self, other_player_id):
        return PlayerShip.objects.filter(
            player_id=other_player_id, is_current_ship=True
        ).values_list("current_movement", flat=True)[0]
        
    def set_player_sector(self, sector_id, coordinates):
        Player.objects.filter(
            id=self.player_id
        ).update(
            sector_id=sector_id,
            coordinates=coordinates
        )
    
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
                coordinates={"x": end_x, "y": end_y}
            )
            return True
        
    def __coord_exists(self, target_list, y, x):
        print([i for i in target_list if i['y'] == y and i['x'] == x])
    
    def player_travel_to_destination(self, warpzone_home_name, warpzone_home_id):
        warpzone_home = SectorWarpZone.objects.filter(
            warp_home_id=warpzone_home_id,
            warp_home_id__name=warpzone_home_name,
            warp_home_id__sector_id=self.get_player_sector_id()
        )
        if warpzone_home.exists():
            
            destination_sector_id = warpzone_home.values('warp_destination_id__sector_id')[0]['warp_destination_id__sector_id']
            destination_source_id = warpzone_home.values('warp_destination_id')[0]['warp_destination_id']
            
            # get data 
            warpzone_destination = WarpZone.objects.filter(id=destination_source_id).values(
                'data',
                'coordinates',
                'source_id__size'
            )[0]
            
            # warpzone
            wz_coord_y = int(warpzone_destination['coordinates']['y'])
            wz_coord_x = int(warpzone_destination['coordinates']['x'])
            wz_size_y = int(warpzone_destination['source_id__size']['y'])
            wz_size_x = int(warpzone_destination['source_id__size']['x'])
            
            player_spaceship = self.get_player_ship_size()
            spaceship_size_x = player_spaceship['ship_id__ship_category_id__size']['x']
            spaceship_size_y = player_spaceship['ship_id__ship_category_id__size']['y']
            
            planets, asteroids, stations, warpzones, npcs, pcs = GetDataFromDB.get_items_from_sector(
                destination_sector_id, with_npc=True, only_size_coord=True
            )
            
            foreground_table_set = {
                "planet": planets,
                "asteroid": asteroids,
                "station": stations,
                "warpzone": warpzones,
                "npc": npcs,
                "pc": pcs,
            }
            
            # define where we stock all coord from all fg item on the map
            space_item_coord_array = [{"y":c_y, "x":c_x} for c_y in range(wz_coord_y, wz_coord_y + wz_size_y) for c_x in range(wz_coord_x, wz_coord_x + wz_size_x)]
            # define where we check first to find empty zone
            zone_range_coordinate_to_travel = []
            arrival_zone_has_been_finded = False
            
            for table_key, table_value in foreground_table_set.items():
                if table_key == "npc" or table_key == "pc":
                    for pc_npc in table_value:
                        
                        size = pc_npc['npc_template_id__ship_id__ship_category_id__size'] if table_key == "npc" else pc_npc['ship_id__ship_category_id__size']
                        coord = pc_npc['coordinates'] if table_key == "npc" else pc_npc['player_id__coordinates']
                        coord_y = int(coord['y']) if coord.get('y') else int(coord['y'])
                        coord_x = int(coord['x']) if coord.get('x') else int(coord['x'])
                        size_y = int(size['y'])
                        size_x = int(size['x'])
                        
                        if size_x > 1:
                            for c_y in range(coord_y, coord_y + size_y):
                                for c_x in range(coord_x, coord_x + size_x):
                                    if {"y":c_y, "x":c_x} not in space_item_coord_array:
                                        space_item_coord_array.append({"y":c_y, "x":c_x})
                        else:
                            if {'y':coord_y, 'x':coord_x} not in space_item_coord_array:
                                space_item_coord_array.append({"y":coord_y, "x":coord_x})
                else:
                    for fg_item in table_value:
                        size = fg_item['source_id__size']
                        coord = fg_item['data']['coordinates']
                        coord_y = int(coord['y'])
                        coord_x = int(coord['x'])
                        size_y = int(size['y'])
                        size_x = int(size['x'])
                        
                        if size_x > 1:
                            for c_y in range(coord_y, coord_y + size_y):
                                for c_x in range(coord_x, coord_x + size_x):
                                    if {"y": c_y, "x": c_x} not in space_item_coord_array:
                                        space_item_coord_array.append({"y": c_y, "x": c_x})
                        else:
                            space_item_coord_array.append({"y": coord_y, "x": coord_x})
                            
            placeholder_size_x = player_spaceship['ship_id__ship_category_id__size']['x']
            placeholder_size_y = player_spaceship['ship_id__ship_category_id__ship_size']['y']
                            
            while arrival_zone_has_been_finded is False:
                # define "square" zone where user can be tp
                # this square grow up when space can't be filled.
                start_x = wz_coord_x - placeholder_size_x if wz_coord_x - placeholder_size_x > 0 else 0
                end_x = (wz_coord_x + wz_size_x + placeholder_size_x) if (wz_coord_x + wz_size_x + placeholder_size_x) <= 39 else 39 
                start_y = wz_coord_y - placeholder_size_y if wz_coord_y - placeholder_size_y > 0 else 0
                end_y = (wz_coord_y + wz_size_y + placeholder_size_y) if (wz_coord_y + wz_size_y + placeholder_size_y) <= 39 else 39 
                arrival_zone = []
                
                zone_range_coordinate_to_travel = [{"y": y, "x": x} for y in range(start_y, end_y) for x in range(start_x, end_x)]
                
                if spaceship_size_x == 1 and spaceship_size_y == 1:
                    for cell in zone_range_coordinate_to_travel:
                        if cell not in space_item_coord_array:
                            arrival_zone_has_been_finded = True
                            return destination_sector_id, cell
                        arrival_zone_has_been_finded = False
                else:
                    for cell in zone_range_coordinate_to_travel:
                        cell_y = int(cell["y"])
                        cell_x = int(cell["x"])
                        if not {"y": cell_y, "x": cell_x} in space_item_coord_array:
                            already_contains_element = False
                            for y in range(cell_y, cell_y + spaceship_size_y):
                                for x in range(cell_x, cell_x + spaceship_size_x):
                                    coord = {"y": y, "x": x}
                                    if coord in space_item_coord_array:
                                        already_contains_element = True
                                    else:
                                        arrival_zone.append({"x" : cell_x, "y": cell_y})
                            if already_contains_element is False:
                                arrival_zone_has_been_finded = True
                                return destination_sector_id, arrival_zone[0]
                            else:
                                arrival_zone = []
                        
                placeholder_size_x += player_spaceship['ship_id__ship_category_id__ship_size']['x']
                placeholder_size_y += player_spaceship['ship_id__ship_category_id__ship_size']['y']
                        
        
    def set_spaceship_statistics_with_module(self):
        pass