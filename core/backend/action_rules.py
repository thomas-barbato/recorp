# =======================================
# CE FICHIER SERT A RECUPERER
# DES DONNEES EN RAPPORT AVEC UNE ACTION
# QUE LE JOUEUR PEUT EFFECTUER.
# =======================================
from typing import Dict, Any, Optional
from datetime import timedelta
import math

from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q

from core.models import (
    PlayerShipModule,
    Module,
    ScanIntel,
    ScanIntelGroup,
    Npc,
    Player,
)
from core.backend.module_effects import get_effect_numeric


class ActionRules:

    # ================
    # TYPES DE MODULES
    # ================
    WEAPON_TYPES = {"LASER", "CANNON", "MISSILE", "BEAM"}
    SCAN_TYPES = {"SCAN", "PROBE"}
    DOCK_TYPES = {"DOCKING_SYSTEM"}
    MINE_TYPES = {"MINING_LASER", "MINING_TURRET"}

    # ================
    # OUTILS INTERNES
    # ================

    @staticmethod
    def _player_modules(player_ship_id: int):
        """Liste les modules du vaisseau sous forme exploitable."""
        modules = PlayerShipModule.objects.filter(
            player_ship_id=player_ship_id
        ).select_related("module_id").values(
            "module_id__id",
            "module_id__type",
            "module_id__effects",
            "module_id__subtype",
        )
        return list(modules)

    @staticmethod
    def _has_module(modules, allowed_types):
        """Renvoie True si le joueur possède au moins un module du type désiré."""
        return any(m["module_id__type"] in allowed_types for m in modules)

    @staticmethod
    def _get_module_range(modules, allowed_types) -> Optional[int]:
        """Retourne la meilleure portée trouvée dans les modules."""
        best = None
        for m in modules:
            if m["module_id__type"] in allowed_types:
                rng = get_effect_numeric(m, "range", default=None, strategy="max")
                if rng is not None:
                    best = max(best or 0, int(rng))
        return best

    @staticmethod
    def _distance(a, b):
        return abs(a["x"] - b["x"]) + abs(a["y"] - b["y"])

    @classmethod
    def get_size(cls, actor):
        if hasattr(actor, "size_x") and hasattr(actor, "size_y"):
            return actor.size_x or 1, actor.size_y or 1
        if hasattr(actor, "size"):
            return actor.size.get("x", 1), actor.size.get("y", 1)
        return 1, 1

    @classmethod
    def get_center(cls, actor):
        sx, sy = cls.get_size(actor)
        return (
            actor.x + (sx - 1) / 2,
            actor.y + (sy - 1) / 2,
        )

    @classmethod
    def compute_entity_distance(cls, actor_a, actor_b):
        ax, ay = cls.get_center(actor_a)
        bx, by = cls.get_center(actor_b)
        return max(abs(ax - bx), abs(ay - by))

    @classmethod
    def can_use_module_on_receiver(cls, transmitter, receiver, module):
        max_range_raw = get_effect_numeric(module, "range", default=None, strategy="max")
        if max_range_raw is None:
            return True, None

        max_range = float(max_range_raw)
        distance = cls.compute_entity_distance(transmitter, receiver)

        if distance <= max_range:
            return True, None

        return False, {
            "reason": "out_of_range",
            "distance": float(distance),
            "max_range": float(max_range),
        }

    # ================
    # SCANS – INVALIDATION
    # ================

    @staticmethod
    def invalidate_scans_for_target(target_type: str, target_id: int, sector_id: int) -> int:
        """
        Invalide tous les scans actifs concernant une cible (PC ou NPC)
        dans un secteur donné.
        """
        now = timezone.now()
        return ScanIntel.objects.filter(
            target_type=target_type,
            target_id=target_id,
            sector_id=sector_id,
            invalidated_at__isnull=True,
        ).update(invalidated_at=now)

    @staticmethod
    def invalidate_scans_for_receiver(receiver_type: str, receiver_id: int, sector_id: int) -> int:
        """
        Alias rétro-compatible (ancien nom).
        """
        return ActionRules.invalidate_scans_for_target(
            target_type=receiver_type,
            target_id=receiver_id,
            sector_id=sector_id,
        )

    # ================
    # SCANS – CREATION / PARTAGE
    # ================

    @staticmethod
    def upsert_scan(scanner_player_id: int, target_type: str, target_id: int, sector_id: int) -> ScanIntel:
        
        now = timezone.now()
        expires = now + timedelta(seconds=30)

        ScanIntel.objects.filter(
            scanner_player_id=scanner_player_id,
            target_type=target_type,
            target_id=target_id,
            sector_id=sector_id,
            invalidated_at__isnull=True,
        ).update(invalidated_at=now)

        return ScanIntel.objects.create(
            scanner_player_id=scanner_player_id,
            target_type=target_type,
            target_id=target_id,
            sector_id=sector_id,
            created_at=now,
            expires_at=expires,
            invalidated_at=None,
        )

    @staticmethod
    def share_scan_to_group(scan: ScanIntel, group):
        ScanIntelGroup.objects.get_or_create(scan=scan, group=group)

    # ================
    # SCANS – VISIBILITE
    # ================

    @staticmethod
    def get_visible_scans_for_player(player_id: int, sector_id: int):
        now = timezone.now()

        direct_scans = ScanIntel.objects.filter(
            sector_id=sector_id,
            expires_at__gt=now,
            invalidated_at__isnull=True,
            scanner_player_id=player_id,
        )

        shared_ids = ScanIntelGroup.objects.filter(
            group__player_id=player_id
        ).values_list("scan_id", flat=True)

        shared_scans = ScanIntel.objects.filter(
            id__in=shared_ids,
            sector_id=sector_id,
            expires_at__gt=now,
            invalidated_at__isnull=True,
        )

        scans = (direct_scans | shared_scans).distinct()
        valid_scans = []

        for scan in scans:
            if scan.target_type == "pc":
                if Player.objects.filter(id=scan.target_id, sector_id=sector_id).exists():
                    valid_scans.append(scan)
            elif scan.target_type == "npc":
                if Npc.objects.filter(id=scan.target_id, sector_id=sector_id).exists():
                    valid_scans.append(scan)

        return valid_scans

    @classmethod
    def has_active_scan(cls, scanner_id: int, target_type: str, target_id: int, sector_id: int) -> bool:
        return ScanIntel.objects.filter(
            scanner_player_id=scanner_id,
            target_type=target_type,
            target_id=target_id,
            sector_id=sector_id,
            invalidated_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).exists()

    @staticmethod
    def invalidate_expired_scans(sector_id: int):
        now = timezone.now()

        expired = ScanIntel.objects.filter(
            sector_id=sector_id,
            expires_at__lte=now,
            invalidated_at__isnull=True,
        )

        affected = list(expired.values("target_type", "target_id"))
        expired.update(invalidated_at=now)
        return affected

    # ================
    # ACTIONS
    # ================

    @classmethod
    def action_attack(cls, *, player_ship_id: int, player_coords: Dict[str, int], receiver_coords: Dict[str, int]) -> Dict[str, Any]:
        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.WEAPON_TYPES):
            return {"enabled": False, "reason": _( "No weapon installed" )}

        rng = cls._get_module_range(modules, cls.WEAPON_TYPES)
        if rng is None:
            return {"enabled": False, "reason": _( "Weapon has no range" )}

        if cls._distance(player_coords, receiver_coords) > rng:
            return {"enabled": False, "reason": _( "Out of range" )}

        return {"enabled": True, "reason": None}

    @classmethod
    def action_scan(cls, *, player_ship_id: int, player_coords: Dict[str, int], receiver_coords: Dict[str, int]) -> Dict[str, Any]:
        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.SCAN_TYPES):
            return {"enabled": False, "reason": _( "No scanner installed" )}

        rng = cls._get_module_range(modules, cls.SCAN_TYPES) or 1
        if cls._distance(player_coords, receiver_coords) > rng:
            return {"enabled": False, "reason": _( "Out of range" )}

        return {"enabled": True, "reason": None}

    @classmethod
    def action_hail(cls, *, player_coords: Dict[str, int], receiver_coords: Dict[str, int]) -> Dict[str, Any]:
        if cls._distance(player_coords, receiver_coords) > 8:
            return {"enabled": False, "reason": _( "Out of comms range" )}
        return {"enabled": True, "reason": None}

    @classmethod
    def action_dock(cls, *, player_ship_id: int, player_coords: Dict[str, int], receiver_coords: Dict[str, int]) -> Dict[str, Any]:
        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.DOCK_TYPES):
            return {"enabled": False, "reason": _( "Docking module required" )}

        if cls._distance(player_coords, receiver_coords) > 1:
            return {"enabled": False, "reason": _( "Too far to dock" )}

        return {"enabled": True, "reason": None}

    @classmethod
    def action_mine(cls, *, player_ship_id: int, player_coords: Dict[str, int], receiver_coords: Dict[str, int]) -> Dict[str, Any]:
        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.MINE_TYPES):
            return {"enabled": False, "reason": _( "Mining module required" )}

        if cls._distance(player_coords, receiver_coords) > 1:
            return {"enabled": False, "reason": _( "Too far to mine" )}

        return {"enabled": True, "reason": None}
