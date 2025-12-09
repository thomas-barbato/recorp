import datetime
import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from functools import lru_cache
from django.core.cache import cache
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Prefetch, Q

from core.backend.get_data import GetDataFromDB
from core.backend.player_actions import PlayerAction

from core.models import (
    Sector, Player, Module, PlayerShipModule, PlayerShip,
    Npc, NpcTemplate, PlanetResource, AsteroidResource, 
    StationResource, WarpZone, SectorWarpZone
)

class CreateCacheMinimal:

    def __init__(self, sector_id):
        self.sector_id = sector_id

    def build_all(self):
        """
        Structure minimale attendue par le front :
        {
            "sector": ...,
            "pc": [...],
            "npc": [...],
            "sector_element": [...],
            "messages": []
        }
        """
        return {
            "sector": self.build_sector_info(),
            "pc": self.build_pc_list(),
            "npc": self.build_npc_list(),
            "sector_element": self.build_fg_list(),
            "messages": []  # pour le chat, conservé
        }

    # ---- SECTOR ------------------------------------------------------------

    def build_sector_info(self):
        from core.models import Sector
        s = Sector.objects.filter(id=self.sector_id).values(
            "id", "name", "description", "image"
        ).first()

        if not s:
            return {
                "id": self.sector_id,
                "name": "Unknown sector",
                "description": "",
                "image": ""
            }

        return {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"] or "",
            "image": s["image"] or "",
        }

    # ---- PC ----------------------------------------------------------------

    def build_pc_list(self):
        from core.models import PlayerShip
        qs = PlayerShip.objects.filter(
            player_id__sector_id=self.sector_id,
            is_current_ship=True
        ).select_related(
            "player_id",
            "ship_id",
            "ship_id__ship_category"
        ).values(
            "player_id__id",
            "player_id__name",
            "player_id__coordinates",
            "ship_id__image",
            "is_reversed",
            "ship_id__ship_category_id__size"
        )

        pc = []
        for p in qs:
            coords = p["player_id__coordinates"] or {"x": 0, "y": 0}
            size = p["ship_id__ship_category_id__size"] or {"x": 1, "y": 1}

            pc.append({
                "id": p["player_id__id"],
                "name": p["player_id__name"],
                "coordinates": coords,
                "size": size,
                "ship_image": p["ship_id__image"],
                "is_reversed": p["is_reversed"]
            })

        return pc

    # ---- NPC ---------------------------------------------------------------

    def build_npc_list(self):
        from core.models import Npc

        qs = Npc.objects.filter(
            sector_id=self.sector_id
        ).select_related(
            "npc_template",
            "npc_template__ship",
            "npc_template__ship__ship_category"
        ).values(
            "id",
            "coordinates",
            "npc_template_id",
            "npc_template__name",
            "npc_template__displayed_name",
            "npc_template__ship_id__image",
            "npc_template__ship_id__ship_category_id__size"
        )

        npc = []
        for n in qs:
            coords = n["coordinates"] or {"x": 0, "y": 0}
            size = n["npc_template__ship_id__ship_category_id__size"] or {"x": 1, "y": 1}

            npc.append({
                "id": n["id"],
                "template_id": n["npc_template_id"],
                "template_name": n["npc_template__name"],
                "displayed_name": n["npc_template__displayed_name"],
                "coordinates": coords,
                "size": size,
                "ship_image": n["npc_template__ship_id__image"],
            })

        return npc

    # ---- FOREGROUND --------------------------------------------------------

    def build_fg_list(self):
        from core.models import (
            PlanetResource, AsteroidResource, StationResource, WarpZone
        )

        fg = []

        def convert(obj, typename):
            coords = obj["coordinates"] or {"x": 0, "y": 0}
            data = obj["data"] or {}
            size = obj["source__size"] or {"x": 1, "y": 1}
            anim = data.get("animation") or data.get("sprite")

            return {
                "item_id": obj["id"],
                "type": typename,
                "name": data.get("name", obj["source__name"]),
                "coordinates": coords,
                "size": size,
                "sprite": anim,
                "animation": anim
            }

        # PLANETS
        for p in PlanetResource.objects.filter(sector_id=self.sector_id).select_related("source").values(
            "id", "data", "coordinates", "source__name", "source__size"
        ):
            fg.append(convert(p, "planet"))

        # ASTEROIDS
        for a in AsteroidResource.objects.filter(sector_id=self.sector_id).select_related("source").values(
            "id", "data", "coordinates", "source__name", "source__size"
        ):
            fg.append(convert(a, "asteroid"))

        # STATIONS
        for s in StationResource.objects.filter(sector_id=self.sector_id).select_related("source").values(
            "id", "data", "coordinates", "source__name", "source__size"
        ):
            fg.append(convert(s, "station"))

        # WARPZONES
        for w in WarpZone.objects.filter(sector_id=self.sector_id).values(
            "id", "data", "coordinates"
        ):
            coords = w["coordinates"] or {"x": 0, "y": 0}
            data = w["data"] or {}
            fg.append({
                "item_id": w["id"],
                "type": "warpzone",
                "name": data.get("name", "Warpzone"),
                "coordinates": coords,
                "size": data.get("size", {"x": 2, "y": 3}),
                "sprite": data.get("animation"),
                "animation": data.get("animation"),
            })

        return fg