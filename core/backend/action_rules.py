# core/backend/action_rules.py

from typing import Dict, Any, Optional
from django.utils.translation import gettext as _

from core.models import PlayerShipModule, Module
from core.backend.get_data import GetDataFromDB  # :contentReference[oaicite:0]{index=0}


class ActionRules:

    # ================
    # TYPES DE MODULES
    # ================
    WEAPON_TYPES = {"LASER", "CANNON", "MISSILE", "BEAM"}  # à adapter selon tes Module.type
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
            "module_id__effect",
        )
        return list(modules)

    @staticmethod
    def _has_module(modules, allowed_types):
        """Renvoie True si le joueur possède au moins un module du type désiré."""
        for m in modules:
            if m["module_id__type"] in allowed_types:
                return True
        return False

    @staticmethod
    def _get_module_range(modules, allowed_types) -> Optional[int]:
        """Retourne la meilleure portée trouvée dans les modules."""
        best = None
        for m in modules:
            if m["module_id__type"] in allowed_types:
                rng = m["module_id__effect"].get("range")
                if rng is not None:
                    best = max(best or 0, rng)
        return best

    @staticmethod
    def _distance(a, b):
        return abs(a["x"] - b["x"]) + abs(a["y"] - b["y"])

    # ================
    # ACTION : ATTACK
    # ================

    @classmethod
    def action_attack(cls, *,
                      player_ship_id: int,
                      player_coords: Dict[str, int],
                      target_coords: Dict[str, int]) -> Dict[str, Any]:

        modules = cls._player_modules(player_ship_id)

        # Doit posséder une arme
        if not cls._has_module(modules, cls.WEAPON_TYPES):
            return {"enabled": False, "reason": _("No weapon installed")}

        # Doit avoir une portée suffisante
        rng = cls._get_module_range(modules, cls.WEAPON_TYPES)
        if rng is None:
            return {"enabled": False, "reason": _("Weapon has no range")}

        dist = cls._distance(player_coords, target_coords)
        if dist > rng:
            return {"enabled": False, "reason": _("Out of range")}

        return {"enabled": True, "reason": None}

    # ================
    # ACTION : SCAN
    # ================

    @classmethod
    def action_scan(cls, *,
                    player_ship_id: int,
                    player_coords: Dict[str, int],
                    target_coords: Dict[str, int]) -> Dict[str, Any]:

        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.SCAN_TYPES):
            return {"enabled": False, "reason": _("No scanner installed")}

        rng = cls._get_module_range(modules, cls.SCAN_TYPES) or 1

        if cls._distance(player_coords, target_coords) > rng:
            return {"enabled": False, "reason": _("Out of range")}

        return {"enabled": True, "reason": None}

    # ================
    # ACTION : HAIL (contact radio)
    # ================

    @classmethod
    def action_hail(cls, *,
                    player_coords: Dict[str, int],
                    target_coords: Dict[str, int]) -> Dict[str, Any]:

        # Exemple simple : portée fixe de 8 cases
        if cls._distance(player_coords, target_coords) > 8:
            return {"enabled": False, "reason": _("Out of comms range")}

        return {"enabled": True, "reason": None}

    # ================
    # ACTION : DOCK (station)
    # ================

    @classmethod
    def action_dock(cls, *,
                    player_ship_id: int,
                    player_coords: Dict[str, int],
                    target_coords: Dict[str, int]) -> Dict[str, Any]:

        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.DOCK_TYPES):
            return {"enabled": False, "reason": _("Docking module required")}

        # Portée 1 obligatoire (touching)
        if cls._distance(player_coords, target_coords) > 1:
            return {"enabled": False, "reason": _("Too far to dock")}

        return {"enabled": True, "reason": None}

    # ================
    # ACTION : MINE (asteroid)
    # ================

    @classmethod
    def action_mine(cls, *,
                    player_ship_id: int,
                    player_coords: Dict[str, int],
                    target_coords: Dict[str, int]) -> Dict[str, Any]:

        modules = cls._player_modules(player_ship_id)

        if not cls._has_module(modules, cls.MINE_TYPES):
            return {"enabled": False, "reason": _("Mining module required")}

        if cls._distance(player_coords, target_coords) > 1:
            return {"enabled": False, "reason": _("Too far to mine")}

        return {"enabled": True, "reason": None}
