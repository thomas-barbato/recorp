import json
import os
from typing import Dict, List, Tuple, Any, Optional, Union
import math

from django.core import serializers
from django.contrib.auth.models import User
from django.db.models import Q, QuerySet

# Ajouter ces imports en haut du fichier get_data.py
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async

from recorp.settings import BASE_DIR
from core.models import (
    Planet, Asteroid, Station, Warp, WarpZone, SectorWarpZone,
    Resource, PlanetResource, AsteroidResource, StationResource,
    Faction, FactionResource, Security, Sector, Player, PlayerShip,
    PlayerShipResource, PlayerShipModule, Ship, ShipCategory,
    Skill, Npc, NpcTemplateResource, NpcTemplate, NpcTemplateSkill, Module,
)


class GetDataFromDB:
    """Classe utilitaire pour récupérer et manipuler les données du jeu spatial"""
    
    # Constantes de configuration
    MAP_SIZE = {"cols": 40, "rows": 40}
    
    ELEMENT_SIZES = {
        "planet": {"x": 4, "y": 4},
        "station": {"x": 3, "y": 3},
        "asteroid": {"x": 1, "y": 1},
        "satellite": {"x": 3, "y": 3},
        "blackhole": {"x": 5, "y": 3},
        "star": {"x": 2, "y": 2},
        "warpzone": {"x": 2, "y": 3},
    }
    
    RESOLUTION_CONFIGS = {
        "is_pc": {"col": 20, "row": 16},
        "is_mobile": {"col": 10, "row": 10},
        "is_tablet": {"col": 20, "row": 20},
    }
    
    FG_TYPES = [
        "planet", "asteroid", "station", "blackhole", 
        "star", "satellite", "warpzone"
    ]
    
    TABLE_MAPPING = {
        "satellite": [Planet, PlanetResource],
        "star": [Planet, PlanetResource],
        "blackhole": [Planet, PlanetResource],
        "planet": [Planet, PlanetResource],
        "asteroid": [Asteroid, AsteroidResource],
        "station": [Station, StationResource],
        "faction": [Faction, FactionResource],
        "player": [User, Player, PlayerShipResource, PlayerShip],
        "npc": [Npc, NpcTemplate, NpcTemplateResource, NpcTemplateSkill],
        "warpzone": [Warp, WarpZone, SectorWarpZone],
        "warpzone_only": WarpZone,
        "resource": Resource,
        "ship": Ship,
        "security": Security,
        "sector": Sector,
        "skill": Skill,
        "module": Module,
    }
    
    WEAPONRY_MODULE_TYPES = ["WEAPONRY", "ELECTRONIC_WARFARE"]

    def __init__(self):
        pass

    # === Méthodes de configuration et constantes ===
    
    @staticmethod
    def get_size() -> List[Dict[str, Dict[str, int]]]:
        """Retourne les tailles de tous les éléments au format legacy"""
        return [
            {f"{element}_data": size} 
            for element, size in GetDataFromDB.ELEMENT_SIZES.items()
        ]

    @staticmethod
    def get_specific_size(element: str) -> Dict[str, int]:
        """Retourne la taille spécifique d'un élément"""
        return GetDataFromDB.ELEMENT_SIZES.get(element, {"x": 1, "y": 1})

    @staticmethod
    def get_fg_element_url(element: str) -> List[str]:
        """Retourne les URLs des images de premier plan pour un élément"""
        path = os.path.join(BASE_DIR, "recorp", "static", "img", "foreground", element)
        return os.listdir(path) if os.path.exists(path) else []

    @staticmethod
    def get_bg_fg_url(bg_fg_choice: str) -> List[str]:
        """Retourne les URLs d'arrière-plan ou de premier plan"""
        path = os.path.join(BASE_DIR, "recorp", "static", "img", bg_fg_choice)
        return os.listdir(path) if os.path.exists(path) else []

    @staticmethod
    def get_map_size() -> Dict[str, int]:
        """Retourne la taille de la carte"""
        return GetDataFromDB.MAP_SIZE.copy()

    @staticmethod
    def get_map_size_range() -> Dict[str, range]:
        """Retourne les ranges de la carte"""
        return {
            "cols": range(GetDataFromDB.MAP_SIZE["cols"]),
            "rows": range(GetDataFromDB.MAP_SIZE["rows"])
        }

    @staticmethod
    def get_resolution_sized_map(device_type: str) -> Dict[str, int]:
        """Retourne les dimensions de carte adaptées au type d'appareil"""
        return GetDataFromDB.RESOLUTION_CONFIGS.get(
            device_type, 
            GetDataFromDB.RESOLUTION_CONFIGS["is_pc"]
        )

    @staticmethod
    def get_fg_type() -> List[str]:
        """Retourne les types de premier plan disponibles"""
        return GetDataFromDB.FG_TYPES.copy()

    @staticmethod
    def get_table(table_name: str) -> Union[List, type]:
        """Retourne la ou les tables correspondant au nom donné"""
        return GetDataFromDB.TABLE_MAPPING.get(table_name)
    
    @staticmethod
    def get_warpzone_destination_id(warpzone_name: str, home_sector_id: int):
        return SectorWarpZone.objects.filter(
            warp_home_id=home_sector_id, 
            warp_home_id__data__contains={"name": warpzone_name}
            ).values_list('warp_home_id')

    # === Méthodes de sérialisation et requêtes ===
    
    @staticmethod
    def get_animation_queryset() -> Dict[str, List[Dict]]:
        """Retourne les données sérialisées pour les animations"""
        return {
            "planet_data": GetDataFromDB._serialize_planets_by_type("planet"),
            "satellite_data": GetDataFromDB._serialize_planets_by_type("satellite"),
            "blackhole_data": GetDataFromDB._serialize_planets_by_type("blackhole"),
            "star_data": GetDataFromDB._serialize_planets_by_type("star"),
            "asteroid_data": GetDataFromDB.serialize_queryset(Asteroid.objects.all()),
            "stations_data": GetDataFromDB.serialize_queryset(Station.objects.all()),
            "warpzone_data": GetDataFromDB.serialize_queryset(Warp.objects.all()),
        }
    
    @staticmethod
    def _serialize_planets_by_type(planet_type: str) -> List[Dict]:
        """Méthode helper pour sérialiser les planètes par type"""
        queryset = Planet.objects.filter(data__contains={"type": planet_type})
        return GetDataFromDB.serialize_queryset(queryset)

    @staticmethod
    def get_faction_queryset() -> QuerySet:
        """Retourne toutes les factions"""
        return Faction.objects.all()

    @staticmethod
    def serialize_queryset(queryset: QuerySet) -> List[Dict]:
        """Sérialise un queryset Django en JSON"""
        return json.loads(serializers.serialize("json", queryset))

    @staticmethod
    def get_resource_queryset() -> QuerySet:
        """Retourne toutes les ressources"""
        return Resource.objects.all()

    # === Méthodes de gestion des secteurs ===
    
    @staticmethod
    def count_foreground_item_in_map(map_pk: int) -> int:
        """Compte les éléments de premier plan dans une carte"""
        try:
            sector_data = Sector.objects.filter(id=map_pk).values(
                "planet_sector__sector_id",
                "asteroid_sector__sector_id", 
                "station_sector__sector_id"
            ).first()
            
            if not sector_data:
                return 0
                
            return sum(1 for value in sector_data.values() if value is not None)
        except (Sector.DoesNotExist, IndexError):
            return 0

    @staticmethod
    def check_if_table_pk_exists(table: str, pk: int) -> bool:
        """Vérifie si une clé primaire existe dans une table"""
        table_model = GetDataFromDB.get_table(table)
        if not table_model:
            return False
        return table_model.objects.filter(id=pk).exists()

    @staticmethod
    def remove_map(map_pk: int) -> None:
        """Supprime une carte et ses NPCs associés"""
        Sector.objects.filter(id=map_pk).delete()
        Npc.objects.filter(Sector=map_pk).delete()

    @staticmethod
    def delete_items_from_sector(pk: int) -> None:
        """Supprime tous les éléments d'un secteur"""
        try:
            sector = Sector.objects.get(id=pk)
            sector.planet_sector.all().delete()
            sector.asteroid_sector.all().delete()
            sector.station_sector.all().delete()
            sector.warp_sector.all().delete()
            sector.npc_sector.all().delete()
        except Sector.DoesNotExist:
            pass

    @staticmethod
    def get_items_from_sector(pk: int, with_npc: bool = False) -> Tuple:
        """Récupère les éléments d'un secteur"""
        try:
            sector = Sector.objects.get(id=pk)
        except Sector.DoesNotExist:
            return tuple()

        base_items = (
            sector.planet_sector.values(
                "source_id__size", "data", "coordinates", "id",
                "source_id", "source_id__data__type" 
            ),
            sector.asteroid_sector.values(
                "source_id__size", "data", "coordinates", "id", 
                "source_id", "source_id__data__type" 
            ),
            sector.station_sector.values(
                "source_id__size", "data", "coordinates", "id", 
                "source_id", "source_id__data__type" 
            ),
            sector.warp_sector.values(
                "source_id__size", "data", "coordinates", 
                "source_id", "id", "sector_id" 
            ),
        )
        
        if not with_npc:
            return base_items

        # Ajout des données NPC et joueurs
        player_ids = Player.objects.filter(sector_id=pk).values("id")
        
        npc_data = sector.npc_sector.values(
            "id", "npc_template_id__ship_id__ship_category_id__size",
            "npc_template_id__ship_id__image", "npc_template_id__ship_id__name",
            "npc_template_id", "coordinates"
        )
        
        player_ships = PlayerShip.objects.filter(
            player_id__in=player_ids, is_current_ship=True
        ).values(
            "ship_id__ship_category_id__size",
            "player_id__coordinates"
        )

        return base_items + (npc_data, player_ships)

    # === Méthodes de gestion des joueurs et NPCs ===
    
    @staticmethod
    def get_pc_from_sector(pk: int) -> Tuple[QuerySet, QuerySet]:
        """Récupère les données des joueurs et NPCs d'un secteur"""
        player_modules = PlayerShipModule.objects.filter(
            player_ship_id__player_id__sector_id=pk
        ).values(
            "player_ship_id", "player_ship_id__player_id",
            "player_ship_id__ship_id",
            "player_ship_id__player_id__name", "player_ship_id__player_id__coordinates",
            "player_ship_id__player_id__image", "player_ship_id__player_id__description",
            "player_ship_id__player_id__is_npc", "player_ship_id__player_id__current_ap", 
            "player_ship_id__player_id__max_ap", "player_ship_id__player_id__faction_id__name",
            "player_ship_id__player_id__archetype_id__name",
            "player_ship_id__player_id__archetype_id__data",
            "player_ship_id__player_id__sector_id__name",
            "player_ship_id__ship_id__name", "player_ship_id__ship_id__image",
            "player_ship_id__ship_id__description", "player_ship_id__is_current_ship",
            "player_ship_id__is_reversed", "player_ship_id__current_hp",
            "player_ship_id__max_hp", "player_ship_id__current_movement",
            "player_ship_id__max_movement", "player_ship_id__current_missile_defense",
            "player_ship_id__current_ballistic_defense", "player_ship_id__current_thermal_defense",
            "player_ship_id__max_missile_defense",
            "player_ship_id__max_ballistic_defense", 
            "player_ship_id__max_thermal_defense",
            "player_ship_id__current_cargo_size", "player_ship_id__status",
            "player_ship_id__ship_id__module_slot_available",
            "player_ship_id__ship_id__ship_category__name",
            "player_ship_id__ship_id__ship_category__description",
            "player_ship_id__ship_id__ship_category__size",
            "player_ship_id__view_range",
        ).distinct()

        npcs = Npc.objects.filter(sector_id=pk).values(
            "id", "coordinates", "status", "hp", "npc_template_id__max_hp",
            "movement", "npc_template_id__max_movement", "ballistic_defense",
            "npc_template_id__ship_id",
            "npc_template_id__max_ballistic_defense", "thermal_defense",
            "npc_template_id__max_thermal_defense", "missile_defense",
            "npc_template_id__max_missile_defense", "npc_template_id__module_id_list",
            "npc_template_id__difficulty", "npc_template_id__name", "npc_template_id__id",
            "npc_template_id__displayed_name",
            "faction_id__name", "npc_template_id__ship_id__image",
            "npc_template_id__ship_id__ship_category_id__size",
            "npc_template_id__ship_id__ship_category_id__name",
            "npc_template_id__ship_id__ship_category_id__description",
            "npc_template_id__ship_id__name"
        )

        return player_modules, npcs

    @staticmethod
    def get_npc_template_data(pk: int) -> Tuple[List, List, List]:
        """Récupère les données complètes d'un template NPC"""
        template = list(NpcTemplate.objects.filter(id=pk).values(
            "id", "name", "difficulty", "module_id_list", "max_hp",
            "displayed_name","max_movement", "max_missile_defense", 
            "max_thermal_defense", "max_ballistic_defense", "hold_capacity", 
            "behavior", "ship_id", "ship_id__image"
        ))

        skills = list(NpcTemplateSkill.objects.filter(npc_template_id=pk).values(
            "skill_id", "skill__name", "level"
        ))

        resources = list(NpcTemplateResource.objects.filter(npc_template_id=pk).values(
            "npc_template_id", "resource_id", "quantity", "can_be_randomized"
        ))

        return template, skills, resources

    @staticmethod
    def get_template_data() -> List[Dict]:
        """Récupère tous les templates NPC"""
        return list(NpcTemplate.objects.values(
            "id", "name", "ship_id__image", "max_hp", "max_movement",
            "displayed_name", "difficulty", "max_missile_defense", 
            "max_thermal_defense", "max_ballistic_defense", "behavior"
        ))

    @staticmethod
    def get_selected_ship_data(template_id: int) -> Dict:
        """Récupère les données du vaisseau pour un template donné"""
        try:
            return NpcTemplate.objects.filter(id=template_id).values(
                "id", "ship_id", "ship_id__name", "ship_id__image",
                "ship_id__ship_category_id__size", "displayed_name",
                "view_range",
            ).first()
        except (NpcTemplate.DoesNotExist, IndexError):
            return {}

    @staticmethod
    def get_related_npc_on_sector_data(sector_id: int) -> List[Dict]:
        """Récupère les NPCs liés à un secteur"""
        return list(Npc.objects.filter(sector_id=sector_id).values(
            "id", "coordinates", "npc_template_id__id", "npc_template_id__name", "npc_template_id__displayed_name",
            "npc_template_id__ship_id__image", "npc_template_id__ship_id__ship_category_id__size",
            "npc_template_id__ship_id__name"
        ))

    # === Méthodes utilitaires ===
    
    @staticmethod
    def check_if_no_missing_entry(data: Dict, data_item: Optional[Dict] = None) -> Tuple[bool, List[str]]:
        """Vérifie s'il manque des entrées dans les données"""
        missing_data = []
        
        # Vérification des données principales
        for key, value in data.items():
            if GetDataFromDB._is_empty_value(value):
                missing_data.append(key)
        
        # Vérification des éléments de données
        if data_item:
            for i, item_data in data_item.items():
                for key, value in item_data.items():
                    if GetDataFromDB._is_empty_value(value):
                        missing_data.append(f"{key} (ITEM #{int(i) + 1})")
        
        return len(missing_data) > 0, missing_data

    @staticmethod
    def _is_empty_value(value: Any) -> bool:
        """Vérifie si une valeur est considérée comme vide"""
        return (
            (not value and value is not False) or 
            value == "" or 
            value == "none"
        )

    @staticmethod
    def get_resource_quantity_value(value: float, max_value: float) -> str:
        """Détermine le niveau de ressource basé sur le pourcentage"""
        if max_value == 0:
            return "empty"
        
        if value == 0:
            return "empty"
        
        if max_value == value:
            return "full"
        
        percentage = 100 * (value / max_value)
        
        if percentage >= 75.0:
            return "above average"
        elif percentage >= 50.0:
            return "average"
        elif percentage > 25.0:
            return "below average"
        elif percentage > 0.0:
            return "depleted"
        
        return "empty"

    # === Système de portée et combat ===
    
    @staticmethod
    def is_in_range(sector_id: int, current_player_id: int, is_npc: bool = False) -> Dict[str, List[Dict]]:
        """
        Détermine quels éléments sont à portée d'un joueur ou NPC
        """
        try:
            current_player_data = GetDataFromDB._get_current_player_data(current_player_id, is_npc)
            sector_elements = GetDataFromDB._get_sector_elements(sector_id, current_player_id)
            
            return GetDataFromDB._calculate_range_for_all_elements(
                current_player_data, sector_elements
            )
        except Exception as e:
            # Log de l'erreur en production
            return {}
        
    def current_player_observable_zone(current_player_id: int) -> dict:
        """
        Détermine la zone de visibilité du joueur,
        La stock dans une variable de la classe.
        """
        try:
            current_user_data = GetDataFromDB._get_player_ship_view_range(current_player_id)
            return GetDataFromDB._calculate_view_range(current_user_data)
            
        except Exception as e:
            # Log de l'erreur en production
            return {}
        
    @staticmethod
    def _get_target_coord_size(target_id : int, is_npc : bool = False) -> bool:
        """
        Recoltes les données (size, coord) du pc / npc.
        """
        try:
            ship = []
            if is_npc:
                ship = [
                        {'coordinates' : e['coordinates'], 'size': e['npc_template_id__ship_id__ship_category_id__size']} 
                        for e in Npc.objects.filter(id=target_id).values(
                            'coordinates',
                            'npc_template_id__ship_id__ship_category_id__size'
                    )][0]
            else:
                ship = [
                        {'coordinates' : e['coordinates'], 'size': e['ship_id___ship_category_id__size']} 
                        for e in PlayerShip.objects.filter(player_id=target_id).values(
                            'player_id__coordinates',
                            'ship_id___ship_category_id__size'
                    )][0]
            return ship
        except Exception as e:
            # Log de l'erreur en production
            return {}
        
            
    @staticmethod
    def _get_player_ship_view_range(player_id: int) -> dict:
        """Récupère les données de visibilité d'un joueur"""
        
        player_data = PlayerShipModule.objects.filter(
            player_ship_id__player_id=player_id,
            player_ship_id__is_current_ship=True
        ).values(
            "player_ship_id__view_range",
            "player_ship_id__player_id__coordinates",
            "player_ship_id__ship_id__ship_category_id__size"
        ).first()
        
        if not player_data:
            return {}

        return {
            "range" : player_data["player_ship_id__view_range"],
            "coordinates": player_data["player_ship_id__player_id__coordinates"],
            "size": player_data["player_ship_id__ship_id__ship_category_id__size"],
        }
        
    @staticmethod
    def _calculate_view_range(data : dict) -> dict:
        coordinates = data['coordinates']
        size = data['size']
        view_range = data['range']
        
        start_x = GetDataFromDB._calculate_range_start(coordinates['x'], size['x'], view_range)
        end_x = GetDataFromDB._calculate_range_end(coordinates['x'], size['x'], view_range)
        start_y = GetDataFromDB._calculate_range_start(coordinates['y'], size['y'], view_range)
        end_y = GetDataFromDB._calculate_range_end(coordinates['y'], size['y'], view_range)
        
        # Limitation aux bordes de la carte
        start_x = max(0, start_x)
        end_x = min(GetDataFromDB.MAP_SIZE["cols"], end_x)
        start_y = max(0, start_y)
        end_y = min(GetDataFromDB.MAP_SIZE["rows"], end_y)
        
        result = []
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                # Calculer la distance entre le point (x,y) et le centre du joueur
                distance = math.sqrt((x - coordinates['x']) ** 2 + (y - coordinates['y']) ** 2)
                
                # Si la distance est <= view_range, inclure cette coordonnée
                if distance <= view_range:
                    result.append(f"{y}_{x}")
    
        return result

    @staticmethod
    def _get_current_player_data(current_player_id: int, is_npc: bool) -> Dict:
        """Récupère les données du joueur/NPC courant"""
        if is_npc:
            return GetDataFromDB._get_npc_player_data(current_player_id)
        else:
            return GetDataFromDB._get_human_player_data(current_player_id)

    @staticmethod
    def _get_human_player_data(player_id: int) -> Dict:
        """Récupère les données d'un joueur humain"""
        player_data = PlayerShipModule.objects.filter(
            player_ship_id__player_id=player_id,
            player_ship_id__is_current_ship=True
        ).values(
            "player_ship_id__ship_id__ship_category_id__size",
            "player_ship_id__player_id__coordinates",
            "player_ship_id__view_range",
            "player_ship_id__player_id"
        ).first()

        if not player_data:
            return {}

        modules = PlayerShipModule.objects.filter(
            player_ship_id__player_id=player_data["player_ship_id__player_id"],
            module_id__effect__has_key="range",
            module_id__type__in=GetDataFromDB.WEAPONRY_MODULE_TYPES
        ).values("module_id", "module_id__effect", "module_id__type")

        return {
            "coordinates": player_data["player_ship_id__player_id__coordinates"],
            "size": player_data["player_ship_id__ship_id__ship_category_id__size"],
            "modules": list(modules)
        }

    @staticmethod
    def _get_npc_player_data(npc_id: int) -> Dict:
        """Récupère les données d'un NPC"""
        npc_data = Npc.objects.filter(id=npc_id).values(
            "id", "npc_template_id__module_id_list",
            "npc_template_id__ship_id__ship_category_id__size",
            "coordinates"
        ).first()

        if not npc_data:
            return {}

        modules = Module.objects.filter(
            Q(id__in=npc_data["npc_template_id__module_id_list"]) &
            Q(effect__has_key="range") &
            Q(type__in=GetDataFromDB.WEAPONRY_MODULE_TYPES)
        ).values("id", "effect", "type")

        return {
            "coordinates": npc_data["coordinates"],
            "size": npc_data["npc_template_id__ship_id__ship_category_id__size"],
            "modules": list(modules)
        }

    @staticmethod
    def _get_sector_elements(sector_id: int, exclude_user_id: int) -> Dict:
        """Récupère tous les éléments d'un secteur"""
        return {
            "pc": GetDataFromDB._get_player_ships_in_sector(sector_id, exclude_user_id),
            "npc": GetDataFromDB._get_npcs_in_sector(sector_id),
            "asteroid": GetDataFromDB._get_asteroids_in_sector(sector_id),
            "station": GetDataFromDB._get_stations_in_sector(sector_id),
            "warpzone": GetDataFromDB._get_warpzones_in_sector(sector_id),
            "other_element": GetDataFromDB._get_planets_in_sector(sector_id),
        }

    @staticmethod
    def _get_player_ships_in_sector(sector_id: int, exclude_user_id: int) -> List[Dict]:
        """Récupère les vaisseaux des joueurs dans un secteur"""
        return list(PlayerShip.objects.filter(
            player_id__sector_id=sector_id,
            is_current_ship=True
        ).exclude(
            player_id__user_id=exclude_user_id
        ).values(
            "player_id",
            "player_id__coordinates",
            "ship_id__ship_category_id__size"
        ))

    @staticmethod
    def _get_npcs_in_sector(sector_id: int) -> List[Dict]:
        """Récupère les NPCs dans un secteur"""
        return list(Npc.objects.filter(sector_id=sector_id).values(
            "id", "coordinates", "npc_template_id__ship_id__ship_category_id__size"
        ))

    @staticmethod
    def _get_asteroids_in_sector(sector_id: int) -> List[Dict]:
        """Récupère les astéroïdes dans un secteur"""
        return list(AsteroidResource.objects.filter(sector_id=sector_id).values(
            "id", "source_id__size", "coordinates", "data__name"
        ))

    @staticmethod
    def _get_stations_in_sector(sector_id: int) -> List[Dict]:
        """Récupère les stations dans un secteur"""
        return list(StationResource.objects.filter(sector_id=sector_id).values(
            "id", "source_id__size", "coordinates", "data__name"
        ))

    @staticmethod
    def _get_warpzones_in_sector(sector_id: int) -> List[Dict]:
        """Récupère les zones de téléportation dans un secteur"""
        return list(WarpZone.objects.filter(sector_id=sector_id).values(
            "id", "source_id__size", "coordinates", "data__name"
        ))

    @staticmethod
    def _get_planets_in_sector(sector_id: int) -> List[Dict]:
        """Récupère les planètes dans un secteur"""
        return list(PlanetResource.objects.filter(sector_id=sector_id).values(
            "id", "source_id__size", "coordinates", "data__name"
        ))
        
    @staticmethod
    def get_destination_sector_id_from_sectorwarpzone(sectorWarpZoneId: int):
        return SectorWarpZone.objects.filter(id=sectorWarpZoneId).values_list('warp_destination_id', flat=True)[0]
        
    @staticmethod
    def get_user_id_from_player_id(player_id: int):
        return Player.objects.filter(id=player_id).values_list('user_id', flat=True).first()

    @staticmethod
    def _calculate_range_for_all_elements(player_data: Dict, sector_elements: Dict) -> Dict[str, List[Dict]]:
        """Calcule la portée pour tous les éléments du secteur"""
        if not player_data or not player_data.get("modules"):
            return {key: [] for key in sector_elements.keys()}

        result = {}
        
        for element_type, elements in sector_elements.items():
            result[element_type] = []
            
            for element in elements:
                for module in player_data["modules"]:
                    range_data = GetDataFromDB._calculate_single_element_range(
                        player_data, element, module, element_type
                    )
                    result[element_type].append(range_data)
        
        return result

    @staticmethod
    def _calculate_single_element_range(player_data: Dict, element: Dict, module: Dict, element_type: str) -> Dict:
        """Calcule si un élément spécifique est à portée"""
        # Extraction des données du module
        if 'module_id__type' in module:  # Joueur humain
            module_id = module["module_id"]
            module_range = int(module["module_id__effect"]["range"])
            module_type = module["module_id__type"]
        else:  # NPC
            module_id = module["id"]
            module_range = int(module["effect"]["range"])
            module_type = module["type"]

        # Calcul des coordonnées et tailles
        player_coords = GetDataFromDB._extract_coordinates(player_data["coordinates"])
        player_size = player_data["size"]
        
        element_coords = GetDataFromDB._extract_element_coordinates(element, element_type)
        element_size = GetDataFromDB._extract_element_size(element, element_type)

        # Calcul de la zone de portée
        player_range_zone = GetDataFromDB._calculate_range_zone(
            player_coords, player_size, module_range
        )
        
        # Vérification si l'élément est dans la zone
        is_in_range = GetDataFromDB._is_element_in_range_zone(
            element_coords, element_size, player_range_zone
        )

        return {
            "target_id": element["id"],
            "module_id": module_id,
            "type": module_type,
            "name": element.get("data__name"),
            "is_in_range": is_in_range,
        }

    @staticmethod
    def _extract_coordinates(coords_data: Dict) -> Tuple[int, int]:
        """Extrait les coordonnées x, y"""
        if coords_data and coords_data.get("x") is not None:
            return int(coords_data["x"]), int(coords_data["y"])
        return 0, 0

    @staticmethod
    def _extract_element_coordinates(element: Dict, element_type: str) -> Tuple[int, int]:
        """Extrait les coordonnées d'un élément selon son type"""
        if element_type == "npc":
            return GetDataFromDB._extract_coordinates(element["coordinates"])
        elif element_type == "pc":
            return GetDataFromDB._extract_coordinates(element["player_id__coordinates"])
        else:
            coords_data = element.get("coordinates", {})
            return GetDataFromDB._extract_coordinates(coords_data)

    @staticmethod
    def _extract_element_size(element: Dict, element_type: str) -> Dict[str, int]:
        """Extrait la taille d'un élément selon son type"""
        if element_type == "npc":
            return element["npc_template_id__ship_id__ship_category_id__size"]
        elif element_type == "pc":
            return element["ship_id__ship_category_id__size"]
        else:
            return element["source_id__size"]

    @staticmethod
    def _calculate_range_zone(coords: Tuple[int, int], size: Dict[str, int], module_range: int) -> List[str]:
        """Calcule la zone de portée d'un joueur"""
        x, y = coords
        size_x, size_y = size["x"], size["y"]
        
        # Calcul des limites avec ajustement pour la taille
        start_x = GetDataFromDB._calculate_range_start(x, size_x, module_range)
        end_x = GetDataFromDB._calculate_range_end(x, size_x, module_range)
        start_y = GetDataFromDB._calculate_range_start(y, size_y, module_range)
        end_y = GetDataFromDB._calculate_range_end(y, size_y, module_range)
        
        # Limitation aux bordes de la carte
        start_x = max(0, start_x)
        end_x = min(GetDataFromDB.MAP_SIZE["cols"], end_x)
        start_y = max(0, start_y)
        end_y = min(GetDataFromDB.MAP_SIZE["rows"], end_y)
        
        # Génération de la zone de portée
        return [
            f"{y}_{x}"
            for y in range(start_y, end_y)
            for x in range(start_x, end_x)
        ]
        
    @staticmethod
    def _calculate_range_start(coord: int, size: int, view_range: int) -> int:
        """Calcule la coordonnée de début de portée"""
        if size > 1:
            offset = -1 if size == 2 else -1
            return coord - view_range + offset
        return coord - view_range

    @staticmethod
    def _calculate_range_end(coord: int, size: int, view_range: int) -> int:
        """Calcule la coordonnée de fin de portée"""
        if size > 1:
            offset = 2 if size == 2 else 3
            return coord + view_range + offset
        return coord + view_range + 1

    @staticmethod
    def _is_element_in_range_zone(element_coords: Tuple[int, int], element_size: Dict[str, int], 
        range_zone: List[str]) -> bool:
        """Vérifie si un élément est dans la zone de portée"""
        element_x, element_y = element_coords
        size_x, size_y = element_size["x"], element_size["y"]
        
        if size_x == 1 and size_y == 1:
            # Élément de taille 1x1
            return f"{element_y}_{element_x}" in range_zone
        else:
            # Élément de taille supérieure - génération de sa zone
            element_zone = [
                f"{y}_{x}"
                for y in range(element_y, element_y + size_y)
                for x in range(element_x, element_x + size_x)
            ]
            # Vérification de l'intersection
            return len(set(range_zone).intersection(element_zone)) > 0
        

    @staticmethod
    def get_mp_recipient_sector_and_id(name) -> bool:
        """Récupere l'id player du recepteur de mp aisi que son secteur."""
        recipient = Player.objects.filter(name=name).values('id', 'sector_id')[0]
        return recipient['id'], recipient['sector_id']
        