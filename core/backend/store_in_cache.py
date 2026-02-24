import datetime
import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from functools import lru_cache
from django.core.cache import cache
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Prefetch, Q
from django.utils import timezone

from core.backend.get_data import GetDataFromDB
from core.backend.player_actions import PlayerAction

from core.models import (
    Sector, Player, Module, PlayerShipModule, PlayerShip,
    Npc, NpcTemplate, PlanetResource, AsteroidResource, 
    StationResource, WarpZone, SectorWarpZone, ShipWreck
)

logger = logging.getLogger(__name__)


class StoreInCache:
    """
    Gestionnaire de cache optimisé pour les données de secteur d'un jeu spatial.
    Optimisations: cache multi-niveau, requêtes bulk, réduction des appels DB.
    """
    
    # Cache de classe pour les données statiques
    _static_cache = {}
    _cache_timeout = 300  # 5 minutes
    
    def __init__(self, room_name: str, user_calling: Union[User, int]):
        """Initialise le gestionnaire avec optimisations."""
        self.room = room_name
        self.sector_pk = self._extract_sector_id(room_name)
        self.user_calling = user_calling if isinstance(user_calling, int) else user_calling.id
        self.from_DB = GetDataFromDB
        
        # Cache local pour éviter les recalculs répétés
        self._local_cache = {}
        self._last_cache_update = {}

    @staticmethod
    def _extract_sector_id(room_name: str) -> str:
        """Extrait l'ID du secteur avec validation."""
        try:
            parts = room_name.split("_")
            if len(parts) < 2 or not parts[1].isdigit():
                raise ValueError(f"Format de room_name invalide: {room_name}")
            return parts[1]
        except (IndexError, AttributeError):
            logger.error(f"Format de room_name invalide: {room_name}")
            raise ValueError(f"Format de room_name invalide: {room_name}")

    def get_or_set_cache(self, need_to_be_recreated: bool = False) -> Optional[Dict[str, Any]]:
        """Version optimisée avec gestion d'erreurs et cache intelligent."""
        cache_key = self.room
        
        try:
            # Vérification du cache existant
            if not need_to_be_recreated:
                cached_data = cache.get(cache_key)
                if cached_data and self._is_cache_valid(cached_data):
                    # Les carcasses sont très dynamiques (créées/expirées côté WS).
                    # On les rafraîchit depuis la DB pour éviter un cache stale au reload HTTP.
                    self._refresh_wrecks_in_cached_data(cached_data)
                    cache.set(cache_key, cached_data, self._cache_timeout)
                    return cached_data
            
            # Création/recréation du cache avec transaction
            with transaction.atomic():
                sector_data = self._build_sector_data_optimized(self.sector_pk)
                if sector_data:
                    cache.set(cache_key, sector_data, self._cache_timeout)
                    self._last_cache_update[cache_key] = datetime.datetime.now()
                return sector_data
                
        except Exception as e:
            logger.error(f"Erreur lors de la gestion du cache pour {cache_key}: {e}")
            # En cas d'erreur, tenter de retourner un cache existant
            return cache.get(cache_key)

    def _refresh_wrecks_in_cached_data(self, cached_data: Dict[str, Any]) -> None:
        """Rafraîchit la clé `wrecks` depuis la DB dans une structure de cache secteur existante."""
        if not isinstance(cached_data, dict):
            return
        cached_data["wrecks"] = []
        self._build_wrecks_bulk(cached_data, self.sector_pk)

    def _is_cache_valid(self, cached_data: Dict[str, Any]) -> bool:
        """Vérifie la validité du cache."""
        try:
            # Vérifications de base
            required_keys = ["sector", "pc", "npc", "sector_element"]
            return all(key in cached_data for key in required_keys)
        except Exception:
            return False

    def _get_sector_basic_info(self, sector_id: str) -> Optional[Dict[str, Any]]:
        """Cache des informations de base du secteur."""
        try:
            return Sector.objects.filter(id=sector_id).select_related(
                'security', 'faction'
            ).values(
                'id', 'name', 'description', 'image',
                'security_id', 'security__name',
                'faction_id', 'faction_id__name',
                'is_faction_level_starter'
            ).first()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du secteur {sector_id}: {e}")
            return None

    def _build_sector_data_optimized(self, pk: str) -> Optional[Dict[str, Any]]:
        """Version optimisée de la construction des données secteur."""
        try:
            # Récupération des données de base avec cache
            sector_info = self._get_sector_basic_info(pk)
            if not sector_info:
                logger.error(f"Secteur {pk} introuvable")
                return None

            # Initialisation de la structure
            sector_data = self._initialize_sector_structure_optimized(sector_info)
            
            # Construction optimisée des éléments avec requêtes bulk
            self._build_sector_elements_bulk(sector_data, pk)
            self._build_characters_bulk(sector_data, pk)
            self._build_wrecks_bulk(sector_data, pk)
             
            return sector_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la construction du secteur {pk}: {e}")
            return None

    def _initialize_sector_structure_optimized(self, sector_info: Dict[str, Any]) -> Dict[str, Any]:
        """Version optimisée de l'initialisation de structure."""
        return {
            "sector_element": [],
            "pc": [],
            "npc": [],
            "wrecks": [],
            "messages": [],
            "sector": {
                "id": sector_info["id"],
                "name": sector_info["name"],
                "description": sector_info["description"],
                "image": sector_info["image"],
                "security": {
                    "id": sector_info["security_id"],
                    "name": sector_info["security__name"],
                    "translated_name": sector_info["security__name"],
                },
                "faction": {
                    "id": sector_info["faction_id"],
                    "name": sector_info["faction_id__name"],
                    "is_faction_level_starter": sector_info["is_faction_level_starter"],
                    "translated_text_faction_level_starter": [],
                },
            }
        }

    def _build_sector_elements_bulk(self, sector_data: Dict[str, Any], sector_id: str) -> None:
        """Construction optimisée des éléments du secteur avec requêtes bulk."""
        try:
            # Requêtes bulk pour tous les types d'éléments
            elements_data = self._fetch_all_sector_elements(sector_id)
            
            # Traitement des différents types
            for element_type, elements in elements_data.items():
                if element_type == "warpzones":
                    self._process_warpzones_bulk(sector_data, elements)
                else:
                    self._process_standard_elements_bulk(sector_data, elements, element_type)
                    
        except Exception as e:
            logger.error(f"Erreur lors de la construction des éléments du secteur: {e}")

    def _fetch_all_sector_elements(self, sector_id: str) -> Dict[str, List]:
        """Récupère tous les éléments du secteur en une seule série de requêtes."""
        elements = {}
        
        try:
            # Planètes/éléments spatiaux
            elements["planets"] = list(PlanetResource.objects.filter(
                sector_id=sector_id
            ).select_related('source', 'resource').values(
                'id', 'data', 'coordinates', 'quantity', 'source_id',
                'source__size', 'source__name', 'source__data'
            ))
            
            # Astéroïdes
            elements["asteroids"] = list(AsteroidResource.objects.filter(
                sector_id=sector_id
            ).select_related('source', 'resource').values(
                'id', 'data', 'coordinates', 'quantity', 'source_id',
                'source__size', 'source__name', 'source__data'
            ))
            
            # Stations
            elements["stations"] = list(StationResource.objects.filter(
                sector_id=sector_id
            ).select_related('source', 'resource').values(
                'id', 'data', 'coordinates', 'source_id',
                'source__size', 'source__name', 'source__data'
            ))
            
            # Warpzones avec destination
            elements["warpzones"] = list(WarpZone.objects.filter(
                sector_id=sector_id
            ).select_related('source').prefetch_related(
                Prefetch(
                    'warp_home__warp_destination',
                    queryset=WarpZone.objects.select_related('source')
                )
            ).values(
                'id', 'data', 'coordinates', 'source_id',
                'source__name', 'source__size', 'source__data'
            ))
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des éléments: {e}")
            
        return elements

    def _process_standard_elements_bulk(self, sector_data: Dict[str, Any], 
                                    elements: List[Dict], element_type: str) -> None:
        """Traite les éléments standards en bulk."""
        for element in elements:
            try:
                resource_quantity = "unknown"
                if 'quantity' in element and element['quantity'] is not None:
                    resource_quantity = self.from_DB.get_resource_quantity_value(
                        element["quantity"], 100
                    )

                element_data = {
                    "item_id": element["id"],
                    "item_name": element["data"].get("name", "Unknown") if element["data"] else "Unknown",
                    "source_id": element["source_id"],
                    "sector_id": element.get("sector_id"),
                    "animations": element.get("source__data", {}).get("animation", []),
                    "data": {
                        "type": element.get("source__data", {}).get("type", element_type),
                        "name": element["data"].get("name", "Unknown") if element["data"] else "Unknown",
                        "coordinates": element["coordinates"],
                        "description": element["data"].get("description", "") if element["data"] else "",
                    },
                    "size": element.get("source__size", {"x": 1, "y": 1}),
                }
                
                sector_data["sector_element"].append(element_data)
                
            except Exception as e:
                logger.error(f"Erreur lors du traitement de l'élément {element.get('id', 'unknown')}: {e}")

    def _process_warpzones_bulk(self, sector_data: Dict[str, Any], warpzones: List[Dict]) -> None:
        """Traite les warpzones avec leurs destinations multiples."""
        
        # Récupération bulk des destinations (TOUTES les destinations par warpzone)
        warpzone_ids = [wz["id"] for wz in warpzones]
        
        # Récupération de toutes les destinations pour chaque warpzone
        destinations_queryset = SectorWarpZone.objects.filter(
            warp_home_id__in=warpzone_ids
        ).select_related('warp_destination').values(
            "id",
            "warp_home_id", 
            "warp_destination_id", 
            "warp_destination_id__data",
            "warp_destination_id__sector_id__name",
        )
        
        # Regroupement des destinations par warpzone (une warpzone peut avoir plusieurs destinations)
        destinations_by_warpzone = {}
        for dest in destinations_queryset:
            warp_home_id = dest["warp_home_id"]
            if warp_home_id not in destinations_by_warpzone:
                destinations_by_warpzone[warp_home_id] = []
            
            destinations_by_warpzone[warp_home_id].append({
                "id": dest["warp_destination_id"],
                "name": dest["warp_destination_id__data"].get("name", "Unknown") if dest["warp_destination_id__data"] else "Unknown",
                "destination_name": dest["warp_destination_id__sector_id__name"],
                "warp_link_id": dest["id"]  # ID de la liaison SectorWarpZone
            })
        
        # Traitement de chaque warpzone
        for warpzone in warpzones:
            try:
                warpzone_id = warpzone["id"]
                destinations = destinations_by_warpzone.get(warpzone_id, [])
                
                # On n'ajoute la warpzone que si elle a au moins une destination
                if destinations:
                    # Extraction des IDs et noms pour faciliter l'accès
                    sector_data["sector_element"].append({
                        "item_id": warpzone_id,
                        "item_name": warpzone.get('source__name', 'Unknown'),
                        "source_id": warpzone['source_id'],
                        "sector_id": warpzone.get('sector_id'),
                        "animations": warpzone.get('source__data', {}).get('animation', []),
                        "data": {
                            "type": "warpzone",
                            "name": warpzone["data"].get("name", "Unknown") if warpzone["data"] else "Unknown",
                            "coordinates": warpzone['coordinates'],
                            "description": warpzone["data"].get("description", "") if warpzone["data"] else "",
                            # Nouvelle structure pour gérer plusieurs destinations
                            "warp_home_id": warpzone_id,
                            "destinations": destinations,  # Liste complète avec tous les détails
                        },
                        "size": warpzone.get('source__size', {"x": 2, "y": 3}),
                    })
                else:
                    # Log optionnel pour les warpzones sans destination
                    logger.warning(f"Warpzone {warpzone_id} n'a aucune destination configurée")
                    
            except Exception as e:
                logger.error(f"Erreur lors du traitement de la warpzone {warpzone.get('id', 'unknown')}: {e}")

    def _build_characters_bulk(self, sector_data: Dict[str, Any], sector_id: str) -> None:
        """Construction optimisée des personnages (PC et NPC) avec requêtes bulk."""
        try:
            # Récupération bulk des NPCs
            npcs = self._fetch_npcs_bulk(sector_id)
            
            for npc_data in npcs:
                self._process_single_npc(sector_data, npc_data)
            
            # Récupération bulk des PCs
            pcs = self._fetch_pcs_bulk(sector_id)
            for pc_data in pcs:
                self._process_single_pc(sector_data, pc_data)
                
        except Exception as e:
            logger.error(f"Erreur lors de la construction des personnages: {e}")

    def _build_wrecks_bulk(self, sector_data: Dict[str, Any], sector_id: str) -> None:
        """Ajoute les carcasses actives au cache de secteur (reload HTTP / F5)."""
        try:
            now = timezone.now()
            wrecks = (
                ShipWreck.objects
                .select_related("ship", "ship__ship_category")
                .filter(
                    sector_id=sector_id,
                    status="ACTIVE",
                )
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            )

            for w in wrecks:
                coords = w.coordinates or {"x": 0, "y": 0}
                size = getattr(
                    getattr(getattr(w.ship, "ship_category", None), "size", None),
                    "copy",
                    lambda: {"x": 1, "y": 1},
                )()
                if not isinstance(size, dict):
                    size = {"x": 1, "y": 1}

                sector_data["wrecks"].append({
                    "wreck_id": w.id,
                    "wreck_key": f"wreck_{w.id}",
                    "origin_type": w.origin_type,
                    "coordinates": coords,
                    "size": {
                        "x": int(size.get("x", 1) or 1),
                        "y": int(size.get("y", 1) or 1),
                    },
                    "ship": {
                        "id": w.ship_id,
                        "name": w.ship.name if w.ship else None,
                        "image": w.ship.image if w.ship else None,
                    },
                    "expires_at": w.expires_at.isoformat() if w.expires_at else None,
                })
        except Exception as e:
            logger.error(f"Erreur lors de la construction des carcasses: {e}")

    def _fetch_npcs_bulk(self, sector_id: str) -> List[Dict]:
        """Récupère tous les NPCs du secteur avec leurs données."""
        return list(Npc.objects.filter(
            sector_id=sector_id
        ).exclude(
            status="DEAD"
        ).select_related(
            'npc_template', 'npc_template_id__ship', 
            'npc_template_id__ship_id__ship_category', 'faction'
        ).values(
            "id", "coordinates", "status", "hp", "movement",
            "ballistic_defense", "thermal_defense", "missile_defense",
            "npc_template_id", "npc_template_id__max_hp", "npc_template_id__max_movement",
            "npc_template_id__module_id_list", "npc_template_id__name", "npc_template_id__displayed_name",
            "faction_id__name", "npc_template_id__ship_id__image", "npc_template_id__ship_id__name",
            "npc_template_id__ship_id__ship_category_id__size", "npc_template_id__ship_id__ship_category_id__name",
            "npc_template_id__ship_id__ship_category_id__description", "npc_template_id__ship_id"
        ))

    def _fetch_pcs_bulk(self, sector_id: str) -> List[Dict]:
        """Récupère tous les PCs du secteur avec leurs données."""
        return list(PlayerShipModule.objects.filter(
            player_ship_id__player_id__sector_id=sector_id,
            player_ship_id__is_current_ship=True
        ).select_related(
            'player_ship', 'player_ship_id__player', 'player_ship_id__ship',
            'player_ship_id__ship_id__ship_category', 'player_ship_id__player_id__faction',
            'player_ship_id__player_id__archetype'
        ).values(
            "player_ship_id", "player_ship_id__player_id", "player_ship_id__ship_id",
            "player_ship_id__player_id__name", "player_ship_id__player_id__coordinates",
            "player_ship_id__player_id__image", "player_ship_id__player_id__description",
            "player_ship_id__player_id__is_npc", "player_ship_id__player_id__current_ap",
            "player_ship_id__player_id__max_ap", "player_ship_id__player_id__faction_id__name",
            "player_ship_id__player_id__archetype__name", "player_ship_id__player_id__archetype__data",
            "player_ship_id__player_id__sector__name", "player_ship_id__ship_id__name",
            "player_ship_id__ship_id__image", "player_ship_id__ship_id__description",
            "player_ship_id__is_current_ship", "player_ship_id__is_reversed",
            "player_ship_id__current_hp", "player_ship_id__max_hp",
            "player_ship_id__current_movement", "player_ship_id__max_movement",
            "player_ship_id__current_missile_defense", "player_ship_id__current_ballistic_defense",
            "player_ship_id__current_thermal_defense", "player_ship_id__max_missile_defense",
            "player_ship_id__max_ballistic_defense", "player_ship_id__max_thermal_defense",
            "player_ship_id__current_cargo_size", "player_ship_id__status",
            "player_ship_id__ship_id__module_slot_available",
            "player_ship_id__ship_id__ship_category_id__name",
            "player_ship_id__ship_id__ship_category_id__description",
            "player_ship_id__ship_id__ship_category_id__size",
            "player_ship_id__view_range"
        ).distinct())

    def _process_single_npc(self, sector_data: Dict[str, Any], npc_data: Dict) -> None:
        """Traite un NPC individuel."""
        try:
            module_list = self._get_module_list_cached(
                npc_data["npc_template_id__module_id_list"]
            )

            npc_entry = {
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
                    "ship_id": npc_data["npc_template_id"],
                    "current_hp": int(npc_data["hp"]),
                    "max_hp": int(npc_data["npc_template_id__max_hp"]),
                    "current_movement": int(npc_data["movement"]),
                    "max_movement": int(npc_data["npc_template_id__max_movement"]),
                    "current_ballistic_defense": npc_data["ballistic_defense"],
                    "current_thermal_defense": npc_data["thermal_defense"],
                    "current_missile_defense": npc_data["missile_defense"],
                    "status": npc_data["status"],
                    "category_name": npc_data["npc_template_id__ship_id__ship_category_id__name"],
                    "category_description": npc_data["npc_template_id__ship_id__ship_category_id__description"],
                    "size": npc_data["npc_template_id__ship_id__ship_category_id__size"],
                    "modules": module_list,
                    "modules_range": self.from_DB.is_in_range(
                        sector_data["sector"]["id"],
                        npc_data["id"],
                        is_npc=True
                    ),
                },
            }
            self._strip_npc_cache_data(npc_entry)

            sector_data["npc"].append(npc_entry)

        except Exception as e:
            logger.error(
                f"Erreur lors du traitement du NPC {npc_data.get('id', 'unknown')}: {e}"
            )


    def _process_single_pc(self, sector_data: Dict[str, Any], pc_data: Dict) -> None:
        """Traite un PC individuel."""
        try:
            module_list = self._get_player_module_list_cached(pc_data["player_ship_id"])
            visible_zone = self.from_DB.current_player_observable_zone(pc_data["player_ship_id__player_id"])
            
            pc_entry = {
                "user": {
                    "player": pc_data["player_ship_id__player_id"],
                    "name": pc_data["player_ship_id__player_id__name"],
                    "coordinates": pc_data["player_ship_id__player_id__coordinates"],
                    "image": pc_data["player_ship_id__player_id__image"],
                    "description": pc_data["player_ship_id__player_id__description"],
                    "is_npc": pc_data["player_ship_id__player_id__is_npc"],
                    "current_ap": pc_data["player_ship_id__player_id__current_ap"],
                    "max_ap": pc_data["player_ship_id__player_id__max_ap"],
                    "archetype_name": pc_data["player_ship_id__player_id__archetype__name"],
                    "archetype_data": pc_data["player_ship_id__player_id__archetype__data"],
                    "sector_name": pc_data["player_ship_id__player_id__sector__name"],
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
                    "category_name": pc_data["player_ship_id__ship_id__ship_category_id__name"],
                    "category_description": pc_data["player_ship_id__ship_id__ship_category_id__description"],
                    "size": pc_data["player_ship_id__ship_id__ship_category_id__size"],
                    "is_reversed": pc_data["player_ship_id__is_reversed"],
                    "visible_zone": visible_zone,
                    "view_range": pc_data["player_ship_id__view_range"]
                },
            }
            
            self._strip_pc_cache_data(pc_entry)
            sector_data["pc"].append(pc_entry)
                
        except Exception as e:
            logger.error(f"Erreur lors du traitement du PC: {e}")
        

    def _get_module_list_cached(self, module_id_list: tuple) -> List[Dict[str, Any]]:
        
        """Version cachée de la récupération des modules pour NPCs."""
        if not module_id_list:
            return []
        
        return list(Module.objects.filter(
            id__in=module_id_list
        ).values("name", "description", "effect", "type", "id"))

    def _get_player_module_list_cached(self, player_ship_id: int) -> List[Dict[str, Any]]:
        """Version optimisée pour les modules des joueurs."""
        cache_key = f"player_modules_{player_ship_id}"
        cached_modules = self._local_cache.get(cache_key)
        
        if cached_modules is None:
            cached_modules = list(PlayerShipModule.objects.filter(
                player_ship_id=player_ship_id
            ).select_related('module').values(
                "module__name", "module__description",
                "module__effect", "module__type", "module_id"
            ))
            self._local_cache[cache_key] = cached_modules
            
        return [
            {
                "name": module["module__name"],
                "effect": module["module__effect"],
                "description": module["module__description"],
                "type": module["module__type"],
                "id": module["module_id"],
            }
            for module in cached_modules
        ]

    def _has_scanning_module(self, module_list: List[Dict[str, Any]]) -> bool:
        """Vérifie la présence d'un module de scan."""
        return any(module.get('name') == "spaceship probe" for module in module_list)

    # === Méthodes d'accès aux données optimisées ===

    def get_other_player_data(self, player_id: int) -> Optional[List[Dict[str, Any]]]:
        """Version optimisée avec gestion d'erreurs."""
        try:
            cached_data = cache.get(self.room)
            if not cached_data or "pc" not in cached_data:
                return []
            
            return [
                player for player in cached_data["pc"] 
                if player.get("user", {}).get("player") != player_id
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des autres joueurs: {e}")
            return []

    def get_current_player_data(self, player_id: int) -> Optional[List[Dict[str, Any]]]:
        """Version optimisée pour le joueur actuel."""
        try:
            cached_data = cache.get(self.room)
            if not cached_data or "pc" not in cached_data:
                return []
            
            return [
                player for player in cached_data["pc"] 
                if player.get("user", {}).get("player") == player_id
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du joueur actuel: {e}")
            return []

    def get_specific_player_data(self, player_id: int, category: str = "", subcategory: str = "", search: str = "") -> Any:
        """Version optimisée avec cache local."""
        cache_key = f"player_data_{player_id}_{category}_{subcategory}_{search}"
        
        # Vérification du cache local
        if cache_key in self._local_cache:
            cache_time = self._last_cache_update.get(cache_key)
            if cache_time and (datetime.datetime.now() - cache_time).seconds < 30:
                return self._local_cache[cache_key]
        
        try:
            cached_data = cache.get(self.room)
            if not cached_data or category not in cached_data:
                return None
            
            player_data = next(
                (p for p in cached_data[category] 
                if p.get("user", {}).get("player") == player_id),
                None
            )
            
            if not player_data:
                return None
            
            result = player_data
            if subcategory and search:
                result = player_data.get(subcategory, {}).get(search)
            elif subcategory:
                result = player_data.get(subcategory)
            
            # Mise en cache locale
            self._local_cache[cache_key] = result
            self._last_cache_update[cache_key] = datetime.datetime.now()
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données spécifiques: {e}")
            return None

    def get_sector_data(self) -> Optional[Dict[str, Any]]:
        """Version optimisée de la récupération des données secteur."""
        try:
            cached_data = cache.get(self.room)
            if not cached_data:
                # Tentative de reconstruction du cache
                cached_data = self.get_or_set_cache(need_to_be_recreated=True)
            
            return cached_data.get("sector") if cached_data else None
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données secteur: {e}")
            return None

    # === Méthodes de mise à jour optimisées ===

    def update_player_position(self, pos: Dict[str, Any], current_player_id: int) -> bool:
        """Version optimisée avec transaction atomique."""
        try:
            with cache.lock(f"{self.room}_position_lock", timeout=5):
                cached_data = cache.get(self.room)
                if not cached_data:
                    return False
                
                player_list = cached_data["pc"]
                player_id = pos["player"]
                
                # Recherche optimisée du joueur
                player_index = next(
                    (i for i, p in enumerate(player_list) 
                    if p.get("user", {}).get("player") == player_id),
                    None
                )
                
                if player_index is None:
                    return False
                
                # Mise à jour atomique des coordonnées
                player_list[player_index]["user"]["coordinates"] = {
                    "x": int(pos["end_x"]),
                    "y": int(pos["end_y"]),
                }
                
                # Mise à jour du mouvement : toujours depuis la DB
                current_movement = PlayerShip.objects.filter(
                    player_id=player_id, is_current_ship=True
                ).values_list('current_movement', flat=True).first()

                if current_movement is not None:
                    player_list[player_index]["ship"]["current_movement"] = current_movement
                
                # Nettoyage des doublons
                self._remove_duplicate_players_optimized(player_list, player_index, pos)
                
                cached_data["pc"] = player_list
                cache.set(self.room, cached_data, self._cache_timeout)
                
                # Nettoyage du cache local
                self._invalidate_local_cache()
                
                return True
                
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de la position: {e}")
            return False

    def _remove_duplicate_players_optimized(self, player_list: List[Dict], 
                                            updated_index: int, pos: Dict[str, Any]) -> None:
        """Version optimisée du nettoyage des doublons."""
        target_player_id = pos["player"]
        target_x, target_y = int(pos["end_x"]), int(pos["end_y"])
        
        # Suppression en une seule passe
        indices_to_remove = []
        for i, player in enumerate(player_list):
            if (i != updated_index and 
                player.get("user", {}).get("player") == target_player_id):
                coords = player.get("user", {}).get("coordinates", {})
                if coords.get("x") != target_x or coords.get("y") != target_y:
                    indices_to_remove.append(i)
        
        # Suppression en ordre inverse
        for i in reversed(indices_to_remove):
            player_list.pop(i)

    def update_sector_player_visibility_zone(self, player_id: int) -> None:
        """Mise à jour optimisée de la zone de visibilité."""
        try:
            with cache.lock(f"{self.room}_visibility_lock", timeout=5):
                cached_data = cache.get(self.room)
                if not cached_data:
                    return
                
                player_list = cached_data["pc"]
                player_index = next(
                    (i for i, p in enumerate(player_list) 
                    if p.get("user", {}).get("player") == player_id),
                    None
                )
                
                if player_index is not None:
                    new_visibility = self.from_DB.current_player_observable_zone(player_id)
                    player_list[player_index]["ship"]["visible_zone"] = new_visibility
                    
                    cached_data["pc"] = player_list
                    cache.set(self.room, cached_data, self._cache_timeout)
                    
                    # Invalidation du cache local
                    self._invalidate_local_cache()
                    
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de la visibilité: {e}")

    def update_player_range_finding(self, target_player_id: Optional[int] = None) -> None:
        """Mise à jour optimisée des portées avec cache."""
        try:
            
            with cache.lock(f"{self.room}_range_lock", timeout=5):
                cached_data = cache.get(self.room)
                if not cached_data:
                    return
                
                player_list = cached_data["pc"]
                player_index = next(
                    (i for i, p in enumerate(player_list) 
                    if p.get("user", {}).get("user") == self.user_calling),
                    None
                )
                
                if player_index is not None:
                    # Récupération du secteur
                    if target_player_id:
                        player_sector = Player.objects.filter(
                            id=target_player_id
                        ).values_list('sector_id', flat=True).first()
                    else:
                        player_action = PlayerAction(self.user_calling)
                        player_sector = player_action.get_player_sector()
                    
                    if player_sector:
                        new_range = self.from_DB.is_in_range(
                            player_sector, self.user_calling, is_npc=False
                        )
                        player_list[player_index]["ship"]["modules_range"] = new_range
                        
                        cached_data["pc"] = player_list
                        cache.set(self.room, cached_data, self._cache_timeout)
                        
                        # Invalidation du cache local
                        self._invalidate_local_cache()
                        
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des portées: {e}")

    def _invalidate_local_cache(self) -> None:
        """Invalide le cache local."""
        self._local_cache.clear()
        self._last_cache_update.clear()

    # === Méthodes utilitaires optimisées ===

    def delete_player_from_cache(self, player_id: int, old_room: Optional[str] = None) -> None:
        """Suppression optimisée d'un joueur du cache."""
        if player_id == self.user_calling:
            return
        
        target_room = old_room or self.room
        
        try:
            with cache.lock(f"{target_room}_delete_lock", timeout=5):
                cached_data = cache.get(target_room)
                if not cached_data:
                    return
                
                
                # Filtrage optimisé
                cached_data["pc"] = [
                    player for player in cached_data.get('pc', [])
                    if player.get("user", {}).get("player") != player_id
                ]
                cache.set(target_room, cached_data, self._cache_timeout)
                
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du joueur {player_id}: {e}")

    @staticmethod
    def get_datetime_json(date_time: datetime.datetime) -> str:
        """Conversion optimisée datetime vers JSON."""
        return date_time.isoformat()
    
    @staticmethod
    def _strip_pc_cache_data(pc_data: dict):
        # USER
        for key in [
            "description",
            "image",
            "current_ap",
            "max_ap",
            "archetype_name",
            "archetype_data",
        ]:
            pc_data.get("user", {}).pop(key, None)

        # FACTION
        pc_data.get("faction", {}).pop("name", None)

        # SHIP
        ship = pc_data.get("ship", {})
        for key in [
            "max_hp",
            "current_hp",
            "description",
            "max_movement",
            "current_movement",
            "current_ballistic_defense",
            "current_thermal_defense",
            "current_missile_defense",
            "max_ballistic_defense",
            "max_thermal_defense",
            "max_missile_defense",
            "current_cargo_size",
            "module_slot_available",
            "module_slot_already_in_use",
            "modules",
            "modules_range",
            "ship_scanning_module_available",
            "category_name",
            "category_description",
        ]:
            ship.pop(key, None)
    
    @staticmethod
    def _strip_npc_cache_data(npc_data: dict):
        ship = npc_data.get("ship", {})
        for key in [
            "current_hp",
            "max_hp",
            "current_movement",
            "max_movement",
            "current_ballistic_defense",
            "current_thermal_defense",
            "current_missile_defense",
            "category_name",
            "category_description",
            "modules",
            "modules_range",
        ]:
            ship.pop(key, None)
