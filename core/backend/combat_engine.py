from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple, Literal, List
import random
from core.models import PlayerShip, ShipCategory


DamageType = Literal["MISSILE", "THERMAL", "BALLISTIC"]
VisibilityState = Literal["SCANNED", "SONAR", "UNKNOWN"]


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def roll_pct() -> float:
    """Return random float in [0, 100)."""
    return random.random() * 100.0


# ---- Skill coefficients (NO DB changes) ----
# Caps
CAPS = {
    "PRECISION": 20.0,      # %
    "EVASION": 20.0,        # %
    "DAMAGE": 25.0,         # %
}

# Simple linear-with-cap mapping for now (safe with 100 levels)
# You can later swap to a soft-cap curve without changing DB / fixtures.
def bonus_linear_cap(level: int, per_level: float, cap: float) -> float:
    return min(level * per_level, cap)


# Existing skill names (fixture)
SKILL_WEAPON_BY_DMG: Dict[DamageType, str] = {
    "MISSILE": "Missile Weapon",
    "THERMAL": "Thermal Weapon",
    "BALLISTIC": "Ballistic Weapon",
}

SKILL_SHARPSHOOTING = "Advanced Targeting"
SKILL_EVASIVE = "Evasive Maneuver"

BASE_CRIT_CHANCE = 0.05 # 5%
CRIT_PER_AT = 0.005 # 0.5% par point Advanced Targeting

CRIT_MULTIPLIERS = {
    "THERMAL": 1.4,
    "BALLISTIC": 1.6,
    "MISSILE": 1.9,
}


@dataclass(frozen=True)
class WeaponProfile:
    damage_type: DamageType
    min_damage: int
    max_damage: int
    range_tiles: int
    accuracy_bonus: float = 0.0  # %


@dataclass
class CombatEvent:
    type: str
    payload: Dict[str, Any]


# ---- Actor adapters (PC ship vs NPC) ----
class ActorAdapter:
    """
    Unifie l'accès aux stats (HP, shields, AP) pour PlayerShip / Npc.
    - PlayerShip: current_hp, current_missile_defense, current_thermal_defense, current_ballistic_defense, player.current_ap
    - Npc: hp, missile_defense, thermal_defense, ballistic_defense, current_ap
    """
    def __init__(self, actor: Any, actor_kind: Literal["PC", "NPC"]):
        self.actor = actor
        self.kind = actor_kind

    @property
    def id(self) -> int:
        return int(getattr(self.actor, "id"))

    def get_ap(self) -> int:
        if self.kind == "PC":
            # PlayerShip -> player.current_ap
            return int(self.actor.player.current_ap)
        return int(self.actor.current_ap)
    
    def get_max_ap(self):
        if self.kind == "PC":
            return self.actor.player.max_ap
        return self.actor.max_ap

    def spend_ap(self, amount: int) -> None:
        if self.kind == "PC":
            self.actor.player.current_ap = max(0, int(self.actor.player.current_ap) - amount)
            self.actor.player.save(update_fields=["current_ap"])
        else:
            self.actor.current_ap = max(0, int(self.actor.current_ap) - amount)
            self.actor.save(update_fields=["current_ap"])

    def get_hp(self) -> int:
        if self.kind == "PC":
            return int(self.actor.current_hp)
        return int(self.actor.hp)

    def set_hp(self, new_hp: int) -> None:
        new_hp = max(0, int(new_hp))
        if self.kind == "PC":
            self.actor.current_hp = new_hp
            self.actor.save(update_fields=["current_hp"])
        else:
            self.actor.hp = new_hp
            self.actor.save(update_fields=["hp"])

    def _shield_attr(self, dmg_type: DamageType) -> str:
        if self.kind == "PC":
            return {
                "MISSILE": "current_missile_defense",
                "THERMAL": "current_thermal_defense",
                "BALLISTIC": "current_ballistic_defense",
            }[dmg_type]
        return {
            "MISSILE": "missile_defense",
            "THERMAL": "thermal_defense",
            "BALLISTIC": "ballistic_defense",
        }[dmg_type]

    def get_shield(self, dmg_type: DamageType) -> int:
        return int(getattr(self.actor, self._shield_attr(dmg_type), 0) or 0)

    def set_shield(self, dmg_type: DamageType, new_value: int) -> None:
        attr = self._shield_attr(dmg_type)
        setattr(self.actor, attr, max(0, int(new_value)))
        self.actor.save(update_fields=[attr])


# ---- Skill levels: you will optimize later with prefetch/select_related ----
def get_skill_level_for_actor(actor: Any, actor_kind: Literal["PC", "NPC"], skill_name: str) -> int:
    """
    Minimal DB access version (OK for v1).
    Later: provide precomputed dict in ctx to avoid queries.
    """
    if actor_kind == "PC":
        # PlayerShip -> player -> PlayerSkill(skill)
        from core.models import PlayerSkill, Skill  # local import to avoid cycles
        try:
            skill_id = Skill.objects.only("id").get(name=skill_name).id
            return int(PlayerSkill.objects.only("level").get(player=actor.player, skill_id=skill_id).level)
        except Exception:
            return 0

    # NPC -> NpcTemplateSkill via npc_template
    from core.models import NpcTemplateSkill, Skill
    try:
        skill_id = Skill.objects.only("id").get(name=skill_name).id
        return int(NpcTemplateSkill.objects.only("level").get(npc_template=actor.npc_template, skill_id=skill_id).level)
    except Exception:
        return 0


def visibility_modifier(vis: VisibilityState) -> float:
    # Comme convenu : scanned=0, sonar=-10, unknown=-25
    if vis == "SCANNED":
        return 0.0
    if vis == "SONAR":
        return -10.0
    return -25.0


def compute_attack_bonuses(
    attacker: Any,
    attacker_kind: Literal["PC", "NPC"],
    dmg_type: DamageType,
) -> Tuple[float, float]:
    """
    Returns (precision_bonus_pct, damage_bonus_pct) with caps.
    - weapon skill drives damage + (some) precision
    - sharpshooting adds generic precision
    """
    weapon_skill_name = SKILL_WEAPON_BY_DMG[dmg_type]
    weapon_level = get_skill_level_for_actor(attacker, attacker_kind, weapon_skill_name)
    sharp_level = get_skill_level_for_actor(attacker, attacker_kind, SKILL_SHARPSHOOTING)

    # Tunings (safe for 100 levels). Adjust anytime.
    # Missile: accuracy up to 20% and damage up to 25%
    # Thermal: mostly damage up to 25%
    # Ballistic: accuracy up to 10% and damage up to 25%
    if dmg_type == "MISSILE":
        weapon_precision = bonus_linear_cap(weapon_level, per_level=0.20, cap=CAPS["PRECISION"])
    elif dmg_type == "BALLISTIC":
        weapon_precision = bonus_linear_cap(weapon_level, per_level=0.10, cap=10.0)
    else:
        weapon_precision = 0.0

    weapon_damage = bonus_linear_cap(weapon_level, per_level=0.25, cap=CAPS["DAMAGE"])

    # Sharpshooting: +10% max global precision
    sharp_precision = bonus_linear_cap(sharp_level, per_level=0.10, cap=10.0)

    precision_bonus = clamp(weapon_precision + sharp_precision, 0.0, CAPS["PRECISION"])
    damage_bonus = clamp(weapon_damage, 0.0, CAPS["DAMAGE"])
    return precision_bonus, damage_bonus


def compute_defense_bonuses(
    defender: Any,
    defender_kind: Literal["PC", "NPC"],
) -> float:
    """
    Returns evasion bonus pct (cap 20%).
    """
    evasive_level = get_skill_level_for_actor(defender, defender_kind, SKILL_EVASIVE)
    evasion_bonus = bonus_linear_cap(evasive_level, per_level=0.20, cap=CAPS["EVASION"])
    return clamp(evasion_bonus, 0.0, CAPS["EVASION"])


def apply_damage(
    defender_ad: ActorAdapter,
    dmg_type: DamageType,
    raw_damage: int,
) -> Tuple[int, int, int]:
    """
    Applies damage to matching shield first, then hull.
    Returns (damage_to_shield, damage_to_hull, remaining_shield_after).
    """
    dmg = max(0, int(raw_damage))
    shield_before = defender_ad.get_shield(dmg_type)
    to_shield = min(dmg, shield_before)
    shield_after = shield_before - to_shield
    dmg_left = dmg - to_shield

    if to_shield > 0:
        defender_ad.set_shield(dmg_type, shield_after)

    to_hull = 0
    if dmg_left > 0:
        hp_before = defender_ad.get_hp()
        to_hull = min(dmg_left, hp_before)
        defender_ad.set_hp(hp_before - to_hull)

    return to_shield, to_hull, shield_after


def resolve_attack(
    attacker_ad: ActorAdapter,
    defender_ad: ActorAdapter,
    weapon: WeaponProfile,
    *,
    visibility: VisibilityState,
    attacker_invisible: bool = False,
    base_hit: float = 50.0,
    min_hit: float = 5.0,
    max_hit: float = 95.0,
) -> list[CombatEvent]:
    """
    Résout UNE attaque (sans riposte ici).
    - Calcule hit chance via skills + visibilité
    - Jet MISS / HIT
    - Jet EVADE (via Evasive maneuver)
    - Applique dégâts (shield type -> hull)
    - Retourne liste d'événements à broadcaster
    """
    events: list[CombatEvent] = []

    # --- Compute bonuses ---
    precision_bonus, damage_bonus = compute_attack_bonuses(
        attacker_ad.actor, attacker_ad.kind, weapon.damage_type
    )
    evasion_bonus = compute_defense_bonuses(defender_ad.actor, defender_ad.kind)

    vis_mod = visibility_modifier(visibility)
    invis_bonus = 10.0 if attacker_invisible else 0.0  # simple v1, cap applies via clamp below

    hit_chance = base_hit + precision_bonus - evasion_bonus + vis_mod + invis_bonus + weapon.accuracy_bonus
    hit_chance = clamp(hit_chance, min_hit, max_hit)

    if attacker_ad.kind == "NPC":
        source_player_id = attacker_ad.actor.id
    else:
        source_player_id = attacker_ad.actor.player_id

    if defender_ad.kind == "NPC":
        target_player_id = defender_ad.actor.id
    else:
        target_player_id = defender_ad.actor.player_id

    # --- Roll to hit ---
    hit_roll = roll_pct()
    if hit_roll >= hit_chance:
        events.append(
            CombatEvent(
                "ATTACK_MISS",
                {
                    "source_kind": attacker_ad.kind,
                    "target_kind": defender_ad.kind,
                    "source_player_id": source_player_id,
                    "target_player_id": target_player_id,
                    "source_id": attacker_ad.id,
                    "target_id": defender_ad.id,
                    "damage_type": weapon.damage_type,
                    "hit_chance": round(hit_chance, 2),
                    "roll": round(hit_roll, 2),
                },
            )
        )
        return events

    # --- Evasion roll (post-hit) ---
    # A simple mapping: evasion_bonus itself is the % chance to evade after a hit is confirmed.
    evade_roll = roll_pct()
    if evade_roll < evasion_bonus:
        events.append(
            CombatEvent(
                "ATTACK_EVADED",
                {
                    "source_kind": attacker_ad.kind,
                    "target_kind": defender_ad.kind,
                    "source_player_id": source_player_id,
                    "target_player_id": target_player_id,
                    "source_id": attacker_ad.id,
                    "target_id": defender_ad.id,
                    "damage_type": weapon.damage_type,
                    "hit_chance": round(hit_chance, 2),
                    "hit_roll": round(hit_roll, 2),
                    "evasion_chance": round(evasion_bonus, 2),
                    "evasion_roll": round(evade_roll, 2),
                },
            )
        )
        return events

    # --- Damage ---
    rolled_damage = random.randint(weapon.min_damage, weapon.max_damage)
    final_damage = int(round(rolled_damage * (1.0 + (damage_bonus / 100.0))))

    # --- CRITICAL CHECK ---
    is_critical = False

    crit_chance = BASE_CRIT_CHANCE + (
        get_skill_level_for_actor(
            attacker_ad.actor,
            attacker_ad.kind,
            SKILL_SHARPSHOOTING
        ) * CRIT_PER_AT
    )

    if random.random() < crit_chance:
        is_critical = True
        multiplier = CRIT_MULTIPLIERS.get(weapon.damage_type, 1.5)
        final_damage = weapon.max_damage + (weapon.max_damage * multiplier)

    # --- Apply damage ---
    to_shield, to_hull, shield_after = apply_damage(
        defender_ad,
        weapon.damage_type,
        final_damage
    )

    events.append(
        CombatEvent(
            "ATTACK_HIT",
            {
                "source_kind": attacker_ad.kind,
                "target_kind": defender_ad.kind,
                "source_player_id": source_player_id,
                "target_player_id": target_player_id,
                "source_id": attacker_ad.id,
                "target_id": defender_ad.id,
                "damage_type": weapon.damage_type,
                "hit_chance": round(hit_chance, 2),
                "hit_roll": round(hit_roll, 2),
                "evasion_chance": round(evasion_bonus, 2),
                "evasion_roll": round(evade_roll, 2),
                "rolled_damage": rolled_damage,
                "damage_bonus_pct": round(damage_bonus, 2),
                "final_damage": final_damage,
                "damage_to_shield": to_shield,
                "damage_to_hull": to_hull,
                "is_critical": is_critical,
                "shield_remaining": shield_after,
                "hull_remaining": defender_ad.get_hp(),
            },
        )
    )
    return events


ActionType = Literal["ATTACK", "DEBUFF", "REPAIR", "BUFF"]

@dataclass
class CombatAction:
    action_type: ActionType
    source: ActorAdapter
    target: ActorAdapter
    weapon: Optional[WeaponProfile] = None
    visibility: VisibilityState = "UNKNOWN"
    attacker_invisible: bool = False
    is_counter: bool = False


def select_best_weapon_for_counter(
    weapons: list[WeaponProfile],
    distance_tiles: int,
) -> Optional[WeaponProfile]:
    """
    Sélectionne la meilleure arme pour une riposte.
    V1 : priorité à la portée maximale.
    """
    in_range = [w for w in weapons if w.range_tiles >= distance_tiles]
    
    if not in_range:
        return None
    return max(in_range, key=lambda w: w.range_tiles)


def can_counterattack(action: CombatAction) -> bool:
    return not action.is_counter


def resolve_combat_action(
        action: CombatAction,
        distance_tiles: int,
        target_weapons: List[WeaponProfile] | None = None,
    ) -> List[CombatEvent]:

    events: List[CombatEvent] = []

    # 🔒 Vérifier portée
    if distance_tiles > action.weapon.range_tiles:
        return events  # aucune action, aucun coût

    # 🔒 Vérifier AP attaquant
    if action.source.get_ap() < 1:
        return events

    # ✅ Consommer AP attaquant
    action.source.spend_ap(1)

    # --- ACTION PRINCIPALE ---
    if action.action_type == "ATTACK":
        if not action.weapon:
            return [
                CombatEvent(
                    "INVALID_ACTION",
                    {"reason": "NO_WEAPON", "source_id": action.source.id},
                )
            ]

        events += resolve_attack(
            attacker_ad=action.source,
            defender_ad=action.target,
            weapon=action.weapon,
            visibility=action.visibility,
            attacker_invisible=action.attacker_invisible,
        )

    else:
        # placeholders pour les prochaines étapes
        events.append(
            CombatEvent(
                "NOT_IMPLEMENTED",
                {"action_type": action.action_type},
            )
        )
        return events

    # --- RIPOSTE AUTOMATIQUE ---
    if not can_counterattack(action):
        return events

    # Vérifications strictes
    if action.target.get_hp() <= 0:
        return events

    if action.target.get_ap() < 1:
        return events

    counter_weapon = select_best_weapon_for_counter(
        weapons=target_weapons,
        distance_tiles=distance_tiles,
    )

    if not counter_weapon:
        return events
    
    # consommer AP pour riposte
    action.target.spend_ap(1)

    # --- CRÉATION DE L'ACTION DE RIPOSTE ---
    counter_action = CombatAction(
        action_type="ATTACK",
        source=action.target,
        target=action.source,
        weapon=counter_weapon,
        visibility="SCANNED",  # la cible vient d'attaquer → connue
        attacker_invisible=False,
        is_counter=True,
    )

    counter_events = resolve_attack(
        attacker_ad=counter_action.source,
        defender_ad=counter_action.target,
        weapon=counter_action.weapon,
        visibility=counter_action.visibility,
        attacker_invisible=False,
    )

    # Marquage explicite des events de riposte
    for ev in counter_events:
        ev.payload["is_counter"] = True

    return events + counter_events

def compute_distance_tiles(
    ax: int,
    ay: int,
    aw: int,
    ah: int,
    bx: int,
    by: int,
    bw: int,
    bh: int,
) -> int:
    """
    Calcule la distance en tiles entre deux entités rectangulaires.
    Distance bord-à-bord (comme le worker JS).
    """

    # bornes attaquant
    a_left = int(ax)
    a_right = int(ax) + int(aw) - 1
    a_top = int(ay)
    a_bottom = int(ay) + int(ah) - 1

    # bornes cible
    b_left = int(bx)
    b_right = int(bx) + int(bw) - 1
    b_top = int(by)
    b_bottom = int(by) + int(bh) - 1

    # distance horizontale
    if a_right < b_left:
        dx = b_left - a_right
    elif b_right < a_left:
        dx = a_left - b_right
    else:
        dx = 0

    # distance verticale
    if a_bottom < b_top:
        dy = b_top - a_bottom
    elif b_bottom < a_top:
        dy = a_top - b_bottom
    else:
        dy = 0

    # distance euclidienne
    return int((dx ** 2 + dy ** 2) ** 0.5)


def compute_distance_between_actors(source_ad, target_ad):
    """
    Calcule la distance réelle en tiles entre deux ActorAdapter.
    """

    # --- SOURCE ---
    if source_ad.kind == "PC":
        player = source_ad.actor.player
        coords = player.coordinates or {"x": 0, "y": 0}
        ship = source_ad.actor.ship
        size = ship.ship_category.size or {"x": 1, "y": 1}

    else:  # NPC
        npc = source_ad.actor
        coords = npc.coordinates or {"x": 0, "y": 0}
        ship = npc.npc_template.ship
        size = ship.ship_category.size or {"x": 1, "y": 1}

    ax = coords.get("x", 0)
    ay = coords.get("y", 0)
    aw = size.get("x", 1)
    ah = size.get("y", 1)

    # --- TARGET ---
    if target_ad.kind == "PC":
        player = target_ad.actor.player
        coords = player.coordinates or {"x": 0, "y": 0}
        ship = target_ad.actor.ship
        size = ship.ship_category.size or {"x": 1, "y": 1}

    else:
        npc = target_ad.actor
        coords = npc.coordinates or {"x": 0, "y": 0}
        ship = npc.npc_template.ship
        size = ship.ship_category.size or {"x": 1, "y": 1}

    bx = coords.get("x", 0)
    by = coords.get("y", 0)
    bw = size.get("x", 1)
    bh = size.get("y", 1)

    return compute_distance_tiles(ax, ay, aw, ah, bx, by, bw, bh)