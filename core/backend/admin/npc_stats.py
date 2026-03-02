from core.models import Ship, Module
from core.backend.module_effects import get_effect_numeric

def compute_npc_final_stats(npc_template):
    ship: Ship = npc_template.ship

    # === BASE SHIP ===
    stats = {
        "hp": ship.default_hp,
        "movement": ship.default_movement,
        "ballistic_defense": ship.default_ballistic_defense,
        "thermal_defense": ship.default_thermal_defense,
        "missile_defense": ship.default_missile_defense,
    }

    # === SHIP CATEGORY BONUS ===
    if ship.ship_category:
        stats["hp"] += ship.ship_category.ship_category_hp
        stats["movement"] += ship.ship_category.ship_category_movement

    # === MODULES EFFECTS ===
    module_ids = npc_template.module_id_list or []
    modules = Module.objects.filter(id__in=module_ids)

    for module in modules:
        if module.type == "HULL":
            stats["hp"] += int(get_effect_numeric(module, "hp", default=0, strategy="sum") or 0)

        elif module.type == "MOVEMENT":
            stats["movement"] += int(get_effect_numeric(module, "movement", default=0, strategy="sum") or 0)

        elif module.type == "DEFENSE_BALLISTIC":
            stats["ballistic_defense"] += int(get_effect_numeric(module, "defense", default=0, strategy="sum") or 0)

        elif module.type == "DEFENSE_THERMAL":
            stats["thermal_defense"] += int(get_effect_numeric(module, "defense", default=0, strategy="sum") or 0)

        elif module.type == "DEFENSE_MISSILE":
            stats["missile_defense"] += int(get_effect_numeric(module, "defense", default=0, strategy="sum") or 0)

    return stats
