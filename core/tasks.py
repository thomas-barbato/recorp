import datetime
import logging
from typing import Any, Dict, Optional

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from core.backend.get_data import GetDataFromDB
from core.backend.player_actions import PlayerAction
from core.backend.store_in_cache import StoreInCache
from core.models import Npc, NpcResource, NpcTemplateResource, PlayerShip, ShipWreck

logger = logging.getLogger("django")

NPC_RESPAWN_DELAY_SECONDS = 120


def _group_send(room_key: str, event_type: str, payload: Dict[str, Any]) -> None:
    layer = get_channel_layer()
    if not layer or not room_key:
        return
    async_to_sync(layer.group_send)(room_key, {"type": event_type, "payload": payload})


def _update_room_cache_on_wreck_expired(room_key: str, wreck_id: Any) -> None:
    room_cache = cache.get(room_key)
    if not isinstance(room_cache, dict):
        return
    room_cache["wrecks"] = [
        w for w in (room_cache.get("wrecks", []) or [])
        if str(w.get("wreck_id")) != str(wreck_id)
    ]
    cache.set(room_key, room_cache)


def _expire_wreck_and_purge_source_ship(wreck_id: int) -> Optional[Dict[str, Any]]:
    try:
        with transaction.atomic():
            wreck = (
                ShipWreck.objects.select_for_update()
                .filter(id=wreck_id, status__in=["ACTIVE", "EXPIRED"])
                .first()
            )
            if not wreck:
                return None

            sector_id = wreck.sector_id
            metadata = wreck.metadata if isinstance(wreck.metadata, dict) else {}
            source_player_ship_id = metadata.get("source_player_ship_id")
            source_actor_key = str(metadata.get("source_actor_key") or "")

            if not source_player_ship_id and wreck.origin_type == "PC" and source_actor_key.startswith("pc_"):
                try:
                    dead_player_id = int(source_actor_key.split("_", 1)[1])
                except Exception:
                    dead_player_id = None
                if dead_player_id:
                    source_player_ship_id = (
                        PlayerShip.objects.filter(
                            player_id=dead_player_id,
                            status="DEAD",
                            is_current_ship=False,
                        )
                        .order_by("-updated_at", "-id")
                        .values_list("id", flat=True)
                        .first()
                    )

            if source_player_ship_id:
                PlayerShip.objects.filter(
                    id=source_player_ship_id,
                    status="DEAD",
                    is_current_ship=False,
                ).delete()

            wreck.delete()

            return {
                "wreck_id": wreck_id,
                "wreck_key": f"wreck_{wreck_id}",
                "sector_id": sector_id,
                "purged_source_ship_id": source_player_ship_id,
            }
    except Exception:
        logger.exception(f"[CeleryTick] Failed to expire/purge wreck {wreck_id}")
        return None


def _choose_npc_respawn_coord(npc, sector_id: int, ship_size_x: int, ship_size_y: int) -> Optional[Dict[str, int]]:
    try:
        pa = PlayerAction(None)
        padding_w = int(ship_size_x) + int(getattr(pa, "MIN_PADDING", 3) or 3)
        padding_h = int(ship_size_y) + int(getattr(pa, "MIN_PADDING", 3) or 3)

        preferred = npc.spawn_coordinates or None
        if isinstance(preferred, dict) and preferred.get("x") is not None and preferred.get("y") is not None:
            preferred = {"x": int(preferred.get("x", 0) or 0), "y": int(preferred.get("y", 0) or 0)}
        else:
            preferred = None

        if preferred:
            sector_data = GetDataFromDB.get_items_from_sector(sector_id, with_npc=True)
            if sector_data and len(sector_data) >= 6:
                planets, asteroids, stations, warpzones, npcs, pcs = sector_data
                npcs = [n for n in (npcs or []) if str(n.get("id")) != str(getattr(npc, "id", ""))]
                occupied = pa._get_all_occupied_coordinates({
                    "planet": planets or [],
                    "asteroid": asteroids or [],
                    "station": stations or [],
                    "warpzone": warpzones or [],
                    "npc": npcs or [],
                    "pc": pcs or [],
                })

                if pa._can_place_ship_at_position(preferred, occupied, ship_size_x, ship_size_y):
                    return preferred

                sector_size = int(getattr(pa, "SECTOR_SIZE", 40) or 40)
                candidates = []
                px, py = preferred["x"], preferred["y"]
                for y in range(sector_size):
                    for x in range(sector_size):
                        candidates.append((abs(x - px) + abs(y - py), abs(y - py), abs(x - px), y, x))
                candidates.sort()
                for _, _, _, y, x in candidates:
                    pos = {"x": x, "y": y}
                    if pa._can_place_ship_at_position(pos, occupied, ship_size_x, ship_size_y):
                        return pos

        return pa._calculate_destination_coord(
            sector_id,
            ship_size_x,
            ship_size_y,
            padding_h,
            padding_w,
        )
    except Exception:
        logger.exception(f"[CeleryTick] NPC respawn coord resolve failed for npc_id={getattr(npc, 'id', None)}")
        return None


def _build_npc_added_payload_from_cache(npc_id: int, sector_id: int) -> Optional[Dict[str, Any]]:
    room_key = f"play_{sector_id}"
    try:
        # `StoreInCache` exige un user/id appelant; un entier suffit ici pour rebuild server-side.
        sic = StoreInCache(room_key, 1)
        sic.get_or_set_cache(need_to_be_recreated=True)
        cached = sic.get_or_set_cache(need_to_be_recreated=False) or {}
        npc_entry = next(
            (n for n in (cached.get("npc", []) or []) if str((n.get("npc", {}) or {}).get("id")) == str(npc_id)),
            None,
        )
        if not npc_entry:
            return None
        return {"npc": npc_entry}
    except Exception:
        logger.exception(f"[CeleryTick] npc payload build failed for npc_id={npc_id}")
        return None


def _respawn_npc_and_build_payload(npc_id: int) -> Optional[Dict[str, Any]]:
    try:
        with transaction.atomic():
            npc = (
                Npc.objects.select_for_update()
                .select_related("npc_template", "npc_template__ship", "npc_template__ship__ship_category")
                .filter(id=npc_id, status="DEAD")
                .first()
            )
            if not npc or not npc.npc_template or not npc.npc_template.ship or not npc.sector_id:
                return None

            tpl = npc.npc_template
            ship = tpl.ship
            sector_id = int(npc.sector_id)

            ship_size = getattr(getattr(ship, "ship_category", None), "size", None) or {"x": 1, "y": 1}
            if not isinstance(ship_size, dict):
                ship_size = {"x": 1, "y": 1}
            ship_size_x = int(ship_size.get("x", 1) or 1)
            ship_size_y = int(ship_size.get("y", 1) or 1)

            respawn_coord = _choose_npc_respawn_coord(npc, sector_id, ship_size_x, ship_size_y) or (
                npc.spawn_coordinates or npc.coordinates or {"x": 0, "y": 0}
            )

            npc.current_ap = int(npc.max_ap or 0)
            npc.hp = int(tpl.max_hp or 0)
            npc.movement = int(tpl.max_movement or 0)
            npc.missile_defense = int(tpl.max_missile_defense or 0)
            npc.thermal_defense = int(tpl.max_thermal_defense or 0)
            npc.ballistic_defense = int(tpl.max_ballistic_defense or 0)
            npc.coordinates = respawn_coord
            npc.status = "FULL"
            npc.save()

            NpcResource.objects.filter(npc_id=npc.id).delete()
            for tr in NpcTemplateResource.objects.filter(npc_template_id=tpl.id).values("resource_id", "quantity"):
                rid = tr.get("resource_id")
                if rid is None:
                    continue
                NpcResource.objects.create(
                    npc_id=npc.id,
                    resource_id=rid,
                    quantity=int(tr.get("quantity", 0) or 0),
                )

        payload = _build_npc_added_payload_from_cache(npc_id, sector_id)
        if isinstance(payload, dict):
            payload["sector_id"] = sector_id
        return payload
    except Exception:
        logger.exception(f"[CeleryTick] NPC respawn failed for npc_id={npc_id}")
        return None


@shared_task(name="core.tasks.game_world_tick")
def game_world_tick() -> Dict[str, int]:
    """
    Tick périodique backend (Celery Beat) pour les événements temporels du monde.
    Remplace progressivement les traitements "lazy" dépendants d'une action joueur.
    """
    now = timezone.now()
    counts = {
        "wrecks_expired": 0,
        "npcs_respawned": 0,
    }

    # --- Wrecks expirés (ACTIVE + rattrapage EXPIRED historiques) ---
    try:
        due_wreck_ids = list(
            ShipWreck.objects.filter(
                status="ACTIVE",
                expires_at__isnull=False,
                expires_at__lte=now,
            ).values_list("id", flat=True)
        )
        stale_wreck_ids = list(
            ShipWreck.objects.filter(status="EXPIRED").values_list("id", flat=True)
        )
        for wreck_id in [*due_wreck_ids, *stale_wreck_ids]:
            payload = _expire_wreck_and_purge_source_ship(int(wreck_id))
            if not payload:
                continue
            room_key = f"play_{payload['sector_id']}"
            _update_room_cache_on_wreck_expired(room_key, payload["wreck_id"])
            _group_send(room_key, "wreck_expired", payload)
            counts["wrecks_expired"] += 1
    except Exception:
        logger.exception("[CeleryTick] Wreck sweep failed")

    # --- Respawn NPC ---
    try:
        threshold = now - datetime.timedelta(seconds=NPC_RESPAWN_DELAY_SECONDS)
        due_npc_ids = list(
            Npc.objects.filter(status="DEAD", updated_at__lte=threshold)
            .exclude(sector_id__isnull=True)
            .values_list("id", flat=True)
        )
        for npc_id in due_npc_ids:
            payload = _respawn_npc_and_build_payload(int(npc_id))
            if not payload:
                continue
            real_sector_id = payload.get("sector_id") or Npc.objects.filter(id=npc_id).values_list("sector_id", flat=True).first()
            if not real_sector_id:
                continue
            _group_send(f"play_{real_sector_id}", "npc_added", payload)
            counts["npcs_respawned"] += 1
    except Exception:
        logger.exception("[CeleryTick] NPC respawn sweep failed")

    return counts
