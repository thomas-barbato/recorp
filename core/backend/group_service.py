from __future__ import annotations

from typing import Any, Dict, List, Optional

from core.models import Group, Player, PlayerGroup, PlayerShip

GROUP_MAX_MEMBERS = 6


def get_membership_for_player(player_id: int) -> Optional[PlayerGroup]:
    return (
        PlayerGroup.objects.select_related("group", "group__creator", "player")
        .filter(player_id=player_id)
        .order_by("created_at", "id")
        .first()
    )


def get_group_member_links(group_id: int) -> List[PlayerGroup]:
    return list(
        PlayerGroup.objects.select_related("player", "group")
        .filter(group_id=group_id)
        .order_by("created_at", "id")
    )


def _build_not_in_group_payload() -> Dict[str, Any]:
    return {
        "in_group": False,
        "group": None,
        "is_leader": False,
        "leader_id": None,
        "leader_name": None,
        "member_count": 0,
        "max_members": int(GROUP_MAX_MEMBERS),
        "members": [],
    }


def _safe_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _coordinates_payload(raw_coordinates: Any) -> Dict[str, Optional[int]]:
    coords = raw_coordinates if isinstance(raw_coordinates, dict) else {}
    return {
        "x": _safe_int(coords.get("x")),
        "y": _safe_int(coords.get("y")),
    }


def _ship_stats_payload(ship: Optional[PlayerShip]) -> Dict[str, Dict[str, int]]:
    if not ship:
        return {
            "hp": {"current": 0, "max": 0},
            "ballistic": {"current": 0, "max": 0},
            "laser": {"current": 0, "max": 0},
            "torpedo": {"current": 0, "max": 0},
            "ap": {"current": 0, "max": 0},
            "movement": {"current": 0, "max": 0},
        }

    return {
        "hp": {
            "current": int(ship.current_hp or 0),
            "max": int(ship.max_hp or 0),
        },
        "ballistic": {
            "current": int(ship.current_ballistic_defense or 0),
            "max": int(ship.max_ballistic_defense or 0),
        },
        "laser": {
            "current": int(ship.current_laser_defense or 0),
            "max": int(ship.max_laser_defense or 0),
        },
        "torpedo": {
            "current": int(ship.current_torpedo_defense or 0),
            "max": int(ship.max_torpedo_defense or 0),
        },
        "movement": {
            "current": int(ship.current_movement or 0),
            "max": int(ship.max_movement or 0),
        },
    }


def build_group_state_for_player(player_id: int) -> Dict[str, Any]:
    membership = get_membership_for_player(player_id)
    if not membership or not membership.group_id:
        return _build_not_in_group_payload()

    group: Group = membership.group
    member_links = get_group_member_links(group.id)
    if not member_links:
        return _build_not_in_group_payload()

    member_ids = [int(link.player_id) for link in member_links]
    players_by_id = {
        int(p.id): p
        for p in Player.objects.select_related("sector")
        .filter(id__in=member_ids, is_npc=False)
        .only("id", "name", "current_ap", "max_ap", "sector_id", "sector__name", "status", "coordinates")
    }
    ships_by_player_id = {
        int(s.player_id): s
        for s in PlayerShip.objects.filter(player_id__in=member_ids, is_current_ship=True).only(
            "player_id",
            "current_hp",
            "max_hp",
            "current_movement",
            "max_movement",
            "current_ballistic_defense",
            "current_laser_defense",
            "current_torpedo_defense",
            "max_ballistic_defense",
            "max_laser_defense",
            "max_torpedo_defense",
            "status",
        )
    }

    members_payload: List[Dict[str, Any]] = []
    for idx, link in enumerate(member_links, start=1):
        player = players_by_id.get(int(link.player_id))
        if not player:
            continue

        ship = ships_by_player_id.get(int(link.player_id))
        stats = _ship_stats_payload(ship)
        stats["ap"] = {
            "current": int(player.current_ap or 0),
            "max": int(player.max_ap or 0),
        }

        player_destroyed = str(player.status or "").upper() == "DEAD"
        ship_destroyed = bool(ship) and str(ship.status or "").upper() == "DEAD"
        is_destroyed = player_destroyed or ship_destroyed

        members_payload.append(
            {
                "index": idx,
                "player_id": int(player.id),
                "name": player.name,
                "is_leader": int(group.creator_id) == int(player.id),
                "joined_at": link.created_at.isoformat() if link.created_at else None,
                "sector_id": int(player.sector_id) if player.sector_id else None,
                "sector_name": player.sector.name if getattr(player, "sector", None) else None,
                "coordinates": _coordinates_payload(player.coordinates),
                "is_destroyed": is_destroyed,
                "avatar_url": f"/static/img/users/{player.id}/0.gif",
                "stats": stats,
            }
        )

    leader_name = players_by_id.get(int(group.creator_id)).name if int(group.creator_id) in players_by_id else None

    return {
        "in_group": True,
        "group": {
            "id": int(group.id),
            "name": group.name or "Unnamed Group",
            "created_at": group.created_at.isoformat() if group.created_at else None,
        },
        "is_leader": int(group.creator_id) == int(player_id),
        "leader_id": int(group.creator_id),
        "leader_name": leader_name,
        "member_count": len(members_payload),
        "max_members": int(GROUP_MAX_MEMBERS),
        "members": members_payload,
    }
