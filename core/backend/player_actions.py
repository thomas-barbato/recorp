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
    LoggedInUser, 
)


class PlayerAction:
    def __init__(self, id):
        self.id = id
        self.player = Player.objects.filter(user_id=id).all()
        self.player_id = self.get_player_id()

    def is_player_exists(self):
        return Player.objects.filter(user_id=self.id).exists()
        
    def get_player_id(self):
        # if player have created a character,
        # return id
        # else return None.
        if self.player:
            return self.player.values_list("id", flat=True)[0]
        return None
    
    def get_session_key(self):
        return LoggedInUser.filter(user_id=self.id).values_list('session_key', flat=True)
    
    def get_player_sector_id(self):
        return self.player.values_list("sector_id", flat=True)[0]

    def get_player_faction(self):
        return self.player.values_list("faction_id", flat=True)[0]

    def get_player_sector(self):
        return self.player.values_list("sector_id", flat=True)[0]

    def get_coord(self):
        return self.player.values_list("coordinates", flat=True)[0]

    def get_other_player_name(self, other_player_id):
        return Player.objects.filter(id=other_player_id).values_list("name", flat=True)[0]

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
    
    def player_travel_to_destination(self, warpzone_home_name, warpzone_home_id):
        warpzone_home = SectorWarpZone.objects.filter(
            warp_home_id=warpzone_home_id,
            warp_home_id__name=warpzone_home_name,
            warp_home_id__sector_id=self.get_player_sector_id()
        )
        if warpzone_home.exists():
            
            destination_sector_id = warpzone_home.values('warp_destination_id__sector_id')[0]['warp_destination_id__sector_id']
            
            player_spaceship = self.get_player_ship_size()
            spaceship_size_x = player_spaceship['ship_id__ship_category_id__size']['x']
            spaceship_size_y = player_spaceship['ship_id__ship_category_id__size']['y']  

            padding_w = spaceship_size_x + 3
            padding_h = spaceship_size_y + 3
            
            destination_cell = self.__calculate_destination_coord(destination_sector_id, spaceship_size_x, spaceship_size_y, padding_h, padding_w)
            
            return destination_sector_id, destination_cell
    
    def __calculate_destination_coord(self, destination_sector_id, spaceship_size_x, spaceship_size_y, padding_h, padding_w):
        
        planets, asteroids, stations, warpzones, npcs, pcs = GetDataFromDB.get_items_from_sector(
            destination_sector_id, with_npc=True
        )
            
        foreground_table_set = {
            "planet": planets,
            "asteroid": asteroids,
            "station": stations,
            "warpzone": warpzones,
            "npc": npcs,
            "pc": pcs,
        }
        
        all_forgeround_item_coord = []
        
        wz_coord_start_x = wz_coord_start_y = wz_coord_end_x = wz_coord_end_x = 0
        
        for table_key, table_value in foreground_table_set.items():
            
            for value in table_value:
                if table_key == "npc" or table_key == "pc":
                    size = value['ship_id__ship_category_id__size'] if value.get('ship_id__ship_category_id__size') else value['npc_template_id__ship_id__ship_category_id__size']
                    coord = value['coordinates'] if value.get('coordinates') else value['player_id__coordinates']
                else:
                    size = value['source_id__size']
                    coord = value['coordinates']
                    
                coord_y = int(coord['y'])
                coord_x = int(coord['x'])
                size_y = int(size['y'])
                size_x = int(size['x'])
                
                if table_key == "warpzone" and value.get('id'):
                    wz_coord_start_y = coord_y
                    wz_coord_end_y = coord_y + size_y
                    wz_coord_start_x = coord_x
                    wz_coord_end_x = coord_x + size_x
                
                if size_x > 1:
                    if size_y == 1 and size_x > 1:
                        for x in range(coord_x, coord_x + size_x):
                            all_forgeround_item_coord.append({'y': coord_y, 'x': x})
                    else:
                        for y in range(coord_y, coord_y + size_y):
                            for x in range(coord_x, coord_x + size_x):
                                all_forgeround_item_coord.append({'y': y, 'x': x})
                                
                else:
                    all_forgeround_item_coord.append({'y': coord_y, 'x': coord_x})
        
        # define "square" zone where user can be tp
        # this square grow up when space can't be filled.
        start_x = wz_coord_start_x - padding_w if wz_coord_start_x - padding_w > 0 else 0
        end_x = wz_coord_end_x + padding_w if wz_coord_end_x + padding_w <= 39 else 39 
        start_y = wz_coord_start_y - padding_h if wz_coord_start_y - padding_h > 0 else 0
        end_y = wz_coord_end_y + padding_h if wz_coord_end_y + padding_h <= 39 else 39 
        
        zone_range_coordinate_to_travel = [{"y": y, "x": x} for y in range(start_y, end_y) for x in range(start_x, end_x)]
        arrival_zone = []

        for cell in zone_range_coordinate_to_travel:
            
            already_existing_zone_list = []
            cell_x = cell['x']
            cell_y = cell['y']
            
            if spaceship_size_x == 1 and spaceship_size_y == 1:
                if cell not in all_forgeround_item_coord:
                    return cell
                already_existing_zone_list.append(cell)
            else:
                if cell not in all_forgeround_item_coord:
                    
                    if spaceship_size_y == 1 and spaceship_size_x > 1:
                        for x in range(cell_x, cell_x + spaceship_size_x):
                            current_cell = {"y": cell_y, "x": x}
                            if current_cell not in all_forgeround_item_coord:
                                arrival_zone.append(current_cell)
                            else:
                                arrival_zone = []
                                break
                    else:
                        if spaceship_size_y == 1:
                            for x in range(cell_x, cell_x + spaceship_size_x):
                                current_cell = {"y": cell_y, "x": x}
                                if current_cell not in all_forgeround_item_coord:
                                    arrival_zone.append(current_cell)
                                else:
                                    arrival_zone = []
                                    break
                        else:
                            for y in range(cell_y, cell_y + spaceship_size_y):
                                for x in range(cell_x, cell_x + spaceship_size_x):
                                    current_cell = {"y": y, "x": x}
                                    if current_cell not in all_forgeround_item_coord:
                                        arrival_zone.append(current_cell)
                                    else:
                                        arrival_zone = []
                                        break
                                    
            if len(arrival_zone) != spaceship_size_x * spaceship_size_y:
                self.__calculate_destination_coord(destination_sector_id, spaceship_size_x, spaceship_size_y, padding_h + 1, padding_w + 1)
            else:
                return arrival_zone[0]

    def set_spaceship_statistics_with_module(self):
        pass