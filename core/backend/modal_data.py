# core/backend/modal_data.py

from typing import Dict, Any

from django.utils.translation import gettext as _
from django.core.exceptions import ObjectDoesNotExist

from core.backend.get_data import GetDataFromDB  # :contentReference[oaicite:1]{index=1}
from core.backend.player_actions import PlayerAction
from core.models import (
    Player,
    PlayerShip,
    Npc,
    NpcTemplate,
    PlanetResource,
    AsteroidResource,
    StationResource,
    WarpZone,
    Sector,
    Module,
    PlayerShipModule,
)


class ModalDataService:
    """
    Service centralisé pour construire les payloads JSON des modals :
    - PC
    - NPC
    - Foreground (sector_element)
    On pose ici la structure + les checks de base (portée, existence).
    La logique fine des actions sera complétée à l’étape C.
    """

    # ---------- UTIL COMMUNES ----------

    @staticmethod
    def _get_current_player_id(user_id: int) -> int:
        pa = PlayerAction(user_id)
        return pa.get_player_id()

    @staticmethod
    def _get_current_sector_id(player_id: int) -> int:
        pa = PlayerAction(player_id)
        return pa.get_player_sector()

    @staticmethod
    def _is_in_view_range(current_player_id: int, target_x: int, target_y: int) -> bool:
        """
        Utilise la zone de visibilité déjà calculée côté backend pour savoir
        si la cible est dans la "vue" du joueur. :contentReference[oaicite:2]{index=2}
        """
        view = GetDataFromDB.current_player_observable_zone(current_player_id)
        if not view:
            return False

        start_x = view.get("start_x")
        end_x = view.get("end_x")
        start_y = view.get("start_y")
        end_y = view.get("end_y")

        if None in (start_x, end_x, start_y, end_y):
            return False

        return start_x <= target_x <= end_x and start_y <= target_y <= end_y

    @staticmethod
    def _base_actions_stub() -> Dict[str, Any]:
        """
        Squelette d'actions. À remplir à l’étape C.
        Pour l’instant tout est désactivé avec un reason générique.
        """
        return {
            "attack": {"enabled": False, "reason": _("Not computed yet")},
            "scan": {"enabled": False, "reason": _("Not computed yet")},
            "hail": {"enabled": False, "reason": _("Not computed yet")},
        }

    # ---------- PC MODAL ----------

    @classmethod
    def get_pc_modal(cls, user_id: int, target_player_id: int) -> Dict[str, Any]:
        current_player_id = cls._get_current_player_id(user_id)

        try:
            # Joueur + ship courant
            ship = PlayerShip.objects.select_related(
                "player_id",
                "ship_id",
                "ship_id__ship_category",
                "player_id__faction_id",
            ).filter(
                player_id__id=target_player_id,
                is_current_ship=True,
            ).values(
                "player_id__id",
                "player_id__name",
                "player_id__coordinates",
                "player_id__faction_id__name",
                "ship_id__name",
                "ship_id__image",
                "ship_id__ship_category_id__size",
            ).first()

            if not ship:
                raise ObjectDoesNotExist

        except ObjectDoesNotExist:
            return {"error": "PLAYER_NOT_FOUND", "type": "pc"}

        coords = ship["player_id__coordinates"] or {"x": 0, "y": 0}
        size = ship["ship_id__ship_category_id__size"] or {"x": 1, "y": 1}

        in_range = cls._is_in_view_range(
            current_player_id=current_player_id,
            target_x=coords["x"],
            target_y=coords["y"],
        )

        payload: Dict[str, Any] = {
            "type": "pc",
            "id": ship["player_id__id"],
            "name": ship["player_id__name"],
            "faction": {
                "name": ship["player_id__faction_id__name"],
            },
            "coordinates": coords,
            "size": size,
            "ship": {
                "name": ship["ship_id__name"],
                "image": ship["ship_id__image"],
                "size": size,
            },
            "visibility": {
                "in_range": in_range,
                "mode": "direct" if in_range else "unknown",
            },
            "hp": None,          # rempli plus tard
            "defenses": None,    # rempli plus tard
            "actions": cls._base_actions_stub(),
        }

        # Cas particulier : si c’est le joueur lui-même, on pourra renvoyer TOUT
        if ship["player_id__id"] == current_player_id:
            payload["is_self"] = True
        else:
            payload["is_self"] = False
            
            
        from core.backend.action_rules import ActionRules

        player_ship_id = PlayerShip.objects.filter(
            player_id=current_player_id,
            is_current_ship=True
        ).values_list("id", flat=True).first()

        player_coords = GetDataFromDB.get_player_coordinates(current_player_id)  # déjà présent dans ton code backend
        target_coords = coords

        payload["actions"] = {
            "attack": ActionRules.action_attack(
                player_ship_id=player_ship_id,
                player_coords=player_coords,
                target_coords=target_coords
            ),
            "scan": ActionRules.action_scan(
                player_ship_id=player_ship_id,
                player_coords=player_coords,
                target_coords=target_coords
            ),
            "hail": ActionRules.action_hail(
                player_coords=player_coords,
                target_coords=target_coords
            ),
        }

        return payload

    # ---------- NPC MODAL ----------

    @classmethod
    def get_npc_modal(cls, user_id: int, npc_id: int) -> Dict[str, Any]:
        current_player_id = cls._get_current_player_id(user_id)

        npc = Npc.objects.select_related(
            "npc_template",
            "npc_template__ship",
            "npc_template__ship__ship_category",
        ).filter(id=npc_id).values(
            "id",
            "coordinates",
            "npc_template_id",
            "npc_template__name",
            "npc_template__displayed_name",
            "npc_template__ship_id__name",
            "npc_template__ship_id__image",
            "npc_template__ship_id__ship_category_id__size",
        ).first()

        if not npc:
            return {"error": "NPC_NOT_FOUND", "type": "npc"}

        coords = npc["coordinates"] or {"x": 0, "y": 0}
        size = npc["npc_template__ship_id__ship_category_id__size"] or {"x": 1, "y": 1}

        in_range = cls._is_in_view_range(
            current_player_id=current_player_id,
            target_x=coords["x"],
            target_y=coords["y"],
        )

        payload: Dict[str, Any] = {
            "type": "npc",
            "id": npc["id"],
            "template_id": npc["npc_template_id"],
            "name": npc["npc_template__displayed_name"] or npc["npc_template__name"],
            "internal_name": npc["npc_template__name"],
            "coordinates": coords,
            "size": size,
            "ship": {
                "name": npc["npc_template__ship_id__name"],
                "image": npc["npc_template__ship_id__image"],
                "size": size,
            },
            "visibility": {
                "in_range": in_range,
                "mode": "direct" if in_range else "unknown",
            },
            "hp": None,
            "defenses": None,
            "actions": cls._base_actions_stub(),
        }

        return payload

    # ---------- FOREGROUND / SECTOR ELEMENT MODAL ----------

    @classmethod
    def get_fg_modal(
        cls,
        user_id: int,
        element_type: str,
        element_id: int,
    ) -> Dict[str, Any]:
        """
        Modal pour les éléments de type planet / asteroid / station / warpzone.
        On travaille avec les *Resource* qui sont déjà liées au secteur. :contentReference[oaicite:3]{index=3}
        """
        # Normalisation basique
        element_type = element_type.lower()

        # On récupère le secteur du joueur pour s'assurer qu'il ne regarde pas une autre map
        current_player_id = cls._get_current_player_id(user_id)
        sector_id = cls._get_current_sector_id(current_player_id)

        base = {
            "type": "foreground",
            "subtype": element_type,
            "id": element_id,
        }

        # Route par type
        model = None
        if element_type == "planet":
            model = PlanetResource
        elif element_type == "asteroid":
            model = AsteroidResource
        elif element_type == "station":
            model = StationResource
        elif element_type == "warpzone":
            model = WarpZone
        else:
            return {**base, "error": "UNKNOWN_TYPE"}

        if model is WarpZone:
            obj = model.objects.filter(id=element_id, sector_id=sector_id).values(
                "id",
                "data",
                "coordinates",
            ).first()
            if not obj:
                return {**base, "error": "NOT_FOUND"}

            coords = obj["coordinates"] or {"x": 0, "y": 0}
            data = obj["data"] or {}

            payload = {
                **base,
                "name": data.get("name", _("Unknown warpzone")),
                "description": data.get("description", ""),
                "coordinates": coords,
                "size": data.get("size", {"x": 2, "y": 3}),
                "warp": {
                    "home_sector": data.get("warp_home_id"),
                    "destinations": data.get("destinations", []),
                },
                "actions": cls._base_actions_stub(),
            }
            return payload

        # Planet / Asteroid / Station : via *Resource* lié
        obj = model.objects.filter(id=element_id, sector_id=sector_id).select_related(
            "source",
        ).values(
            "id",
            "data",
            "coordinates",
            "source__name",
            "source__size",
        ).first()

        if not obj:
            return {**base, "error": "NOT_FOUND"}

        coords = obj["coordinates"] or {"x": 0, "y": 0}
        data = obj["data"] or {}
        size = obj["source__size"] or {"x": 1, "y": 1}

        payload = {
            **base,
            "name": data.get("name", obj["source__name"]),
            "description": data.get("description", ""),
            "coordinates": coords,
            "size": size,
            "resource": data.get("resource", None),
            "actions": cls._base_actions_stub(),
        }

        return payload
