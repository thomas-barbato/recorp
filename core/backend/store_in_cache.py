import datetime
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from django.core.cache import cache
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from core.backend.get_data import GetDataFromDB
from core.backend.player_actions import PlayerAction
from core.models import (
    Sector,
    Player,
    Module,
    PlayerShipModule
)

logger = logging.getLogger(__name__)


class StoreInCache:
    """
    Gestionnaire de cache pour les données de secteur d'un jeu spatial.
    Gère la mise en cache des données de secteur, joueurs, NPCs et éléments du secteur.
    """
    
    def __init__(self, room_name: str, user_calling: int):
        """
        Initialise le gestionnaire de cache.
        
        Args:
            room_name: Nom de la room (format: "play_{sector_id}")
            user_calling: ID de l'utilisateur appelant
        """
        self.room = room_name
        self.sector_pk = self._extract_sector_id(room_name)
        self.user_calling = user_calling
        self.from_DB = GetDataFromDB
        self.user_view_coordinates = self.from_DB.current_player_observable_zone(self.user_calling.id)

    def _extract_sector_id(self, room_name: str) -> str:
        """Extrait l'ID du secteur depuis le nom de la room."""
        try:
            return room_name.split("_")[1]
        except IndexError:
            logger.error(f"Format de room_name invalide: {room_name}")
            raise ValueError(f"Format de room_name invalide: {room_name}")

    def get_or_set_cache(self, need_to_be_recreated: bool = False) -> Dict[str, Any]:
        """
        Récupère ou initialise les données du cache.
        
        Args:
            need_to_be_recreated: Force la recréation du cache si True
            
        Returns:
            Dict contenant les données du secteur
        """
        try:
            if need_to_be_recreated:
                cache.set(self.room, [])
                self.set_sector_data(self.sector_pk)
            else:
                if not cache.get(self.room):
                    self.set_sector_data(self.sector_pk)
            return cache.get(self.room)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération/création du cache: {e}")
            raise

    def set_sector_data(self, pk: str) -> None:
        """
        Initialise les données complètes du secteur dans le cache.
        
        Args:
            pk: ID du secteur
        """
        try:
            # Récupération des données de base
            planets, asteroids, stations, warpzones = self.from_DB.get_items_from_sector(pk)
            sector_pc, sector_npc = self.from_DB.get_pc_from_sector(pk)
            sector = Sector.objects.get(id=pk)

            # Structure des données du secteur
            sector_data = self._initialize_sector_structure(sector, pk)
            
            # Construction des éléments du secteur
            self._build_sector_elements(sector_data, {
                "planet": planets,
                "asteroid": asteroids,
                "station": stations,
                "warpzone": warpzones,
            })
            
            # Construction des NPCs et PCs
            self._build_npc_data(sector_data, sector_npc)
            self._build_pc_data(sector_data, sector_pc)
            
            # Mise en cache
            cache.set(self.room, sector_data)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation des données du secteur {pk}: {e}")
            raise
        
    def update_sector_player_visibility_zone(self, player_id) -> None:
        
        try:
            in_cache = cache.get(self.room)
            if not in_cache:
                return None, None
                
            pc_cache = in_cache["pc"]

            player = next(
                (p for p in pc_cache if player_id == p["user"]["player"]), 
                None
            )
            
            if not player:
                return None, None

            player_index = pc_cache.index(player)
            pc_cache[player_index]["ship"]["visible_zone"] = self.from_DB.current_player_observable_zone(player_id)
            in_cache["pc"] = pc_cache
            cache.set(self.room, in_cache)
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'index 'sector' du cache: {e}")
            return None

    def _initialize_sector_structure(self, sector: Sector, pk: str) -> Dict[str, Any]:
        """Initialise la structure de base des données du secteur."""
        return {
            "sector_element": [],
            "pc": [],
            "npc": [],
            "messages": [],
            "sector": {
                "id": pk,
                "name": sector.name,
                "description": sector.description,
                "image": sector.image,
                "security": {
                    "id": sector.security_id,
                    "name": sector.security.name,
                    "translated_name": sector.security.name,
                },
                "faction": {
                    "id": sector.faction_id,
                    "name": sector.faction.name,
                    "is_faction_level_starter": sector.is_faction_level_starter,
                    "translated_text_faction_level_starter": [],
                },
            }
        }

    def _build_sector_elements(self, sector_data: Dict[str, Any], foreground_table_set: Dict[str, Any]) -> None:
        """Construit les éléments du secteur (planètes, astéroïdes, stations, warpzones)."""
        for table_key, table_value in foreground_table_set.items():
            for table in table_value:
                if table_key == "warpzone":
                    self._build_warpzone_elements(sector_data, table_key)
                else:
                    self._build_standard_elements(sector_data, table_key)

    def _build_warpzone_elements(self, sector_data: Dict[str, Any], table_key: str) -> None:
        """Construit les éléments de type warpzone."""
        try:
            _, elementResource, elementZone = self.from_DB.get_table(table_key)
            
            map_elements = elementResource.objects.filter(
                sector_id=self.sector_pk
            ).values(
                "id", "data", "sector_id", "source_id", "data__name",
                "source_id__name", "source_id__size", "source_id__data", "coordinates"
            )
            
            for element in map_elements:
                destination = elementZone.objects.filter(
                    warp_home_id=element["id"]
                ).values(
                    "warp_destination_id", "warp_destination_id__data__name", "warp_home_id"
                ).first()
                
                if destination:
                    sector_data["sector_element"].append({
                        "item_id": element["id"],
                        "item_name": element['source_id__name'],
                        "source_id": element['source_id'],
                        "sector_id": element['sector_id'],
                        "animations": element['source_id__data']['animation'],
                        "data": {
                            "type": "warpzone",
                            "name": element["data__name"],
                            "coordinates": element['coordinates'],
                            "size": element['source_id__size'],
                            "description": element['data']["description"],
                            "warp_home_id": destination["warp_home_id"],
                            "destination_id": destination['warp_destination_id'],
                            "destination_name": destination['warp_destination_id__data__name'],
                        },
                        "size": element['source_id__size'],
                    })
        except Exception as e:
            logger.error(f"Erreur lors de la construction des warpzones: {e}")

    def _build_standard_elements(self, sector_data: Dict[str, Any], table_key: str) -> None:
        """Construit les éléments standards (planètes, astéroïdes, stations)."""
        try:
            _, elementResource = self.from_DB.get_table(table_key)
            resources = elementResource.objects.filter(
                sector_id=self.sector_pk
            ).values(
                'id', 'data', 'coordinates', 'quantity', 'source_id', 'sector_id',
                'source_id__size', 'source_id__name', 'source_id__data'
            )
            
            for resource in resources:
                resource_quantity = self.from_DB.get_resource_quantity_value(
                    resource["quantity"], 100
                )
                
                element_data = {
                    "item_id": resource["id"],
                    "item_name": resource["data"]["name"],
                    "resource": {
                        "id": resource["source_id"],
                        "name": resource["source_id__name"],
                        "quantity": resource["quantity"],
                        "quantity_str": resource_quantity,
                        "translated_quantity_str": resource_quantity,
                    },
                    "source_id": resource["source_id"],
                    "sector_id": resource["sector_id"],
                    "animations": resource["source_id__data"]["animation"],
                    "data": {
                        "type": resource["source_id__data"]["type"],
                        "name": resource["data"]["name"],
                        "coordinates": resource["coordinates"],
                        "description": resource["data"]["description"],
                    },
                    "size": resource["source_id__size"],
                }
                
                if element_data not in sector_data["sector_element"]:
                    sector_data["sector_element"].append(element_data)
                    
        except Exception as e:
            logger.error(f"Erreur lors de la construction des éléments {table_key}: {e}")

    def _build_npc_data(self, sector_data: Dict[str, Any], sector_npc: List[Dict]) -> None:
        """Construit les données des NPCs."""
        for npc_data in sector_npc:
            try:
                module_list = self._get_module_list(npc_data["npc_template_id__module_id_list"])
                max_hp = int(npc_data["npc_template_id__max_hp"])
                max_movement = int(npc_data["npc_template_id__max_movement"])
                sector_data["npc"].append({
                    "npc": {
                        "id": npc_data["id"],
                        "name": npc_data["npc_template_id__name"],
                        "displayed_name": npc_data["npc_template_id__displayed_name"],
                        "coordinates": npc_data["coordinates"],
                    },
                    "faction": {
                        "name": npc_data["faction_id__name"],
                    },
                    "ship": {
                        "name": npc_data["npc_template_id__ship_id__name"],
                        "image": npc_data["npc_template_id__ship_id__image"],
                        "ship_id": npc_data["npc_template_id__ship_id"], 
                        "current_hp": int(npc_data["hp"]),
                        "max_hp": max_hp,
                        "current_movement": int(npc_data["movement"]),
                        "max_movement": max_movement,
                        "current_ballistic_defense": npc_data["ballistic_defense"],
                        "current_thermal_defense": npc_data["thermal_defense"],
                        "current_missile_defense": npc_data["missile_defense"],
                        "status": npc_data["status"],
                        "category_name": npc_data["npc_template_id__ship_id__ship_category_id__name"],
                        "category_description": npc_data["npc_template_id__ship_id__ship_category_id__description"],
                        "size": npc_data["npc_template_id__ship_id__ship_category_id__size"],
                        "modules": module_list,
                        "modules_range": self.from_DB.is_in_range(
                            sector_data["sector"]["id"], npc_data["id"], is_npc=True
                        ),
                    },
                })
            except Exception as e:
                logger.error(f"Erreur lors de la construction des données NPC {npc_data.get('id', 'unknown')}: {e}")

    def _build_pc_data(self, sector_data: Dict[str, Any], sector_pc: List[Dict]) -> None:
        """Construit les données des joueurs (PC)."""
        for pc_data in sector_pc:
            try:
                module_list = self._get_player_module_list(pc_data["player_ship_id"])
                visible_zone = self.from_DB.current_player_observable_zone(pc_data["player_ship_id__player_id"])
                sector_data["pc"].append({
                    "user": {
                        "player": pc_data["player_ship_id__player_id"],
                        "name": pc_data["player_ship_id__player_id__name"],
                        "coordinates": pc_data["player_ship_id__player_id__coordinates"],
                        "image": pc_data["player_ship_id__player_id__image"],
                        "description": pc_data["player_ship_id__player_id__description"],
                        "is_npc": pc_data["player_ship_id__player_id__is_npc"],
                        "current_ap": pc_data["player_ship_id__player_id__current_ap"],
                        "max_ap": pc_data["player_ship_id__player_id__max_ap"],
                        "archetype_name": pc_data["player_ship_id__player_id__archetype_id__name"],
                        "archetype_data": pc_data["player_ship_id__player_id__archetype_id__data"],
                        "sector_name": pc_data["player_ship_id__player_id__sector_id__name"],
                    },
                    "faction": {
                        "name": pc_data["player_ship_id__player_id__faction_id__name"],
                    },
                    "ship": {
                        "name": pc_data["player_ship_id__ship_id__name"],
                        "image": pc_data["player_ship_id__ship_id__image"],
                        "ship_id": pc_data["player_ship_id__ship_id"],
                        "description": pc_data["player_ship_id__ship_id__description"],
                        "max_hp": pc_data["player_ship_id__max_hp"],
                        "current_hp": int(pc_data["player_ship_id__current_hp"]),
                        "max_movement": int(pc_data["player_ship_id__max_movement"]),
                        "current_movement": int(pc_data["player_ship_id__current_movement"]),
                        "current_ballistic_defense": pc_data["player_ship_id__current_ballistic_defense"],
                        "current_thermal_defense": pc_data["player_ship_id__current_thermal_defense"],
                        "current_missile_defense": pc_data["player_ship_id__current_missile_defense"],
                        "max_ballistic_defense": pc_data["player_ship_id__max_ballistic_defense"],
                        "max_thermal_defense": pc_data["player_ship_id__max_thermal_defense"],
                        "max_missile_defense": pc_data["player_ship_id__max_missile_defense"],
                        "current_cargo_size": pc_data["player_ship_id__current_cargo_size"],
                        "status": pc_data["player_ship_id__status"],
                        "module_slot_available": pc_data["player_ship_id__ship_id__module_slot_available"],
                        "module_slot_already_in_use": len(module_list),
                        "modules": module_list,
                        "modules_range": self.from_DB.is_in_range(
                            sector_data["sector"]["id"], 
                            pc_data["player_ship_id__player_id"], 
                            is_npc=False
                        ),
                        "ship_scanning_module_available": self._has_scanning_module(module_list),
                        "category_name": pc_data["player_ship_id__ship_id__ship_category__name"],
                        "category_description": pc_data["player_ship_id__ship_id__ship_category__description"],
                        "size": pc_data["player_ship_id__ship_id__ship_category__size"],
                        "is_reversed": pc_data["player_ship_id__is_reversed"],
                        "visible_zone": visible_zone,
                        "view_range": pc_data["player_ship_id__view_range"]
                    },
                })
            except Exception as e:
                logger.error(f"Erreur lors de la construction des données PC: {e}")

    def _get_module_list(self, module_id_list: List[int]) -> List[Dict[str, Any]]:
        """Récupère la liste des modules pour les NPCs."""
        return [
            {
                "name": module["name"],
                "effect": module["effect"],
                "description": module["description"],
                "type": module["type"],
                "id": module["id"],
            }
            for module in Module.objects.filter(id__in=module_id_list).values(
                "name", "description", "effect", "type", "id"
            )
        ]

    def _get_player_module_list(self, player_ship_id: int) -> List[Dict[str, Any]]:
        """Récupère la liste des modules pour un joueur."""
        return [
            {
                "name": module["module_id__name"],
                "effect": module["module_id__effect"],
                "description": module["module_id__description"],
                "type": module["module_id__type"],
                "id": module["module_id"],
            }
            for module in PlayerShipModule.objects.filter(
                player_ship_id=player_ship_id
            ).values(
                "module_id__name", "module_id__description", 
                "module_id__effect", "module_id__type", "module_id"
            )
        ]

    def _has_scanning_module(self, module_list: List[Dict[str, Any]]) -> bool:
        """Vérifie si le joueur possède un module de scan."""
        return any(module['name'] == "spaceship probe" for module in module_list)
    
    def get_other_player_data(self, player_id : int) -> List[dict[str, Any]]:
        
        try:
            in_cache = cache.get(self.room)
            if not in_cache or "pc" not in in_cache:
                return None
                
            cache_data = in_cache["pc"]
            players_data = [p for p in cache_data if player_id != p["user"]["player"]]
            
            if not players_data:
                return None
                
            return players_data
        
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données des joueurs présents")
            return None
    
    
    def get_current_player_data(self, player_id : int) -> List[dict[str, Any]]:
        
        try:
            in_cache = cache.get(self.room)
            if not in_cache or "pc" not in in_cache:
                return None
                
            cache_data = in_cache["pc"]
            current_player_data = [p for p in cache_data if player_id == p["user"]["player"]]
            
            if not current_player_data:
                return None
                
            return current_player_data
        
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données des joueurs présents")
            return None
            
        
    def get_specific_player_data(
        self, player_id: int, category: str = "", subcategory: str = "", search: str = ""
    ) -> Optional[Any]:
        """
        Récupère les données spécifiques d'un joueur depuis le cache.
        
        Args:
            player_id: ID du joueur
            category: Catégorie de données (ex: "pc")
            subcategory: Sous-catégorie (ex: "ship")
            search: Clé de recherche spécifique
            
        Returns:
            Données du joueur ou None si non trouvé
        """
        try:
            in_cache = cache.get(self.room)
            if not in_cache or category not in in_cache:
                return None
                
            cache_data = in_cache[category]
            found_player = next(
                (p for p in cache_data if player_id == p["user"]["player"]), 
                None
            )
            if not found_player:
                return None
                
            found_player_index = cache_data.index(found_player)
            
            if subcategory and search:
                return cache_data[found_player_index].get(subcategory, {}).get(search)
            return cache_data[found_player_index]
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données du joueur {player_id}: {e}")
            return None

    def get_specific_sector_data(self, search_item: str) -> Any:
        """
        Récupère des données spécifiques du secteur.
        
        Args:
            search_item: Clé de recherche dans les données du secteur
            
        Returns:
            Données demandées ou None
        """
        try:
            if not cache.get(self.room):
                self.set_sector_data(self.sector_pk)
            return cache.get(self.room, {}).get(search_item)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données du secteur: {e}")
            return None

    def update_player_position(self, pos: Dict[str, Any]) -> None:
        """
        Met à jour la position d'un joueur dans le cache.
        
        Args:
            pos: Dictionnaire contenant les nouvelles coordonnées et le coût de mouvement
        """
        try:
            in_cache = cache.get(self.room)
            if not in_cache:
                return
                
            player_position = in_cache["pc"]
            player_id = pos["player"]

            found_player = next(
                (p for p in player_position if player_id == p["user"]["player"]), 
                None
            )
            
            if not found_player:
                return

            found_player_index = player_position.index(found_player)
            
            # Mise à jour des coordonnées
            player_position[found_player_index]["user"]["coordinates"] = {
                "x": int(pos["end_x"]),
                "y": int(pos["end_y"]),
            }
            
            # Mise à jour du mouvement
            player_position[found_player_index]["ship"]["current_movement"] -= pos["move_cost"]

            # Nettoyage des anciens duplicatas
            self._remove_duplicate_players(player_position, found_player, pos)

            in_cache["pc"] = player_position
            cache.set(self.room, in_cache)
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de la position du joueur: {e}")

    def _remove_duplicate_players(
        self, player_position: List[Dict], found_player: Dict, pos: Dict[str, Any]
    ) -> None:
        """Supprime les duplicatas de joueurs avec des positions différentes."""
        players_to_remove = []
        for i, player in enumerate(player_position):
            if (player["user"]["player"] == found_player["user"]["player"] and
                (player["user"]["coordinates"]["y"] != int(pos["end_y"]) or
                player["user"]["coordinates"]["x"] != int(pos["end_x"]))):
                players_to_remove.append(i)
        
        # Suppression en ordre inverse pour éviter les problèmes d'index
        for i in reversed(players_to_remove):
            player_position.pop(i)

    def update_player_range_finding(self, target_player_id: Optional[int] = None) -> None:
        """
        Met à jour les portées des modules d'un joueur spécifique.
        
        Args:
            target_player_id: ID du joueur dont il faut recalculer les portées.
            Si None, utilise self.user_calling
        """
        try:
            # Utiliser le joueur spécifié ou le joueur appelant par défaut
            if target_player_id is None:
                player = PlayerAction(self.user_calling)
                player_id = player.get_player_id()
            else:
                player_id = target_player_id
            
            in_cache = cache.get(self.room)
            if not in_cache:
                return
                
            player_position = in_cache["pc"]
            found_player = next(
                (p for p in player_position if player_id == p["user"]["player"]), 
                None
            )
            
            if not found_player:
                return
            
            found_player_index = player_position.index(found_player)
            
            # Recalculer les portées pour ce joueur spécifique
            player_sector = None
            if target_player_id:
                # Pour un joueur spécifique, récupérer son secteur
                player_sector = Player.objects.filter(id=target_player_id).values_list('sector_id', flat=True).first()
            else:
                # Pour le joueur appelant
                player = PlayerAction(self.user_calling)
                player_sector = player.get_player_sector()
            
            if player_sector:
                player_position[found_player_index]["ship"]["modules_range"] = self.from_DB.is_in_range(
                    player_sector, player_id, is_npc=False
                )
                
                in_cache["pc"] = player_position
                cache.set(self.room, in_cache)
                
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des portées pour le joueur {target_player_id or self.user_calling}: {e}")

    def update_ship_is_reversed(
        self, data: Dict[str, Any], player_id: int, status: bool
    ) -> Tuple[bool, Optional[int]]:
        """
        Met à jour le statut "inversé" d'un vaisseau.
        
        Args:
            data: Données contenant l'ID utilisateur
            user_id: ID de l'utilisateur
            status: Nouveau statut inversé
            
        Returns:
            Tuple (nouveau_statut, player_id) ou (None, None) si erreur
        """
        try:
            in_cache = cache.get(self.room)
            if not in_cache:
                return None, None
                
            pc_cache = in_cache["pc"]

            player = next(
                (p for p in pc_cache if player_id == p["user"]["player"]), 
                None
            )
            
            if not player:
                return None, None

            player_index = pc_cache.index(player)
            player_id = pc_cache[player_index]["user"]["player"]
            pc_cache[player_index]["ship"]["is_reversed"] = status
            
            in_cache["pc"] = pc_cache
            cache.set(self.room, in_cache)

            return pc_cache[player_index]["ship"]["is_reversed"], player_id
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du statut inversé: {e}")
            return None, None

    def get_user_index(self, player_id: int) -> Optional[int]:
        """
        Récupère l'index d'un joueur dans la liste des PC.
        
        Args:
            player_id: ID du joueur
            
        Returns:
            Index du joueur ou None si non trouvé
        """
        try:
            in_cache = cache.get(self.room)
            if not in_cache:
                return None
                
            player_data = in_cache["pc"]

            found_player = next(
                (p for p in player_data if player_id == p["user"]["player"]), 
                None
            )
            
            if not found_player:
                return None
                
            return player_data.index(found_player)
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'index du joueur {player_id}: {e}")
            return None

    def transfert_player_to_other_cache(
        self, destination_sector: str, new_coordinates: Dict[str, int]
    ) -> str:
        """
        Transfère un joueur vers un autre secteur/cache.
        
        Args:
            destination_sector: ID du secteur de destination
            new_coordinates: Nouvelles coordonnées du joueur
            
        Returns:
            Nom de la nouvelle room
        """
        try:
            PlayerAction(self.user_calling).set_player_sector(
                destination_sector, new_coordinates
            )
            return f"play_{destination_sector}"
        except Exception as e:
            logger.error(f"Erreur lors du transfert du joueur: {e}")
            raise

    def get_user(self, player_id: int, room_name: Optional[str] = None) -> List[Dict]:
        """
        Récupère les données d'un utilisateur depuis une room spécifique.
        
        Args:
            player_id: ID du joueur
            room_name: Nom de la room (utilise self.room si None)
            
        Returns:
            Liste des données du joueur
        """
        try:
            target_room = room_name or self.room
            in_cache = cache.get(target_room)
            
            if not in_cache:
                return []
                
            return [
                key for key in in_cache.get('pc', []) 
                if key["user"]["player"] == player_id
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'utilisateur {player_id}: {e}")
            return []

    def delete_player_from_cache(self, player_id: int, old_room: Optional[str] = None) -> None:
        """
        Supprime un joueur du cache.
        
        Args:
            player_id: ID du joueur à supprimer
            old_room: Room de laquelle supprimer le joueur
        """
        if player_id == self.user_calling:
            return
            
        try:
            target_room = old_room or self.room
            in_cache = cache.get(target_room)
            
            if not in_cache:
                return
                
            in_cache["pc"] = [
                key for key in in_cache.get('pc', []) 
                if key["user"]["player"] != player_id
            ]
            cache.set(target_room, in_cache)
            
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du joueur {player_id}: {e}")

    def add_msg(self, user: str) -> None:
        """
        Ajoute un message au cache.
        
        Args:
            user: Nom d'utilisateur ayant envoyé le message
        """
        try:
            in_cache = cache.get(self.room)
            if not in_cache:
                return
                
            new_msg = in_cache.get("messages", [])
            new_msg.append({
                "username": user,
                "value": self.user_calling,
                "created_date": self.get_datetime_json(datetime.datetime.now()),
            })
            
            in_cache["messages"] = new_msg
            cache.set(self.room, in_cache)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'ajout du message: {e}")

    def get_sorted_messages(self) -> List[Dict]:
        """
        Récupère les messages triés par date de création.
        
        Returns:
            Liste des messages triés
        """
        try:
            cached_data = cache.get(self.room)
            if not cached_data:
                return []
                
            messages = cached_data.get("messages", [])
            return sorted(messages, key=lambda d: d["created_date"])
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des messages: {e}")
            return []

    def get_datetime_json(self, date_time: datetime.datetime) -> str:
        """
        Convertit un datetime en JSON.
        
        Args:
            date_time: Objet datetime à convertir
            
        Returns:
            Représentation JSON du datetime
        """
        return json.dumps(date_time, indent=4, sort_keys=True, default=str)

    @staticmethod
    def notify_room_users(room_id: str, message: str) -> None:
        """
        Notifie les utilisateurs d'une room.
        
        Args:
            room_id: ID de la room
            message: Message à envoyer
        """
        try:
            from channels.layers import get_channel_layer
            
            channel_layer = get_channel_layer()
            channel_layer.group_send(f"room_{room_id}", {
                "type": "async_remove_ship",
                "message": message
            })
        except Exception as e:
            logger.error(f"Erreur lors de la notification des utilisateurs de la room {room_id}: {e}")