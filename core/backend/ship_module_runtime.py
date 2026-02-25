from __future__ import annotations

from typing import Dict, Iterable, Tuple
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from core.models import PlayerShip, PlayerShipInventoryModule, PlayerShipModule
from core.backend.modal_builder import _build_ship_module_type_limits


BASE_SHIP_CARGO_CAPACITY = 100


def canonical_module_type(module_type: str | None) -> str:
    value = str(module_type or "").upper()
    if value == "PROB":
        return "PROBE"
    return value


def module_limit_bucket(module_type: str | None) -> str:
    value = canonical_module_type(module_type)
    if value.startswith("DEFENSE_"):
        return "DEFENSE"
    return value


def count_equipped_modules_by_limit_bucket(player_ship: PlayerShip) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    rows = (
        PlayerShipModule.objects
        .filter(player_ship_id=player_ship.id)
        .values_list("module__type", flat=True)
    )
    for raw_type in rows:
        bucket = module_limit_bucket(raw_type)
        counts[bucket] = counts.get(bucket, 0) + 1
    return counts


def get_player_ship_module_limits(player_ship: PlayerShip) -> Dict[str, int | None]:
    raw = _build_ship_module_type_limits(player_ship.ship)
    normalized: Dict[str, int | None] = {}
    for key, value in (raw or {}).items():
        if key.startswith("DEFENSE_"):
            normalized["DEFENSE"] = value
        else:
            normalized[canonical_module_type(key)] = value
    return normalized


def _iter_equipped_modules(player_ship: PlayerShip) -> Iterable[PlayerShipModule]:
    return (
        PlayerShipModule.objects
        .select_related("module")
        .filter(player_ship_id=player_ship.id)
    )


def recompute_player_ship_stats(player_ship: PlayerShip, *, save: bool = True) -> Dict[str, int]:
    """
    Recalcule les stats max du vaisseau à partir de son chassis + modules équipés.
    Les valeurs courantes sont seulement clampées (pas de "refill" gratuit).
    """
    ship_template = player_ship.ship

    new_max_hp = int(getattr(ship_template, "default_hp", 0) or 0)
    new_max_movement = int(getattr(ship_template, "default_movement", 0) or 0)
    new_max_ballistic = int(getattr(ship_template, "default_ballistic_defense", 0) or 0)
    new_max_thermal = int(getattr(ship_template, "default_thermal_defense", 0) or 0)
    new_max_missile = int(getattr(ship_template, "default_missile_defense", 0) or 0)
    new_cargo_capacity = int(BASE_SHIP_CARGO_CAPACITY)

    for psm in _iter_equipped_modules(player_ship):
        mod = getattr(psm, "module", None)
        if not mod:
            continue
        effect = mod.effect or {}
        mtype = canonical_module_type(getattr(mod, "type", None))

        if mtype.startswith("DEFENSE_"):
            defense_value = int(effect.get("defense", 0) or 0)
            if mtype == "DEFENSE_BALLISTIC":
                new_max_ballistic += defense_value
            elif mtype == "DEFENSE_THERMAL":
                new_max_thermal += defense_value
            elif mtype == "DEFENSE_MISSILE":
                new_max_missile += defense_value
            continue

        if mtype == "MOVEMENT":
            new_max_movement += int(effect.get("movement", 0) or 0)
            continue

        if mtype == "HULL":
            new_max_hp += int(effect.get("hp", 0) or 0)
            continue

        if mtype == "HOLD":
            new_cargo_capacity += int(effect.get("capacity", 0) or 0)
            continue

    player_ship.max_hp = int(new_max_hp)
    player_ship.current_hp = max(0, min(int(player_ship.current_hp or 0), int(new_max_hp)))

    player_ship.max_movement = int(new_max_movement)
    player_ship.current_movement = max(0, min(int(player_ship.current_movement or 0), int(new_max_movement)))

    player_ship.max_ballistic_defense = int(new_max_ballistic)
    player_ship.current_ballistic_defense = max(
        0, min(int(player_ship.current_ballistic_defense or 0), int(new_max_ballistic))
    )

    player_ship.max_thermal_defense = int(new_max_thermal)
    player_ship.current_thermal_defense = max(
        0, min(int(player_ship.current_thermal_defense or 0), int(new_max_thermal))
    )

    player_ship.max_missile_defense = int(new_max_missile)
    player_ship.current_missile_defense = max(
        0, min(int(player_ship.current_missile_defense or 0), int(new_max_missile))
    )

    # Champ historique utilisé comme "capacité cargo max" dans l'UI actuelle.
    player_ship.current_cargo_size = int(new_cargo_capacity)

    if save:
        player_ship.save(update_fields=[
            "max_hp",
            "current_hp",
            "max_movement",
            "current_movement",
            "max_ballistic_defense",
            "current_ballistic_defense",
            "max_thermal_defense",
            "current_thermal_defense",
            "max_missile_defense",
            "current_missile_defense",
            "current_cargo_size",
            "updated_at",
        ])

    return {
        "max_hp": int(player_ship.max_hp or 0),
        "current_hp": int(player_ship.current_hp or 0),
        "max_movement": int(player_ship.max_movement or 0),
        "current_movement": int(player_ship.current_movement or 0),
        "max_ballistic_defense": int(player_ship.max_ballistic_defense or 0),
        "current_ballistic_defense": int(player_ship.current_ballistic_defense or 0),
        "max_thermal_defense": int(player_ship.max_thermal_defense or 0),
        "current_thermal_defense": int(player_ship.current_thermal_defense or 0),
        "max_missile_defense": int(player_ship.max_missile_defense or 0),
        "current_missile_defense": int(player_ship.current_missile_defense or 0),
        "cargo_capacity": int(player_ship.current_cargo_size or 0),
    }


def compute_ship_cargo_load(player_ship: PlayerShip) -> int:
    resource_qty = (
        player_ship.playershipresource_set.aggregate(total=Sum("quantity")).get("total")
        or 0
    )
    modules_qty = PlayerShipInventoryModule.objects.filter(player_ship_id=player_ship.id).count()
    return int(resource_qty) + int(modules_qty)


def is_ship_over_capacity(player_ship: PlayerShip) -> Tuple[bool, int, int]:
    capacity = int(player_ship.current_cargo_size or 0)
    load = compute_ship_cargo_load(player_ship)
    return load > capacity, load, capacity


def set_equipment_block(player_ship: PlayerShip, seconds: int) -> None:
    player_ship.equipment_blocked_until = timezone.now() + timedelta(seconds=max(0, int(seconds)))
    player_ship.save(update_fields=["equipment_blocked_until", "updated_at"])
