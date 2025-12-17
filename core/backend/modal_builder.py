from typing import Optional, Dict, Any, List
from django.db.models import Prefetch

from core.models import (
    Player,
    PlayerShip,
    PlayerShipModule,
    Npc,
    Module,
    PlanetResource, 
    AsteroidResource, 
    StationResource,
    WarpZone, 
    SectorWarpZone
)
from core.backend.get_data import GetDataFromDB


def build_pc_modal_data(player_id: int) -> Optional[Dict[str, Any]]:
    """
    Reconstruit EXACTEMENT la structure PC telle que stockée dans StoreInCache,
    mais sans utiliser le cache.
    """

    # -------------------------------------------------
    # 1) Récupération Player + faction + archetype
    # -------------------------------------------------
    player = (
        Player.objects
        .select_related("faction", "archetype", "sector")
        .filter(id=player_id)
        .first()
    )

    if not player:
        return None

    # -------------------------------------------------
    # 2) Vaisseau courant
    # -------------------------------------------------
    ship = (
        PlayerShip.objects
        .select_related("ship__ship_category")
        .filter(player_id=player_id, is_current_ship=True)
        .first()
    )

    if not ship:
        return None

    # -------------------------------------------------
    # 3) Modules du vaisseau
    # -------------------------------------------------
    modules_qs = (
        PlayerShipModule.objects
        .select_related("module")
        .filter(player_ship=ship)
        .values(
            "module__name",
            "module__description",
            "module__effect",
            "module__type",
            "module_id"
        )
    )

    modules: List[Dict[str, Any]] = [
        {
            "name": m["module__name"],
            "effect": m["module__effect"],
            "description": m["module__description"],
            "type": m["module__type"],
            "id": m["module_id"],
        }
        for m in modules_qs
    ]

    # -------------------------------------------------
    # 4) Portées (modules_range)
    # -------------------------------------------------
    modules_range = GetDataFromDB.is_in_range(
        player.sector_id,
        player.id,
        is_npc=False
    )

    # -------------------------------------------------
    # 5) Zone visible
    # -------------------------------------------------
    visible_zone = GetDataFromDB.current_player_observable_zone(player.id)

    # -------------------------------------------------
    # 6) Construction STRUCTURE CACHE-LIKE
    # -------------------------------------------------
    return {
        "user": {
            "player": player.id,
            "name": player.name,
            "coordinates": player.coordinates,
            "image": player.image,
            "description": player.description,
            "is_npc": player.is_npc,
            "current_ap": player.current_ap,
            "max_ap": player.max_ap,
            "archetype_name": player.archetype.name if player.archetype else None,
            "archetype_data": player.archetype.data if player.archetype else {},
            "sector_name": player.sector.name if player.sector else None,
        },
        "faction": {
            "name": player.faction.name if player.faction else None,
        },
        "ship": {
            "name": ship.ship.name,
            "image": ship.ship.image,
            "ship_id": ship.ship_id,
            "description": ship.ship.description,
            "max_hp": ship.max_hp,
            "current_hp": ship.current_hp,
            "max_movement": ship.max_movement,
            "current_movement": ship.current_movement,
            "current_ballistic_defense": ship.current_ballistic_defense,
            "current_thermal_defense": ship.current_thermal_defense,
            "current_missile_defense": ship.current_missile_defense,
            "max_ballistic_defense": ship.max_ballistic_defense,
            "max_thermal_defense": ship.max_thermal_defense,
            "max_missile_defense": ship.max_missile_defense,
            "current_cargo_size": ship.current_cargo_size,
            "status": ship.status,
            "module_slot_available": ship.ship.module_slot_available,
            "module_slot_already_in_use": len(modules),
            "modules": modules,
            "modules_range": modules_range,
            "ship_scanning_module_available": any(
                m["name"] == "spaceship probe" for m in modules
            ),
            "category_name": ship.ship.ship_category.name,
            "category_description": ship.ship.ship_category.description,
            "size": ship.ship.ship_category.size,
            "is_reversed": ship.is_reversed,
            "visible_zone": visible_zone,
            "view_range": ship.view_range,
        },
    }

def build_npc_modal_data(npc_id: int) -> Optional[Dict[str, Any]]:
    """
    Reconstruit EXACTEMENT la structure NPC telle que stockée dans StoreInCache,
    mais sans utiliser le cache.
    """

    npc = (
        Npc.objects
        .select_related(
            "npc_template",
            "npc_template__ship",
            "npc_template__ship__ship_category",
            "faction",
        )
        .filter(id=npc_id)
        .first()
    )

    if not npc:
        return None

    # -----------------------------
    # Modules (depuis le template)
    # -----------------------------
    module_ids = npc.npc_template.module_id_list or []
    modules: List[Dict[str, Any]] = []

    if module_ids:
        modules = list(
            Module.objects
            .filter(id__in=module_ids)
            .values("name", "description", "effect", "type", "id")
        )

    # -----------------------------
    # Portées (modules_range)
    # -----------------------------
    modules_range = GetDataFromDB.is_in_range(
        npc.sector_id,
        npc.id,
        is_npc=True
    )

    # -----------------------------
    # Structure cache-like
    # -----------------------------
    return {
        "npc": {
            "id": npc.id,
            "name": npc.npc_template.name,
            "displayed_name": npc.npc_template.displayed_name,
            "coordinates": npc.coordinates,
        },
        "faction": {
            "name": npc.faction.name if npc.faction else None,
        },
        "ship": {
            "name": npc.npc_template.ship.name,
            "image": npc.npc_template.ship.image,
            "ship_id": npc.npc_template_id,
            "current_hp": int(npc.hp),
            "max_hp": int(npc.npc_template.max_hp),
            "current_movement": int(npc.movement),
            "max_movement": int(npc.npc_template.max_movement),
            "current_ballistic_defense": npc.ballistic_defense,
            "current_thermal_defense": npc.thermal_defense,
            "current_missile_defense": npc.missile_defense,
            "status": npc.status,
            "category_name": npc.npc_template.ship.ship_category.name,
            "category_description": npc.npc_template.ship.ship_category.description,
            "size": npc.npc_template.ship.ship_category.size,
            "modules": modules,
            "modules_range": modules_range,
        },
    }
    
def _build_standard_foreground_cache_like(
    qs_model,
    element_id: int,
    element_type: str
) -> Optional[Dict[str, Any]]:
    """
    Reconstruit un sector_element standard (planet / asteroid / station)
    au format cache-like, DB-only.
    """

    element = (
        qs_model.objects
        .select_related("source", "resource")
        .filter(id=element_id)
        .first()
    )

    if not element:
        return None

    # Quantité de ressource (si présente)
    resource_block = None
    if hasattr(element, "quantity") and element.quantity is not None:
        quantity_str = GetDataFromDB.get_resource_quantity_value(
            element.quantity, 100
        )
        resource_block = {
            "id": element.source_id,
            "name": element.source.name if element.source else "Unknown",
            "quantity": element.quantity,
            "quantity_str": quantity_str,
            "translated_quantity_str": quantity_str,
        }

    data = {
        "item_id": element.id,
        "item_name": element.data.get("name", "Unknown") if element.data else "Unknown",
        "source_id": element.source_id,
        "sector_id": element.sector_id,
        "animations": element.source.data.get("animation", []) if element.source and element.source.data else [],
        "data": {
            "type": element.source.data.get("type", element_type) if element.source and element.source.data else element_type,
            "name": element.data.get("name", "Unknown") if element.data else "Unknown",
            "coordinates": element.coordinates,
            "description": element.data.get("description", "") if element.data else "",
        },
        "size": element.source.size if element.source else {"x": 1, "y": 1},
    }

    if resource_block:
        data["resource"] = resource_block

    return data

def build_warpzone_cache_like(warpzone_id: int) -> Optional[Dict[str, Any]]:
    """
    Reconstruit une warpzone au format cache-like, DB-only,
    avec toutes ses destinations.
    """

    warpzone = (
        WarpZone.objects
        .select_related("source")
        .filter(id=warpzone_id)
        .first()
    )

    if not warpzone:
        return None

    # Récupération de TOUTES les destinations
    destinations_qs = (
        SectorWarpZone.objects
        .select_related("warp_destination__sector")
        .filter(warp_home_id=warpzone.id)
        .values(
            "id",
            "warp_destination_id",
            "warp_destination__data",
            "warp_destination__sector__name",
        )
    )

    destinations = []
    for d in destinations_qs:
        destinations.append({
            "id": d["warp_destination_id"],
            "name": d["warp_destination__data"].get("name", "Unknown") if d["warp_destination__data"] else "Unknown",
            "destination_name": d["warp_destination__sector__name"],
            "warp_link_id": d["id"],
        })

    return {
        "item_id": warpzone.id,
        "item_name": warpzone.source.name if warpzone.source else "Unknown",
        "source_id": warpzone.source_id,
        "sector_id": warpzone.sector_id,
        "animations": warpzone.source.data.get("animation", []) if warpzone.source and warpzone.source.data else [],
        "data": {
            "type": "warpzone",
            "name": warpzone.data.get("name", "Unknown") if warpzone.data else "Unknown",
            "coordinates": warpzone.coordinates,
            "description": warpzone.data.get("description", "") if warpzone.data else "",
            "warp_home_id": warpzone.id,
            "destinations": destinations,
        },
        "size": warpzone.source.size if warpzone.source else {"x": 2, "y": 3},
    }
    
def build_sector_element_modal_data(
    element_type: str,
    element_id: int
) -> Optional[Dict[str, Any]]:
    """
    Routeur DB-only pour tous les sector_element.
    """

    if element_type == "planet" or element_type == "satellite" or element_type == "star":
        return _build_standard_foreground_cache_like(
            PlanetResource, element_id, "planet"
        )

    if element_type == "asteroid":
        return _build_standard_foreground_cache_like(
            AsteroidResource, element_id, "asteroid"
        )

    if element_type == "station":
        return _build_standard_foreground_cache_like(
            StationResource, element_id, "station"
        )

    if element_type == "warpzone":
        return build_warpzone_cache_like(element_id)

    return None
