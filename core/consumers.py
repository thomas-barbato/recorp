import json
import logging
import random
from typing import Dict, Any, Optional
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
import datetime
from django.utils import timezone

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.backend.get_data import GetDataFromDB
from core.backend.action_rules import ActionRules
from core.backend.group_service import build_group_state_for_player
from core.backend.ship_module_runtime import (
    module_limit_bucket,
    count_equipped_modules_by_limit_bucket,
    get_player_ship_module_limits,
    recompute_player_ship_stats,
    is_ship_over_capacity,
    set_equipment_block,
)
from core.backend.module_effects import (
    get_effect_numeric,
    get_module_effect_map,
    module_effect_fields,
)

from core.models import SectorWarpZone, ScanIntelGroup, ScanIntel, Group, GroupInvitation, PlayerShip, PlayerShipInventoryModule, PlayerShipModuleReconfiguration, Npc, Module, PlayerShipModule, Player, PlayerGroup, ShipWreck, Ship, ArchetypeModule, NpcResource, NpcTemplateResource, PlayerResource, PlayerShipResource, Resource
from core.backend.modal_builder import (
    build_npc_modal_data,
    build_pc_modal_data,
    build_sector_element_modal_data,
)
from core.backend.player_logs import create_event_log, serialize_event_log_data

from core.backend.combat_engine import (
    ActorAdapter,
    WeaponProfile,
    CombatAction,
    resolve_combat_action,
)

logger = logging.getLogger("django")

class GameConsumer(WebsocketConsumer):
    DEFAULT_RESPAWN_SECTOR_ID = 7
    NPC_RESPAWN_DELAY_SECONDS = 120
    WRECK_TTL_SECONDS = 12 * 60 * 60  # 12h (scavenge => disparition immÃ©diate)
    GROUP_MAX_MEMBERS = 6
    MODULE_RECONFIG_SECONDS = 10
    EQUIPMENT_COMBAT_LOCK_SECONDS = 30
    WRECK_LOOT_LOCK_TIMEOUT_SECONDS = 120
    WRECK_LOOT_FOUILLE_SECONDS = 1
    WRECK_LOOT_SALVAGE_SECONDS = 10
    WRECK_LOOT_RANGE_MAX = 3
    WRECK_SALVAGE_MODULE_RECOVERY_CHANCE = 0.25
    WRECK_SALVAGE_RESOURCE_NAME = "Salvage Scrap"
    """
    WebSocket consumer pour gÃ©rer les interactions en temps rÃ©el du jeu.
    GÃ¨re les mouvements des joueurs, les actions de jeu et la synchronisation.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initialize_attributes()

    def _initialize_attributes(self) -> None:
        """Initialise tous les attributs de l'instance."""
        self.room: Optional[str] = None
        self.room_group_name: Optional[str] = None
        self.user = None
        self.game = None
        self.game_cache = None
        self.player_id: Optional[int] = None
        self._cache_store = None
        self.language_code: str = settings.LANGUAGE_CODE



    def _normalize_language_code(self, raw: Optional[str]) -> str:
        value = str(raw or settings.LANGUAGE_CODE or "en").strip().lower()
        if value.startswith("fr"):
            return "fr"
        return "en"

    def _resolve_language_code(self) -> str:
        session_lang = None
        session = self.scope.get("session")
        if session is not None:
            session_lang = session.get("django_language")

        cookies = self.scope.get("cookies") or {}
        cookie_lang = cookies.get(getattr(settings, "LANGUAGE_COOKIE_NAME", "django_language"))

        header_lang = None
        for header_name, header_value in self.scope.get("headers") or []:
            if header_name == b"accept-language":
                try:
                    header_lang = header_value.decode("latin1")
                except Exception:
                    header_lang = None
                break

        for candidate in (session_lang, cookie_lang, header_lang):
            if candidate:
                return self._normalize_language_code(candidate)
        return self._normalize_language_code(None)

    def connect(self) -> None:
        """Ã‰tablit la connexion WebSocket et joint l'utilisateur au groupe de salle."""
        self._setup_room_connection()
        self._join_room_group()
        self._handle_authenticated_user()
        self._emit_pending_group_invitations_on_connect()
    
        # Maintenir la session active
        if hasattr(self.scope, 'session'):
            self.scope['session'].save()
        

    def _setup_room_connection(self) -> None:
        """Configure les informations de connexion Ã  la salle."""
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.room_group_name = f"play_{self.room}"
        self.user = self.scope["user"]
        self.player_id = PlayerAction(self.user.id).get_player_id()
        self._cache_store = StoreInCache(self.room_group_name, self.user)
        self.language_code = self._resolve_language_code()
        
        self.accept()

    def _join_room_group(self) -> None:
        """Joint l'utilisateur au groupe de salle."""
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name,
        )

    def _handle_authenticated_user(self) -> None:
        """Traite les utilisateurs authentifiÃ©s en initialisant le cache."""
        if self.user.is_authenticated:
            # store = StoreInCache(self.room_group_name, self.user)
            # store.get_or_set_cache(need_to_be_recreated=False)
            self._cache_store.get_or_set_cache(need_to_be_recreated=False)

    def _emit_pending_group_invitations_on_connect(self) -> None:
        if not self.user.is_authenticated or not self.player_id:
            return
        try:
            player_id = int(self.player_id)

            # Si le joueur est dÃ©jÃ  en groupe, on expire les vieilles invitations.
            if PlayerGroup.objects.filter(player_id=player_id).exists():
                GroupInvitation.objects.filter(
                    invitee_id=player_id,
                    status="PENDING",
                ).update(
                    status="EXPIRED",
                    responded_at=timezone.now(),
                )
                return

            pending_invites = (
                GroupInvitation.objects
                .select_related("group", "inviter")
                .filter(invitee_id=player_id, status="PENDING")
                .order_by("-created_at")[:10]
            )

            for invite in pending_invites:
                self._send_response(
                    {
                        "type": "group_invitation",
                        "payload": {
                            "id": int(invite.id),
                            "group_id": int(invite.group_id),
                            "group_name": invite.group.name if invite.group else "Unnamed Group",
                            "inviter_id": int(invite.inviter_id),
                            "inviter_name": invite.inviter.name if invite.inviter else "Unknown",
                            "created_at": invite.created_at.isoformat() if invite.created_at else None,
                        },
                    }
                )
        except Exception:
            logger.exception("emit pending group invitations on connect failed")

    def disconnect(self, close_code: int) -> None:
        """GÃ¨re la dÃ©connexion WebSocket de maniÃ¨re asynchrone."""
        try:
            self._release_wreck_loot_locks_for_current_player_safe()
            # Nettoyer les ressources AVANT de quitter le groupe
            if hasattr(self, '_cache_store'):
                # Optionnel : retirer le joueur du cache si nÃ©cessaire
                # self._cache_store.cleanup()
                pass
            
            # Quitter le groupe de maniÃ¨re asynchrone
            self._leave_room_group()
            
            logger.info(f"WebSocket dÃ©connectÃ© proprement - Code: {close_code}, Joueur: {self.player_id}")
            
        except Exception as e:
            logger.error(f"Erreur lors de la dÃ©connexion: {e}")
        finally:
            # Toujours fermer la connexion
            try:
                self.close()
            except:
                pass

    def _leave_room_group(self) -> None:
        """Retire l'utilisateur du groupe de salle."""
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name,
        )
        
    def _refresh_session(self) -> None:
        """RafraÃ®chit la session Django pour Ã©viter l'expiration."""
        if hasattr(self.scope, 'session'):
            # Forcer la mise Ã  jour du timestamp de session
            self.scope['session'].modified = True
            self.scope['session'].save()

    def _handle_ping_with_validation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """GÃ¨re le ping et vÃ©rifie si une synchronisation est nÃ©cessaire."""
        client_hash = data.get("client_data_hash")
        player_id = data.get("player_id", self.player_id)
        
        # GÃ©nÃ©rer le hash cÃ´tÃ© serveur
        server_hash = self._generate_server_data_hash(player_id)
        
        sync_required = (client_hash != server_hash) if client_hash else False
        
        return {
            "type": "pong",
            "sync_required": sync_required
        }
        
    def _generate_server_data_hash(self, player_id: int) -> str:
        """GÃ©nÃ¨re un hash des donnÃ©es critiques cÃ´tÃ© serveur."""
        try:
            cached_data = cache.get(self.room_group_name)
            if not cached_data:
                return "no_cache"
            
            # Trouver le joueur actuel
            current_player_data = None
            for pc in cached_data.get("pc", []):
                if pc.get("user", {}).get("player") == player_id:
                    current_player_data = pc
                    break
            
            critical_data = {
                "currentPlayer": player_id if current_player_data else None,
                "otherPlayersCount": len([p for p in cached_data.get("pc", []) if p.get("user", {}).get("player") != player_id]),
                "sectorId": cached_data.get("sector", {}).get("id")
            }
            
            str_data = json.dumps(critical_data, sort_keys=True)
            hash_val = 0
            for char in str_data:
                hash_val = ((hash_val << 5) - hash_val) + ord(char)
                hash_val = hash_val & 0xFFFFFFFF  # 32bit
            
            # Convertir en base 36 comme en JS
            return self._to_base36(abs(hash_val))
            
        except Exception as e:
            logger.error(f"Erreur gÃ©nÃ©ration hash serveur: {e}")
            return "error"
            
    def _to_base36(self, num: int) -> str:
        """Convertit un nombre en base 36."""
        chars = "0123456789abcdefghijklmnopqrstuvwxyz"
        if num == 0:
            return "0"
        result = ""
        while num:
            num, remainder = divmod(num, 36)
            result = chars[remainder] + result
        return result

    def _broadcast_message(self, message_data: Dict[str, Any]) -> None:
        """Diffuse le message Ã  tous les membres du groupe."""
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            message_data,
        )
        
    # mÃ©thode pour gÃ©rer les demandes de synchronisation
    def _handle_data_sync_request(self, data: Dict[str, Any]) -> None:
        """
        GÃ¨re les demandes de synchronisation des donnÃ©es client.
        
        Args:
            data: DonnÃ©es de la demande de synchronisation
        """
        try:
            # Parser les donnÃ©es de la demande
            request_data = json.loads(data.get("message", "{}"))
            player_id = request_data.get("player_id", self.player_id)
            sector_id = request_data.get("sector_id")
            
            # Construire la rÃ©ponse de synchronisation
            sync_response = self._build_sync_response(player_id, sector_id)
            
            # Envoyer la rÃ©ponse directement au client demandeur
            self._send_response({
                "type": "data_sync_response",
                "message": sync_response
            })
            
        except Exception as e:
            # Envoyer une rÃ©ponse d'erreur
            self._send_response({
                "type": "data_sync_error",
                "message": {"error": "Erreur lors de la synchronisation des donnÃ©es"}
            })
            
    # construire la rÃ©ponse de synchronisation
    def _build_sync_response(self, player_id: int, sector_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Construit la rÃ©ponse de synchronisation avec toutes les donnÃ©es nÃ©cessaires.
        
        Args:
            player_id: ID du joueur demandant la synchronisation
            sector_id: ID du secteur (optionnel)
            
        Returns:
            Dict contenant toutes les donnÃ©es de synchronisation
        """
        try:
            # RÃ©cupÃ©rer ou reconstruire le cache si nÃ©cessaire
            self._cache_store.get_or_set_cache(need_to_be_recreated=False)
            
            # Construire les donnÃ©es de synchronisation
            sync_data = {
                "current_player": self._get_current_player_sync_data(player_id),
                "other_players": self._get_other_players_sync_data(player_id),
                "map_informations": self._get_map_informations_sync_data(),
                "sector_data": self._cache_store.get_sector_data(),
                "npcs": self._get_npcs_sync_data(),
                "sector_elements": self._get_sector_elements_sync_data(),
                "sync_timestamp": self._cache_store.get_datetime_json(
                    datetime.datetime.now()
                )
            }
            
            return sync_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la construction de la rÃ©ponse de sync: {e}")
            return {"error": "Erreur lors de la construction des donnÃ©es"}

    # 4. MÃ‰THODES HELPER pour construire les donnÃ©es de synchronisation
    def _get_current_player_sync_data(self, player_id: int) -> Optional[Dict[str, Any]]:
        """RÃ©cupÃ¨re les donnÃ©es du joueur actuel."""
        try:
            current_player_data = self._cache_store.get_current_player_data(player_id)
            return current_player_data[0] if current_player_data else None
        except Exception as e:
            logger.error(f"Erreur lors de la rÃ©cupÃ©ration du joueur actuel: {e}")
            return None

    def _get_other_players_sync_data(self, player_id: int) -> list[Dict[str, Any]]:
        """RÃ©cupÃ¨re les donnÃ©es des autres joueurs."""
        try:
            players = self._cache_store.get_other_player_data(player_id) or []
            return [
                p for p in players
                if (p.get("ship", {}).get("status") != "DEAD")
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la rÃ©cupÃ©ration des autres joueurs: {e}")
            return []

    def _get_map_informations_sync_data(self) -> Dict[str, Any]:
        """RÃ©cupÃ¨re les informations de la carte."""
        try:
            cached_data = cache.get(self.room_group_name)
            if not cached_data:
                return {}
            
            return {
                "sector": cached_data.get("sector", {}),
                "pc": [
                    p for p in (cached_data.get("pc", []) or [])
                    if p.get("ship", {}).get("status") != "DEAD"
                ],
                "npc": [
                    n for n in (cached_data.get("npc", []) or [])
                    if n.get("ship", {}).get("status") != "DEAD"
                ],
                "sector_element": cached_data.get("sector_element", []),
                "wrecks": self._get_wrecks_sync_data(),
                "messages": cached_data.get("messages", [])
            }
        except Exception as e:
            logger.error(f"Erreur lors de la rÃ©cupÃ©ration des informations de carte: {e}")
            return {}

    def _get_npcs_sync_data(self) -> list[Dict[str, Any]]:
        """RÃ©cupÃ¨re les donnÃ©es des NPCs."""
        try:
            cached_data = cache.get(self.room_group_name)
            if not cached_data:
                return []
            return [
                n for n in (cached_data.get("npc", []) or [])
                if n.get("ship", {}).get("status") != "DEAD"
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la rÃ©cupÃ©ration des NPCs: {e}")
            return []

    def _get_sector_elements_sync_data(self) -> list[Dict[str, Any]]:
        """RÃ©cupÃ¨re les Ã©lÃ©ments du secteur."""
        try:
            cached_data = cache.get(self.room_group_name)
            return cached_data.get("sector_element", []) if cached_data else []
        except Exception as e:
            logger.error(f"Erreur lors de la rÃ©cupÃ©ration des Ã©lÃ©ments du secteur: {e}")
            return []

    def _get_wrecks_sync_data(self) -> list[Dict[str, Any]]:
        try:
            sector_id = int(self.room)
        except Exception:
            return []

        now = timezone.now()
        wrecks = ShipWreck.objects.filter(
            sector_id=sector_id,
            status="ACTIVE",
        ).filter(
            expires_at__isnull=True
        ) | ShipWreck.objects.filter(
            sector_id=sector_id,
            status="ACTIVE",
            expires_at__gt=now,
        )

        result = []
        for w in wrecks.distinct():
            coords = w.coordinates or {"x": 0, "y": 0}
            size = getattr(getattr(getattr(w.ship, "ship_category", None), "size", None), "copy", lambda: {"x": 1, "y": 1})()
            if not isinstance(size, dict):
                size = {"x": 1, "y": 1}
            result.append({
                "wreck_id": w.id,
                "wreck_key": f"wreck_{w.id}",
                "origin_type": w.origin_type,
                "coordinates": coords,
                "size": {"x": int(size.get("x", 1) or 1), "y": int(size.get("y", 1) or 1)},
                "ship": {
                    "id": w.ship_id,
                    "name": w.ship.name if w.ship else None,
                    "image": w.ship.image if w.ship else None,
                },
                "expires_at": w.expires_at.isoformat() if w.expires_at else None,
            })
        return result
    def _update_room_cache_on_wreck_created(self, dead_key: str, wreck_payload: Dict[str, Any]) -> None:
        cache_key = self.room_group_name
        room_cache = cache.get(cache_key)
        if not isinstance(room_cache, dict):
            return

        if isinstance(dead_key, str):
            if dead_key.startswith("pc_"):
                dead_id = str(dead_key.replace("pc_", ""))
                room_cache["pc"] = [
                    p for p in (room_cache.get("pc", []) or [])
                    if str(p.get("user", {}).get("player")) != dead_id
                ]
            elif dead_key.startswith("npc_"):
                dead_id = str(dead_key.replace("npc_", ""))
                room_cache["npc"] = [
                    n for n in (room_cache.get("npc", []) or [])
                    if str(n.get("npc", {}).get("id")) != dead_id
                ]

        wrecks = list(room_cache.get("wrecks", []) or [])
        wrecks = [w for w in wrecks if str(w.get("wreck_id")) != str(wreck_payload.get("wreck_id"))]
        wrecks.append(wreck_payload)
        room_cache["wrecks"] = wrecks

        cache.set(cache_key, room_cache)

    def _update_room_cache_on_wreck_expired(self, wreck_id: Any) -> None:
        cache_key = self.room_group_name
        room_cache = cache.get(cache_key)
        if not isinstance(room_cache, dict):
            return

        room_cache["wrecks"] = [
            w for w in (room_cache.get("wrecks", []) or [])
            if str(w.get("wreck_id")) != str(wreck_id)
        ]
        cache.set(cache_key, room_cache)

    # 5. MÃ‰THODE UTILITAIRE pour valider les donnÃ©es avant envoi
    def _validate_sync_data(self, sync_data: Dict[str, Any]) -> bool:
        """
        Valide les donnÃ©es de synchronisation avant envoi.
        
        Args:
            sync_data: DonnÃ©es Ã  valider
            
        Returns:
            True si les donnÃ©es sont valides, False sinon
        """
        required_keys = ["current_player", "other_players", "map_informations"]
        
        try:
            # VÃ©rifier la prÃ©sence des clÃ©s requises
            if not all(key in sync_data for key in required_keys):
                logger.warning("ClÃ©s manquantes dans les donnÃ©es de synchronisation")
                return False
            
            # VÃ©rifier que current_player n'est pas None si on s'attend Ã  ce qu'il existe
            if sync_data["current_player"] is None:
                logger.warning("current_player est None dans les donnÃ©es de synchronisation")
                # Ce n'est pas forcÃ©ment une erreur, le joueur pourrait ne pas Ãªtre dans ce secteur
            
            # VÃ©rifier que other_players est une liste
            if not isinstance(sync_data["other_players"], list):
                logger.warning("other_players n'est pas une liste")
                return False
            
            # VÃ©rifier que map_informations est un dictionnaire
            if not isinstance(sync_data["map_informations"], dict):
                logger.warning("map_informations n'est pas un dictionnaire")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation des donnÃ©es de sync: {e}")
            return False
        
    def async_send_chat_msg(self, event: dict) -> None:
        """
        GÃ¨re l'envoi d'un message de chat par un joueur.
        - Seul le consumer du joueur auteur crÃ©e et diffuse le message.
        - Les autres ne font rien.
        """
        try:
            data = event["message"]
            if isinstance(data, str):
                data = json.loads(data)
                
            author_id = data.get("sender_id")
            content = data.get("content")
            channel = data.get("channel")  # "sector", "faction" ou "group"

            if not author_id or not content or not channel:
                logger.warning("async_send_chat_msg: donnÃ©es incomplÃ¨tes")
                return

            # Seul le consumer du joueur auteur traite le message
            if author_id != self.player_id:
                return

            player_action = PlayerAction(self.user.id)

            current_ship = (
                PlayerShip.objects
                .select_related("ship")
                .filter(player_id=self.player_id, is_current_ship=True)
                .first()
            )
            if current_ship:
                is_overloaded, cargo_load, cargo_capacity = is_ship_over_capacity(current_ship)
                if is_overloaded:
                    self._send_action_failed_response(
                        "CARGO_OVER_CAPACITY",
                        "Impossible de se dÃ©placer : votre vaisseau est en surcapacitÃ©.",
                        cargo_load=cargo_load,
                        cargo_capacity=cargo_capacity,
                    )
                    return False

            # === CrÃ©ation du message selon le canal ===
            msg, recipients = player_action.create_chat_message(content, channel)

            if not msg:
                logger.warning(f"Ã‰chec crÃ©ation message chat ({channel})")
                return

            if not recipients:
                logger.info(f"Aucun destinataire trouvÃ© pour le canal {channel}")
                return
            
            # DonnÃ©es auteur
            author_data = player_action.get_player_data()
            
            author_info = (
                author_data
                .values("name", "faction_id", "faction_id__name")
                .first()
            ) or {}
            author_name = author_info.get("name") or "Unknown"
            author_faction = author_info.get("faction_id__name") or ""
            author_faction_color = GetDataFromDB().get_faction_badge_color_class(
                faction_id=author_info.get("faction_id"),
                faction_name=author_faction,
            )
            content = msg.content
            timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
            
            # PrÃ©parer le message formatÃ©
            formatted_message = {
                "author": author_name,
                "faction": author_faction,
                "faction_color": author_faction_color,
                "content": content,
                "channel": channel,
                "timestamp": timestamp
            }

            self._broadcast_chat_message(channel, recipients, formatted_message)
            # RÃ©ponse locale au joueur auteur (message immÃ©diat)
            self._send_response({
                "type": "async_receive_chat_message",
                "message": formatted_message
            })

        except Exception as e:
            logger.exception(f"Erreur async_send_chat_msg: {e}")

    def _broadcast_chat_message(self, channel: str, recipients: list, formatted_message: dict):
        """
        Diffuse un message de chat Ã  tous les destinataires valides.
        """
        try:
            # Grouper les destinataires par secteur pour optimiser
            recipients_by_sector = {}
            
            for recipient in recipients:
                recipient_id = recipient.get("id")
                recipient_sector = recipient.get("sector_id")

                # Ne pas renvoyer Ã  l'auteur (il a dÃ©jÃ  reÃ§u le message localement)
                if recipient_id == self.player_id:
                    continue
                
                # Pour faction/groupe, le secteur peut Ãªtre diffÃ©rent
                if not recipient_sector:
                    logger.warning(f"Destinataire {recipient_id} sans sector_id")
                    continue
                
                # Grouper par room
                room_key = f"play_{recipient_sector}"
                if room_key not in recipients_by_sector:
                    recipients_by_sector[room_key] = []
                recipients_by_sector[room_key].append(recipient_id)
            
            # âœ… Envoyer UNE SEULE FOIS par room (pas par destinataire)
            for room_key, recipient_ids in recipients_by_sector.items():
                async_to_sync(self.channel_layer.group_send)(
                    room_key,
                    {
                        "type": "async_receive_chat_message",
                        "message": formatted_message,
                        "target_recipients": recipient_ids,  # Liste des IDs concernÃ©s
                    },
                )

        except Exception as e:
            logger.exception(f"Erreur lors de la diffusion du message chat: {e}")


    def async_receive_chat_message(self, event: dict) -> None:
        """
        ReÃ§oit un message de chat pour ce joueur (appelÃ© par group_send).
        """
        try:
            data = event.get("message")
            target_recipients = event.get("target_recipients", [])
            
            if not data:
                return
            
            # âœ… Ne dÃ©livrer que si ce consumer correspond Ã  un destinataire
            if target_recipients and self.player_id not in target_recipients:
                return

            # Envoi au client WebSocket
            self._send_response({
                "type": "async_receive_chat_message",
                "message": data
            })

        except Exception as e:
            logger.exception(f"Erreur async_receive_chat_message: {e}")

    def async_send_mp(self, event: Dict[str, Any]) -> None:
        """
        Handler appelÃ© quand un client a demandÃ© d'envoyer un MP et que le message
        a Ã©tÃ© group_send sur la room du consumer de l'auteur.
        Cette mÃ©thode doit Ãªtre exÃ©cutÃ©e **seulement** par le consumer du joueur-auteur.
        """
        try:
            # Accept both dict and JSON-string messages (robuste)
            message = event.get("message")
            if isinstance(message, str):
                message = json.loads(message)

            sender_id = message.get("senderId")
            # On ne traite QUE si ce consumer reprÃ©sente l'auteur
            if sender_id != self.player_id:
                # ignorer: seul le consumer de l'auteur doit crÃ©er l'entrÃ©e DB + notifier
                return

            recipient_name = message.get("recipient")
            recipient_type = message.get("recipient_type")
            mp_subject = message.get("subject")
            mp_body = message.get("body")

            # validation minimale
            if not recipient_name or not mp_subject or not mp_body:
                return

            # Utiliser PlayerAction correctement (id)
            player_action = PlayerAction(self.user.id)

            if recipient_type == "faction":
                faction_id = player_action.get_player_faction()
                recipient_data = GetDataFromDB.get_mp_recipient_linked_with_faction(faction_id)
            elif recipient_type == "player":
                recipient_data = GetDataFromDB.get_mp_recipient_sector_and_id(recipient_name)
            elif recipient_type == "group":
                recipient_data = []  # Ã  implÃ©menter si nÃ©cessaire
            else:
                logger.warning(f"async_send_mp: recipient_type inconnu: {recipient_type}")
                return

            # liste d'ids destinataires
            recipient_id_list = [e["id"] for e in (recipient_data or [])]

            # crÃ©er les MP en DB
            player_action.create_new_mp(recipient_id_list, mp_subject, mp_body)

            # notifier l'auteur que l'envoi est ok
            self._send_response({
                "type": "async_sent_mp",
                "message": {"id": sender_id}
            })

            # notifier les destinataires (rooms Ã©ventuellement diffÃ©rentes)
            self._notify_msg(recipient_data, sender_id)

        except json.JSONDecodeError as e:
            logger.error(f"async_send_mp JSON error: {e}")
        except Exception as e:
            logger.exception(f"async_send_mp unexpected error: {e}")
            
            
    def async_receive_mp(self, event: Dict[str, Any]) -> None:
        """
        Handler exÃ©cutÃ© par les consumers des rooms cibles.
        Il ne doit dÃ©livrer la notif que si ce consumer correspond au destinataire.
        """
        try:
            message = event.get("message")
            if isinstance(message, str):
                message = json.loads(message)

            recipient_id = message.get("recipient_id")

            # Si ce consumer n'est pas le destinataire, on ignore
            if recipient_id != self.player_id:
                return

            # Envoi au client final (websocket) : type et message Ã  adapter cÃ´tÃ© front
            self._send_response({
                "type": "async_receive_mp",
                "message": {
                    "recipient_id": recipient_id,
                    "note": "Vous avez reÃ§u un message privÃ©"
                }
            })

        except Exception as e:
            logger.exception(f"async_receive_mp error: {e}")

    def async_recieve_mp(self, event: Dict[str, Any]) -> None:
        """
        Alias rÃ©tro-compatible (typo historique).
        Channels mappe `type` -> nom de mÃ©thode; on dÃ©lÃ¨gue vers le nom canonique.
        """
        self.async_receive_mp(event)
            
            
    def bank_balance_update(self, event: Dict[str, Any]) -> None:
        payload = event.get("payload") or event.get("message") or {}
        if not isinstance(payload, dict):
            return

        target_player_id = payload.get("player_id")
        if target_player_id is not None:
            try:
                if int(target_player_id) != int(self.player_id):
                    return
            except (TypeError, ValueError):
                return

        self._send_response(
            {
                "type": "bank_balance_update",
                "payload": payload,
            }
        )

    def _notify_msg(self, recipient_data, sender_id) -> None:
        """
        Envoie une notification de type 'async_receive_mp' dans la room de
        chaque destinataire. Exclut l'auteur.
        recipient_data: list of dicts [{ 'id': ..., 'sector_id': ... }, ...]
        """
        try:
            if not recipient_data:
                return

            for data in recipient_data:
                recipient_player_id = data.get("id")
                recipient_sector = data.get("sector_id")

                # Exclure l'auteur explicitement
                if recipient_player_id == sender_id:
                    continue

                if recipient_sector is None:
                    logger.warning(f"_notify_msg: destinataire {recipient_player_id} sans sector_id")
                    continue

                destination_room_key = f"play_{recipient_sector}"

                # Toujours envoyer un dict (Ã©viter la sÃ©rialisation incohÃ©rente)
                async_to_sync(self.channel_layer.group_send)(
                    destination_room_key,
                    {
                        "type": "async_receive_mp",
                        "message": {
                            "recipient_id": recipient_player_id,
                            "from_id": sender_id,
                            "subject": data.get("subject"),  # facultatif, si dispo
                        },
                    },
                )
        except Exception as e:
            logger.exception(f"_notify_msg error: {e}")
            
    def _handle_move_request(self, message: Dict[str, Any]) -> None:
        """
        Le joueur A envoie un mouvement.
        SEUL son consumer valide et enregistre.
        """
        try:
            # Ã‰tape 1 : validation complÃ¨te
            if not self._validate_move_request(message):
                return  # ne rien broadcaster si invalide

            # Ã‰tape 2 : enregistrement du mouvement (DB + cache)
            player_action = PlayerAction(self.user.id)

            registered = player_action.move_have_been_registered(
                coordinates=f"{message['end_y']}_{message['end_x']}",
                move_cost=int(message["move_cost"]),
                player_id=message["player"],
            )

            if not registered:
                self._send_error_response("Impossible d'enregistrer le mouvement")
                return

            # Mise Ã  jour du cache
            self._cache_store.update_player_range_finding()
            self._cache_store.update_sector_player_visibility_zone(self.player_id)

            # Ã‰tape 3 : broadcast Ã  tout le monde
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "async_move",
                    "message": message
                }
            )
            self._emit_group_state_sync_for_player_group(
                int(message.get("player", self.player_id)),
                reason="GROUP_MEMBER_MOVED",
            )

        except Exception as e:
            logger.error(f"Erreur _handle_move_request: {e}")

    def _validate_move_request(self, message: Dict[str, Any]) -> bool:
        """
        Valide la demande de mouvement (appelÃ© UNE SEULE FOIS).
        Retourne True si le mouvement est valide, False sinon.
        """
        try:
            # 1. VÃ©rification identitÃ© joueur
            if message["player"] != self.player_id:
                self._send_error_response("Vous ne pouvez pas dÃ©placer un autre joueur")
                return False
            
            player_action = PlayerAction(self.user.id)

            # 2. VÃ©rifier PM restants
            if not player_action.check_if_player_get_movement_remaining(message['move_cost']):
                self._send_error_response("Points de mouvement insuffisants")
                return False

            # 3. VÃ©rifier taille du vaisseau
            size_data = player_action.get_player_ship_size()
            if not size_data or "ship_id__ship_category_id__size" not in size_data:
                logger.error(f"Vaisseau introuvable ou non initialisÃ© pour joueur {self.player_id}")
                self._send_error_response("Vaisseau introuvable")
                return False
            
            ship_size = size_data["ship_id__ship_category_id__size"]

            # 4. VÃ©rifier destination
            target_cells = player_action._calculate_item_occupied_coords(
                {"x": message["end_x"], "y": message["end_y"]},
                ship_size
            )

            formatted = [f"{c['y']}_{c['x']}" for c in target_cells]
            if player_action.destination_already_occupied(formatted):
                self._send_error_response("Destination occupÃ©e")
                return False

            return True
        
        except Exception as e:
            logger.error(f"Erreur validation mouvement: {e}")
            self._send_error_response("Erreur de validation")
            return False


    def _send_error_response(self, error_message: str) -> None:
        return
        """Envoie une rÃ©ponse d'erreur au client."""
        """
        self._send_response({
            "type": "move_error",
            "message": {"error": error_message}
        })"""
            

    def async_move(self, event: Dict[str, Any]) -> None:
        """
        Tous les autres consumers reÃ§oivent la mise Ã  jour.
        Ici : aucune validation, aucun enregistrement DB.
        Juste mise Ã  jour du cache local + rÃ©ponse client.
        """
        try:
            message = event["message"]
            player_action = PlayerAction(self.user.id)

            # Mise Ã  jour du cache
            self._cache_store.update_player_position(message, self.player_id)
            self._cache_store.update_player_range_finding()
            movement_remaining = player_action.get_player_movement_remaining()
            movement_max = int(player_action.get_playerShip().values_list('max_movement', flat=True)[0])
            # PrÃ©parer la rÃ©ponse pour CE joueur
            response = {
                "type": "player_move",
                "message": {
                    "player_id": message["player"],
                    "end_x": message["end_x"],
                    "end_y": message["end_y"],
                    "move_cost": message["move_cost"],
                    "move": movement_remaining,
                    "path": message["path"],
                    "max_move": movement_max,
                    "is_reversed": message.get("is_reversed", False),
                    "size": {
                        "x": message.get("size_x", 1),
                        "y": message.get("size_y", 1)
                    },
                    "modules_range": self._cache_store.get_specific_player_data(
                        self.player_id, "pc", "ship", "modules_range"
                    ),
                    "visible_zone": self._cache_store.get_specific_player_data(
                        self.player_id, "pc", "ship", "visible_zone"
                    ),
                },
            }

            self._send_response(response)

            if message["player"] == self.player_id:

                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "entity_state_update",
                        "entity_key": f"pc_{message['player']}",
                        "change_type": "mp_update",
                        "changes": {
                            "position": {
                                "x": message["end_x"],
                                "y": message["end_y"],
                            },
                            "movement": {
                                "current": movement_remaining,
                                "max": movement_max,
                            }
                        }
                    }
                )

        except Exception as e:
            logger.error(f"Erreur async_move: {e}")

    def _is_own_player_move(self, player_id: int, message: Dict[str, Any]) -> bool:
        """VÃ©rifie si le mouvement concerne le joueur actuel."""
        return player_id == message["player"]

    def _can_move_to_destination(self, player_action: PlayerAction, message: Dict[str, Any]) -> bool:
        """VÃ©rifie si la destination est libre."""
        return not player_action.destination_already_occupied(
            [f"{message['end_y']}_{message['end_x']}"]
        )

    def _register_move(self, player_action: PlayerAction, message: Dict[str, Any]) -> bool:
        """Enregistre le mouvement du joueur."""
        return player_action.move_have_been_registered(
            coordinates=f"{message['end_y']}_{message['end_x']}",
            move_cost=int(message["move_cost"]),
            player_id=message["player"],
        )

    def _create_own_move_response(
        self,
        store: StoreInCache,
        player_action: PlayerAction,
        message: dict,
    ) -> dict:
        """
        RÃ©ponse envoyÃ©e AU JOUEUR QUI BOUGE.
        On renvoie:
            - les infos attendues par le front pour animer le dÃ©placement:
            end_x, end_y, move_cost, move, path, max_move, is_reversed, size
            - les infos supplÃ©mentaires pour mettre Ã  jour map_informations / UI :
            modules_range, visible_zone, view_range, sector, updated_*_player_data
        """

        player_id = message["player"]

        # PM restants du joueur courant (aprÃ¨s mouvement)
        movement_remaining = player_action.get_player_movement_remaining()
        max_movement = store.get_specific_player_data(
            player_id, "pc", "ship", "max_movement"
        )

        # Modules en portÃ©e + zones visibles + view_range
        modules_range = store.get_specific_player_data(
            player_id, "pc", "ship", "modules_range"
        )
        visible_zone = store.get_specific_player_data(
            player_id, "pc", "ship", "visible_zone"
        )
        sonar_zone = store.get_specific_player_data(
            player_id, "pc", "ship", "sonar_zone"
        )
        view_range = store.get_specific_player_data(
            player_id, "pc", "ship", "view_range"
        )

        # DonnÃ©es complÃ¨tes pour refresh UI / modals
        updated_current_player_data = store.get_current_player_data(player_id)
        updated_other_player_data = store.get_other_player_data(player_id)
        sector_data = store.get_sector_data()

        return {
            "type": "player_move",
            "message": {
                # --- Infos de base pour le front (ANIMATION + POSITION) ---
                "player_id": player_id,
                "end_x": message["end_x"],
                "end_y": message["end_y"],
                "move_cost": message["move_cost"],
                # PM restants aprÃ¨s mouvement (ce que ton front appelle souvent "move")
                "move": movement_remaining,
                # chemin complet utilisÃ© pour lâ€™animation case par case
                "path": message.get("path", []),
                "max_move": max_movement,
                "visible_zone": visible_zone,
                "sonar_zone": sonar_zone,
                "is_reversed": message["is_reversed"],
                "size": {
                    "x": message["size_x"],
                    "y": message["size_y"],
                },

                # --- Infos gameplay complÃ©mentaires ---
                "modules_range": modules_range,
                "visible_zone": visible_zone,
                "view_range": view_range,

                # --- Pour Ã©ventuellement rafraÃ®chir map_informations cÃ´tÃ© client ---
                "updated_current_player_data": updated_current_player_data,
                "updated_other_player_data": updated_other_player_data,
                "sector": sector_data,

                # Optionnel : si tu veux garder trace de la zone de dÃ©part complÃ¨te
                "start_id_array": message.get("start_id_array", []),
            },
        }

    def _handle_other_player_move(
        self, 
        message: Dict[str, Any], 
        player_action: PlayerAction, 
        store: StoreInCache, 
        player_id: int
    ) -> Dict[str, Any]:
        """GÃ¨re le mouvement d'un autre joueur."""
        store.update_player_range_finding()
        return {
            "type": "player_move",
            "message": {
                "player_id": message["player"],
                "updated_other_player_data": store.get_other_player_data(self.player_id),
                "updated_current_player_data": store.get_current_player_data(self.player_id),
                "otherPlayerData": player_action.get_other_player_name(message["player"]),
                "is_reversed": message["is_reversed"],
                "sector": store.get_sector_data(),
                "start_id_array": message["start_id_array"],
                "movement_remaining": player_action.get_other_player_movement_remaining(
                    message["player"]
                ),
                "max_movement": store.get_specific_player_data(
                    message["player"], "pc", "ship", "max_movement"
                ),
                "modules_range": store.get_specific_player_data(
                    player_id, "pc", "ship", "modules_range"
                ),
                "size": {"x" : message["size_x"], "y" : message["size_y"]},
            },
        }

    def async_warp_travel(self, event: Dict[str, Any]) -> None:
        """
        GÃ¨re le voyage par distorsion asynchrone.

        - Retire le joueur du secteur courant (visuel + cache)
        - Calcule la destination
        - Met Ã  jour la DB
        - Met Ã  jour les caches (ancien + nouveau secteur)
        - Notifie :
            * les joueurs de l'ancien secteur -> async_remove_ship
            * les joueurs du nouveau secteur -> async_user_join
            * le joueur lui-mÃªme        -> async_warp_complete
        """
        try:
            raw = event.get("message")
            if isinstance(raw, str):
                warp_data = json.loads(raw)
            else:
                warp_data = raw

            # --- VÃ©rifications ---
            if not warp_data:
                logger.error("async_warp_travel: warp_data manquant")
                return

            player_id = warp_data.get("player_id")
            sectorwarpzone_id = warp_data.get("sectorwarpzone_id")
            current_sector_id = warp_data.get("current_sector_id")

            if not player_id or not sectorwarpzone_id or not current_sector_id:
                logger.error(f"async_warp_travel: donnÃ©es incomplÃ¨tes {warp_data}")
                return

            # --- Si ce consumer nâ€™est PAS le joueur concernÃ© â†’ sortir ---
            if player_id != self.player_id:
                return

            # =======================
            # 1) NOTIFIER l'ancien secteur (visuel uniquement)
            # =======================
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "async_remove_ship",
                    "message": {
                        "player_id": player_id,
                        "start_id_array": warp_data.get("start_id_array", []),
                        "coordinates": warp_data.get("coordinates", {}),
                        "size": warp_data.get("size", {}),
                    },
                },
            )

            # =======================
            # 2) Calcul de la destination
            # =======================
            pa = PlayerAction(self.user.id)

            current_ship = (
                PlayerShip.objects
                .select_related("ship")
                .filter(player_id=player_id, is_current_ship=True)
                .first()
            )
            if current_ship:
                is_overloaded, cargo_load, cargo_capacity = is_ship_over_capacity(current_ship)
                if is_overloaded:
                    self._send_response(
                        {
                            "type": "async_warp_failed",
                            "message": {"reason": "cargo_over_capacity"},
                        }
                    )
                    self._send_action_failed_response(
                        "CARGO_OVER_CAPACITY",
                        "Impossible de warp : votre vaisseau est en surcapacitÃ©.",
                        cargo_load=cargo_load,
                        cargo_capacity=cargo_capacity,
                    )
                    return

            links = SectorWarpZone.objects.filter(id=sectorwarpzone_id).first()
            if not links:
                self._send_response(
                    {
                        "type": "async_warp_failed",
                        "message": {"reason": "invalid_warp_link"},
                    }
                )
                return

            warp_home_id = links.warp_home_id
            warp_destination_id = links.warp_destination_id

            dest = pa.player_travel_to_destination(warp_home_id, warp_destination_id)
            if not dest:
                # dÃ©placement impossible â†’ prÃ©venir joueur
                self._send_response(
                    {
                        "type": "async_warp_failed",
                        "message": {"reason": "no_valid_destination"},
                    }
                )
                return

            destination_sector_id, dest_coord = dest
            
            # =======================
            # 2.5) INVALIDATION DES SCANS (AVANT DE QUITTER LE SECTEUR)
            # =======================

            old_sector_id = current_sector_id  # dÃ©jÃ  prÃ©sent dans warp_data

            # 1) Supprimer les scans en DB
            ActionRules.invalidate_scans_for_target(
                target_type="pc",
                target_id=player_id,
                sector_id=old_sector_id,
            )

            # 2) Notifier tous les clients du secteur
            pa._emit_scan_invalidation(
                target_type="pc",
                target_id=player_id,
                sector_id=old_sector_id,
            )

            # =======================
            # 3) Mise Ã  jour DB
            # =======================
            ok = pa.set_player_sector(destination_sector_id, dest_coord)
            if not ok:
                logger.error(
                    f"async_warp_travel: Ã©chec update DB pour player {player_id}"
                )
                return

            # =======================
            # 4) Nettoyage du CACHE de l'ancien secteur
            # =======================
            try:
                old_cache = StoreInCache(self.room_group_name, self.user)
                old_cache.delete_player_from_cache(
                    player_id=player_id,
                    old_room=self.room_group_name,
                )
            except Exception as e:
                logger.error(
                    f"async_warp_travel: erreur delete_player_from_cache "
                    f"pour player {player_id} dans room {self.room_group_name}: {e}"
                )

            # =======================
            # 5) Mise Ã  jour du cache du NOUVEAU secteur
            # =======================
            new_room_key = f"play_{destination_sector_id}"

            dest_cache = StoreInCache(new_room_key, self.user)
            # Forcer la recrÃ©ation pour intÃ©grer le joueur avec ses nouvelles coords
            dest_cache.get_or_set_cache(need_to_be_recreated=True)

            # Mettre Ã  jour portÃ©e + visibilitÃ© dans ce nouveau secteur
            dest_cache.update_player_range_finding()
            dest_cache.update_sector_player_visibility_zone(player_id)

            # RÃ©cupÃ©rer les donnÃ©es prÃªtes Ã  envoyer au front
            new_sector_data = dest_cache.get_or_set_cache(need_to_be_recreated=False)

            # =======================
            # 6) Notifier les joueurs du NOUVEAU secteur
            # =======================
            async_to_sync(self.channel_layer.group_send)(
                new_room_key,
                {
                    "type": "async_user_join",
                    "message": new_sector_data.get("pc", []),
                },
            )

            # =======================
            # 7) Notifier le joueur qui a warpÃ©
            # =======================
            self._send_response(
                {
                    "type": "async_warp_complete",
                    "message": {
                        "new_sector_id": destination_sector_id,
                        "new_room_key": new_room_key,
                        "new_sector_data": new_sector_data,
                        "player_id": player_id,
                    },
                }
            )
            self._emit_group_state_sync_for_player_group(
                int(player_id),
                reason="GROUP_MEMBER_WARPED",
            )
            
            playerObj = pa.get_player_data()
            player_instance = playerObj.first()
            
            db = GetDataFromDB
            destination_from = db.get_sector_name(old_sector_id)
            destination_to = db.get_sector_name(destination_sector_id)
            
            payload = {
                "event": "ZONE_CHANGE",
                "from": destination_from,
                "to": destination_to
            }

            create_event_log(
                players_roles=[(player_instance, "TRANSMITTER")],
                log_type="ZONE_CHANGE",
                payload=payload
            )


        except Exception as e:
            logger.exception(f"async_warp_travel ERROR: {e}")
            
    def async_warp_complete(self, event):
        """
        MÃ©thode appelÃ©e automatiquement par WebSocketConsumer lorsque
        l'on fait:
        self._send_response({"type": "async_warp_complete", ...})
        """
        msg = event.get("message")
        self._purge_combat_participation_from_message(msg)
        self._send_response({
            "type": "async_warp_complete",
            "message": msg
        })
        
    def async_remove_ship(self, event):
        """
        Un joueur quitte le secteur (warp ou dÃ©connexion).
        On notifie SEULEMENT les autres joueurs.
        """
        msg = event.get("message", {})
        self._purge_combat_participation_from_message(msg)
        
        # Ne rien envoyer au joueur qui part -> il recevra async_warp_complete
        if msg.get("player_id") == self.player_id:
            return
        
        self._send_response({
            "type": "async_remove_ship",
            "message": msg
        })
        
    def _handle_scan_action_pc_npc(self, payload):
        target_type = payload.get("target_type")
        target_id = payload.get("target_id")

        # 1) VÃ©rifier PA
        player = PlayerAction(self.user.id)
        can_consume_ap, remaning_ap = player.consume_ap(1)
        player_id = player.get_player_id()
        
        if not can_consume_ap:
            self._send_response({
                "type": "action_failed",
                "reason": "NOT_ENOUGH_AP"
            })
            return
        
        if target_type == "npc" or target_type == "pc":
            module_name = "spaceship probe"
        else:
            module_name = "drilling probe"
            
        if not GetDataFromDB.check_if_player_has_module(player_id, module_name):
            self._send_response({
                "type": "action_failed",
                "reason": "NO_MODULE_FOUND"
            })
            return
        
        target_name = ""
        transmitter_playerObj = player.get_player_data()
        transmitter_instance = transmitter_playerObj.first()
        
        # 3) Construire les vraies donnÃ©es
        if target_type == "pc":
            data = build_pc_modal_data(target_id)
            current_player_data = build_pc_modal_data(player_id)
            receiver_playerObj = player.get_other_player_data(data['user']['player'])
            receiver_instance = receiver_playerObj.first()
            target_name = receiver_instance.name
            players_roles = [
                (transmitter_instance, "TRANSMITTER"), 
                (receiver_instance, "RECEIVER")
            ]

        elif target_type == "npc":
            data = build_npc_modal_data(target_id)
            current_player_data = build_pc_modal_data(player_id)
            target_name = (data or {}).get('npc', {}).get('displayed_name', f"npc_{target_id}")
            players_roles = [(transmitter_instance, "TRANSMITTER")]

        else:
            data = build_sector_element_modal_data(target_type, int(target_id))
            target_name = (data or {}).get('data', {}).get('name', f"{target_type}_{target_id}")
            players_roles = [(transmitter_instance, "TRANSMITTER")]

        # Difficulty badge (PC/NPC only)
        if target_type in ("pc", "npc") and data and current_player_data:
            def _avg_tier(mods):
                tiers = []
                for m in mods or []:
                    tier = m.get("tier") if isinstance(m, dict) else None
                    if isinstance(tier, (int, float)):
                        tiers.append(float(tier))
                if not tiers:
                    return None
                return sum(tiers) / len(tiers)

            def _difficulty_label(attacker_mods, target_mods):
                avg_att = _avg_tier(attacker_mods)
                avg_tgt = _avg_tier(target_mods)
                if avg_att is None or avg_tgt is None:
                    return None
                delta = avg_tgt - avg_att
                if delta >= 3.0:
                    return "Rouge"
                if delta >= 1.5:
                    return "Orange"
                if delta > -1.0:
                    return "Jaune"
                if delta >= -3.0:
                    return "Vert"
                return "Gris"

            difficulty = _difficulty_label(
                current_player_data.get("ship", {}).get("modules"),
                data.get("ship", {}).get("modules")
            )
            if difficulty:
                data["difficulty"] = difficulty

        if not data:
            self._send_response({
                "type": "action_failed",
                "reason": "INVALID_TARGET"
            })
            return
        
        payload = {
            "event": "SCAN",
            "author": transmitter_instance.name,
            "target": target_name
        }

        log = create_event_log(
            players_roles=players_roles,
            log_type="SCAN",
            payload=payload
        )
        
        player_logs = player.get_player_log(log=log)
        self.push_event_log(player_logs)

        sector_id_int = int(self.room)

        scan = ActionRules.upsert_scan(
            scanner_player_id=player_id,
            target_type=target_type,
            target_id=target_id,
            sector_id=sector_id_int
        )
        
        # 4) RÃ©pondre AU JOUEUR uniquement
        self._send_response({
            "type": "scan_result",
            "message": {
                "target_key": f"{target_type}_{target_id}",
                "data": data,
                "remaining_ap": remaning_ap,
                "expires_at": scan.expires_at.isoformat()
            }
        })

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "entity_state_update",
                "entity_key": f"pc_{player_id}",
                "change_type": "ap_update",
                "changes": {
                    "ap": {
                        "current": remaning_ap,
                        "max": player.get_player_max_ap(),
                    }
                }
            }
        )

    def _handle_share_scan(self, payload):
        target_type = payload.get("target_type")
        target_id = payload.get("target_id")

        player_action = PlayerAction(self.user.id)
        player_id = player_action.get_player_id()
        now = timezone.now()

        if target_type not in {"pc", "npc"}:
            self._send_response({
                "type": "action_failed",
                "message": {"reason": "INVALID_TARGET_TYPE"},
            })
            return
        try:
            target_id = int(target_id)
        except (TypeError, ValueError):
            self._send_response({
                "type": "action_failed",
                "message": {"reason": "INVALID_TARGET_ID"},
            })
            return
        
        group_id = GetDataFromDB.get_group_member(player_id)
        if not group_id:
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "NOT_IN_GROUP"
                },
                
            })
            return

        sector_id_int = int(self.room)

        # Le partage n'est autorise que pour une cible active scannee par ce joueur.
        scan = (
            ScanIntel.objects.filter(
                scanner_player_id=player_id,
                target_type=target_type,
                target_id=target_id,
                sector_id=sector_id_int,
                invalidated_at__isnull=True,
                expires_at__gt=now,
            )
            .order_by("-expires_at")
            .values("id", "target_id", "target_type", "expires_at")
            .first()
        )
        if not scan:
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "SCAN_NOT_FOUND"
                },
            })
            return

        group_members = GetDataFromDB.get_players_in_group(group_id)
        group_member_ids = {
            int(e.get("id"))
            for e in group_members
            if e.get("id") is not None
        }

        # La cible ne doit pas etre un membre du groupe.
        if target_type == "pc" and int(target_id) in group_member_ids:
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "TARGET_IN_GROUP"
                },
            })
            return

        # Partage live uniquement aux membres presents dans le meme secteur.
        eligible_recipient_ids = [
            int(e["id"])
            for e in group_members
            if e.get("id") is not None
            and int(e.get("id")) != int(player_id)
            and e.get("sector_id") is not None
            and int(e.get("sector_id")) == int(sector_id_int)
        ]

        if not eligible_recipient_ids:
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "NO_GROUP_RECIPIENT_IN_SECTOR"
                },
            })
            return

        can_consume_ap, remaining_ap = player_action.consume_ap(1)
        if not can_consume_ap:
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "NOT_ENOUGH_AP"
                },
            })
            return
        
        recipient_group_links = list(
            PlayerGroup.objects.filter(
                group_id=group_id,
                player_id__in=eligible_recipient_ids,
            )
            .values_list("id", flat=True)
        )

        for player_group_link_id in recipient_group_links:
            ScanIntelGroup.objects.get_or_create(
                scan_id=int(scan["id"]),
                group_id=int(player_group_link_id),
            )

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "scan_share_to_group",
                "message": {
                    "target_key": f"{target_type}_{target_id}",
                    "expires_at": scan["expires_at"].isoformat() if scan.get("expires_at") else None,
                    "recipients": eligible_recipient_ids,
                }
            }
        )

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "entity_state_update",
                "entity_key": f"pc_{player_id}",
                "change_type": "ap_update",
                "changes": {
                    "ap": {
                        "current": remaining_ap,
                        "max": player_action.get_player_max_ap(),
                    }
                }
            }
        )
            
    def scan_share_to_group(self, event):
        self._send_response({
            "type": "scan_share_to_group",
            "message": event.get("message", {})
        })
        
    async def scan_visibility_update(self, event):
        await self.send_json({
            "type": "scan_visibility_update",
            "remove": event.get("remove", []),
            "reason": event.get("reason"),
        })

    def async_user_join(self, event: Dict[str, Any]) -> None:
        """
        GÃ¨re l'arrivÃ©e d'un utilisateur dans la salle.
        
        Args:
            event: Ã‰vÃ©nement contenant les donnÃ©es d'arrivÃ©e
        """
        response = {
            "type": "async_user_join",
            "message": event["message"],
        }
        self._send_response(response)

    def effects_invalidated(self, event):
        """
        ReÃ§oit l'invalidation d'effets (scan, buff, debuffâ€¦)
        """
        self._send_response({
            "type": "effects_invalidated",
            "payload": event.get("payload", []),
        })

    def group_state_sync(self, event: Dict[str, Any]) -> None:
        target_player_id = event.get("target_player_id")
        if target_player_id is not None:
            try:
                if int(target_player_id) != int(self.player_id):
                    return
            except (TypeError, ValueError):
                return

        self._send_response(
            {
                "type": "group_state_sync",
                "payload": event.get("payload", {}),
                "reason": event.get("reason"),
                "notice": event.get("notice"),
            }
        )

    def group_invitation(self, event: Dict[str, Any]) -> None:
        target_player_id = event.get("target_player_id")
        if target_player_id is not None:
            try:
                if int(target_player_id) != int(self.player_id):
                    return
            except (TypeError, ValueError):
                return

        self._send_response(
            {
                "type": "group_invitation",
                "payload": event.get("payload", {}),
            }
        )

    def group_action_feedback(self, event: Dict[str, Any]) -> None:
        target_player_id = event.get("target_player_id")
        if target_player_id is not None:
            try:
                if int(target_player_id) != int(self.player_id):
                    return
            except (TypeError, ValueError):
                return

        self._send_response(
            {
                "type": "group_action_feedback",
                "payload": event.get("payload", {}),
            }
        )
        
    def send_scan_state_sync(self):
        sector_id = int(self.room)
        scans = ActionRules.get_visible_scans_for_player(
            self.player_id,
            sector_id
        )

        if not scans:
            return

        targets = []
        current_player_data = build_pc_modal_data(self.player_id)

        def _avg_tier(mods):
            tiers = []
            for m in mods or []:
                tier = m.get("tier") if isinstance(m, dict) else None
                if isinstance(tier, (int, float)):
                    tiers.append(float(tier))
            if not tiers:
                return None
            return sum(tiers) / len(tiers)

        def _difficulty_label(attacker_mods, target_mods):
            avg_att = _avg_tier(attacker_mods)
            avg_tgt = _avg_tier(target_mods)
            if avg_att is None or avg_tgt is None:
                return None
            delta = avg_tgt - avg_att
            if delta >= 3.0:
                return "Rouge"
            if delta >= 1.5:
                return "Orange"
            if delta > -1.0:
                return "Jaune"
            if delta >= -3.0:
                return "Vert"
            return "Gris"

        for scan in scans:
            if scan.target_type == "pc":
                data = build_pc_modal_data(scan.target_id)
            elif scan.target_type == "npc":
                data = build_npc_modal_data(scan.target_id)
            else:
                data = build_sector_element_modal_data(scan.target_type, scan.target_id)

            if scan.target_type in ("pc", "npc") and data and current_player_data:
                difficulty = _difficulty_label(
                    current_player_data.get("ship", {}).get("modules"),
                    data.get("ship", {}).get("modules")
                )
                if difficulty:
                    data["difficulty"] = difficulty

            targets.append({
                "target_key": f"{scan.target_type}_{scan.target_id}",
                "expires_at": scan.expires_at.isoformat(),
                "data": data,
            })
        
        self._send_response({
            "type": "scan_state_sync",
            "message": {
                "targets": targets,
            }
        })
        
    def push_event_log(self, player_logs):
        """
        Envoie des logs temps rÃ©el en respectant EXACTEMENT
        le format WS attendu par ActionRegistry.
        """

        for pl in player_logs:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "event_log",
                    "target_player_id": pl.player_id,
                    "data": {
                        "id": pl.id,
                        "log_type": pl.log.log_type,
                        "role": pl.role,
                        "content": pl.log.content,
                        "created_at": pl.created_at.isoformat(),
                    }
                }
            )
            
    def event_log(self, event):
        if event.get("target_player_id") != self.player_id:
            return

        data = event.get("data") or {}
        serialized = serialize_event_log_data(
            log_id=data.get("id"),
            log_type=data.get("log_type"),
            role=data.get("role"),
            content=data.get("content"),
            created_at=data.get("created_at"),
            viewer_player_id=self.player_id,
            language_code=self.language_code,
        )
        self._send_response({
            "type": "event_log",
            "message": serialized,
        })

    def action_failed(self, event):
        target_player_id = event.get("target_player_id")
        if target_player_id is not None and int(target_player_id) != int(self.player_id):
            return

        payload = event.get("message", {})
        self._send_response({
            "type": "action_failed",
            "message": payload if isinstance(payload, dict) else {"reason": "UNKNOWN_ACTION_FAILURE"},
        })

    def ship_module_local_sync(self, event):
        if not self.player_id or int(event.get("target_player_id", -1)) != int(self.player_id):
            return
        self._send_response({
            "type": "ship_module_local_sync",
            "message": event.get("message", {}),
        })

    def wreck_loot_session_state(self, event):
        if not self.player_id or int(event.get("target_player_id", -1)) != int(self.player_id):
            return
        self._send_response({
            "type": "wreck_loot_session_state",
            "message": event.get("message", {}),
        })

    def wreck_loot_session_closed(self, event):
        if not self.player_id or int(event.get("target_player_id", -1)) != int(self.player_id):
            return
        self._send_response({
            "type": "wreck_loot_session_closed",
            "message": event.get("message", {}),
        })

    def scan_target_data_refresh(self, event):
        if not self.player_id or int(event.get("target_player_id", -1)) != int(self.player_id):
            return
        self._send_response({
            "type": "scan_target_data_refresh",
            "message": event.get("message", {}),
        })

    def entity_state_update(self, event):
        """
        ReÃ§oit une mise Ã  jour d'Ã©tat d'une entitÃ© (PC / NPC)
        et la forward telle quelle au client WebSocket.
        """
        try:
            self._send_response({
                "type": "entity_state_update",
                "message": {
                    "entity_key": event.get("entity_key"),
                    "change_type": event.get("change_type"),
                    "changes": event.get("changes", {}),
                }
            })

        except Exception as e:
            logger.error(f"Erreur entity_state_update: {e}")

    def _handle_combat_action(self, payload: dict) -> None:
        """
        Point d'entrÃ©e WS pour une attaque.
        Cette mÃ©thode orchestre le pipeline combat + les side-effects temps rÃ©el
        (patchs d'Ã©tat, mort, carcasse, logs, Ã©vÃ©nements d'animation).
        """
        try:
            if not payload:
                return
            
            pa = PlayerAction(self.user.id)
            source_player_id = pa.get_player_id()
            
            if payload.get("player") != source_player_id:
                return

            module_id = payload.get("module_id")
            target_key = payload.get("target_key")
            
            if not module_id or not target_key:
                return

            # -----------------------
            # RÃ©solution attaquant
            # -----------------------

            source_ship = PlayerShip.objects.select_related("player").get(
                player_id=source_player_id,
                is_current_ship=True,
            )

            source_ad = ActorAdapter(source_ship, "PC")

            # si joueur n'a pas de pv, alors il ne peut pas attaquer
            if source_ad.get_hp() <= 0:
                return
            # si joueur n'a pas d'AP, alors il ne peut pas attaquer
            if source_ad.get_ap() <= 0:
                return
            
            # -----------------------
            # RÃ©solution cible
            # -----------------------
            target_type, target_id = target_key.split("_")

            target_ship = None
            if target_type == "pc":
                target_ship = PlayerShip.objects.select_related("player").get(
                    player_id=int(target_id),
                    is_current_ship=True,
                )
                target_ad = ActorAdapter(target_ship, "PC")
            else:
                target_npc = Npc.objects.select_related("npc_template").get(
                    id=int(target_id)
                )
                target_ad = ActorAdapter(target_npc, "NPC")

            # si cible n'a pas de pv, alors elle ne peut
            # Ãªtre attaquÃ©e
            if target_ad.get_hp() <= 0:
                return

            # -----------------------
            # Module weaponry
            # -----------------------
            
            psm = source_ship.player_ship_module.select_related("module").filter(
                module_id=module_id
            ).first()

            if not psm:
                raise ValueError(f"Module {module_id} non Ã©quipÃ© sur ce vaisseau")

            module = psm.module
            effect = get_module_effect_map(module)
            damage_type = str(effect.get("damage_type", "TORPEDO")).upper()

            weapon = WeaponProfile(
                damage_type=damage_type,
                min_damage=int(get_effect_numeric(module, "min_damage", default=1, strategy="min") or 1),
                max_damage=int(get_effect_numeric(module, "max_damage", default=1, strategy="max") or 1),
                range_tiles=int(get_effect_numeric(module, "range", default=1, strategy="max") or 1),
            )

            # -----------------------
            # Distance / visibilitÃ©
            # (le front fait dÃ©jÃ  le visuel,
            #  le backend recalculera plus tard si besoin)
            # -----------------------
            from core.backend.combat_engine import compute_distance_between_actors

            distance = compute_distance_between_actors(
                source_ad,
                target_ad
            )

            visibility = self._compute_visibility_state(
                source_ad,
                target_ad,
                distance
            )

            action = CombatAction(
                action_type="ATTACK",
                source=source_ad,
                target=target_ad,
                weapon=weapon,
                visibility=visibility,
                attacker_invisible=False,
                is_counter=False,
            )

            # -----------------------
            # Riposte : armes de la cible
            # -----------------------
            target_weapons = self._get_weapons_for_target(target_ad)

            events = resolve_combat_action(
                action,
                distance_tiles=distance,
                target_weapons=target_weapons,
            )

            try:
                set_equipment_block(source_ship, self.EQUIPMENT_COMBAT_LOCK_SECONDS)
                if target_ship is not None:
                    set_equipment_block(target_ship, self.EQUIPMENT_COMBAT_LOCK_SECONDS)
            except Exception:
                logger.exception("combat equipment lock update failed")

            # Enrichit les events de combat (noms + dÃ©gÃ¢ts appliquÃ©s) pour simplifier
            # le rendu front (modal combat / logs) sans recalcul local.
            self._annotate_combat_events(events, source_ad=source_ad, target_ad=target_ad)

            # PrÃ©pare les futures mÃ©caniques (assist / XP / rÃ©putation) en mÃ©morisant
            # qui a contribuÃ© sur cette cible avant mÃªme qu'elle ne meure.
            self._record_combat_participation(events)
            self._emit_combat_action_logs(
                initiator_ad=source_ad,
                initial_target_ad=target_ad,
                events=events,
            )

            # -----------------------
            # Toujours envoyer AP attaquant
            # -----------------------

            attacker_key = self.get_entity_key_from_adapter(source_ad)

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "entity_state_update",
                    "entity_key": attacker_key,
                    "change_type": "ap_update",
                    "changes": {
                        "ap": {
                            "current": source_ad.get_ap(),
                            "max": source_ad.get_max_ap(),
                        }
                    }
                }
            )

            # -----------------------
            # Envoyer HP pour chaque HIT
            # -----------------------

            for ev in events:
                if ev.type != "ATTACK_HIT":
                    continue

                is_counter = ev.payload.get("is_counter", False)

                damaged_ad = source_ad if is_counter else target_ad
                entity_key = self.get_entity_key_from_adapter(damaged_ad)
                
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "entity_state_update",
                        "entity_key": entity_key,
                        "change_type": "hp_update",
                        "changes": {
                            "hp": {
                                "current": ev.payload["hull_remaining"],
                            },
                            "shields": ev.payload["shields"],
                        }
                    }
                )

            # -----------------------
            # Hook mort minimal (Sprint 3)
            # -----------------------
            # On accumule d'abord les morts dÃ©tectÃ©es puis on broadcast aprÃ¨s la boucle,
            # pour Ã©viter de mÃ©langer la dÃ©tection de kills avec l'itÃ©ration sur les hits.
            death_payloads = []
            seen_dead_keys = set()
            for ev in events:
                if ev.type != "ATTACK_HIT":
                    continue

                hull_remaining = int(ev.payload.get("hull_remaining", 0) or 0)
                if hull_remaining > 0:
                    continue

                is_counter = ev.payload.get("is_counter", False)
                dead_ad = source_ad if is_counter else target_ad
                killer_ad = target_ad if is_counter else source_ad

                dead_key = self.get_entity_key_from_adapter(dead_ad)
                killer_key = self.get_entity_key_from_adapter(killer_ad)
                if dead_key in seen_dead_keys:
                    continue
                seen_dead_keys.add(dead_key)

                # "Pop" = on fige les participants pour ce kill, puis on retire le tracker cache
                # afin d'Ã©viter qu'un second event (ou double traitement) rÃ©utilise ces contributions.
                tracker = self._pop_combat_participation_tracker(dead_key, final_blow_key=killer_key)
                participants = list((tracker or {}).get("participants", {}).keys())

                self._set_actor_dead_status(dead_ad)
                self._emit_sector_combat_death_log(
                    dead_ad=dead_ad,
                    killer_ad=killer_ad,
                    participants=participants,
                    dead_key=dead_key,
                    killer_key=killer_key,
                )
                wreck_payload = self._create_wreck_for_dead_actor(
                    dead_ad=dead_ad,
                    killer_ad=killer_ad,
                    dead_key=dead_key,
                )

                death_payloads.append({
                    "dead_key": dead_key,
                    "killer_key": killer_key,
                    "sector_id": int(self.room) if str(self.room).isdigit() else self.room,
                    "is_npc": (dead_ad.kind == "NPC"),
                    "timestamp": timezone.now().isoformat(),
                    "participants": participants,
                    "wreck_key": (wreck_payload or {}).get("wreck_key"),
                })

                if wreck_payload:
                    self._update_room_cache_on_wreck_created(dead_key, wreck_payload)
                    async_to_sync(self.channel_layer.group_send)(
                        self.room_group_name,
                        {
                            "type": "wreck_created",
                            "payload": wreck_payload,
                        }
                    )

            for death_payload in death_payloads:
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "combat_death",
                        "payload": death_payload,
                    }
                )

            # -----------------------
            # Si riposte tentÃ©e â†’ envoyer AP cible
            # -----------------------

            counter_attempt = any(
                ev.payload.get("is_counter", False)
                for ev in events
            )

            if counter_attempt and target_ad.kind == "PC":

                target_key = self.get_entity_key_from_adapter(target_ad)

                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "entity_state_update",
                        "entity_key": target_key,
                        "change_type": "ap_update",
                        "changes": {
                            "ap": {
                                "current": target_ad.get_ap(),
                                "max": target_ad.get_max_ap(),
                            }
                        }
                    }
                )

            # -----------------------
            # 4ï¸âƒ£ Broadcast combat events
            # -----------------------

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "combat_events",
                    "events": [e.__dict__ for e in events]
                }
            )


        except Exception:
            logger.exception("action_attack failed")


    def _get_weapons_for_target(self, target_ad):

        weapons = []

        # PC
        if target_ad.kind == "PC":

            ship_id = PlayerShip.objects.filter(
                is_current_ship=True, 
                player_id=target_ad.actor.player_id
            ).values_list('id', flat=True)[0]

            if not ship_id:
                return []

            module_ids = PlayerShipModule.objects.filter(player_ship_id=ship_id).values("module_id") or []

            if not module_ids:
                return []

            psm_qs = Module.objects.filter(
                id__in=module_ids,
                type="WEAPONRY",
            )

            for psm in psm_qs:
                effect = get_module_effect_map(psm)
                weapons.append(
                    WeaponProfile(
                        damage_type=str(effect.get("damage_type", "TORPEDO")).upper(),
                        min_damage=int(get_effect_numeric(psm, "min_damage", default=1, strategy="min") or 1),
                        max_damage=int(get_effect_numeric(psm, "max_damage", default=1, strategy="max") or 1),
                        range_tiles=int(get_effect_numeric(psm, "range", default=1, strategy="max") or 1),
                    )
                )

        # NPC
        elif target_ad.kind == "NPC":
            npc = Npc.objects.get(id=target_ad.id)

            if not npc.npc_template:
                return []
            
            module_ids = npc.npc_template.module_id_list or []

            if not module_ids:
                return []

            psm_qs = Module.objects.filter(
                type="WEAPONRY",
                id__in=module_ids
            )

            for psm in psm_qs:
                effect = get_module_effect_map(psm)
                weapons.append(
                    WeaponProfile(
                        damage_type=str(effect.get("damage_type", "TORPEDO")).upper(),
                        min_damage=int(get_effect_numeric(psm, "min_damage", default=1, strategy="min") or 1),
                        max_damage=int(get_effect_numeric(psm, "max_damage", default=1, strategy="max") or 1),
                        range_tiles=int(get_effect_numeric(psm, "range", default=1, strategy="max") or 1),
                    )
                )

        return weapons

    def _compute_visibility_state(self, source_ad, target_ad, distance_tiles: int) -> str:
        """
        Determine visibility for combat precision malus.
        Priority: SCANNED > SONAR > UNKNOWN.
        """
        try:
            sector_id = int(self.room)
        except Exception:
            sector_id = None

        if target_ad.kind == "NPC":
            target_type = "npc"
            target_id = target_ad.actor.id
        else:
            target_type = "pc"
            target_id = target_ad.actor.player_id

        if source_ad.kind == "PC":
            scanner_id = source_ad.actor.player_id
            view_range = getattr(source_ad.actor, "view_range", None)
        else:
            scanner_id = source_ad.actor.id
            view_range = getattr(source_ad.actor, "view_range", None)

        if sector_id is not None:
            if ActionRules.has_active_scan(
                scanner_id=scanner_id,
                target_type=target_type,
                target_id=target_id,
                sector_id=sector_id,
            ):
                return "SCANNED"

        if view_range is not None:
            try:
                if distance_tiles <= int(view_range):
                    return "SONAR"
            except Exception:
                pass

        return "UNKNOWN"

    def _combat_participation_cache_key(self, target_key: str) -> str:
        return f"combat_participants:{self.room}:{target_key}"

    def _extract_actor_keys_from_combat_payload(self, payload: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
        if not isinstance(payload, dict):
            return None, None

        source_kind = payload.get("source_kind")
        target_kind = payload.get("target_kind")

        if source_kind == "NPC":
            source_key = f"npc_{payload.get('source_id')}"
        elif source_kind == "PC":
            source_key = f"pc_{payload.get('source_player_id')}"
        else:
            source_key = None

        if target_kind == "NPC":
            target_key = f"npc_{payload.get('target_id')}"
        elif target_kind == "PC":
            target_key = f"pc_{payload.get('target_player_id')}"
        else:
            target_key = None

        if source_key and source_key.endswith("_None"):
            source_key = None
        if target_key and target_key.endswith("_None"):
            target_key = None

        return source_key, target_key

    def _record_combat_participation(self, events) -> None:
        """
        Track contributors per target (cache, sector-scoped).
        Used later for assists / kill attribution / XP / reputation.
        """
        if not events:
            return

        now_iso = timezone.now().isoformat()

        for ev in events:
            if not ev or getattr(ev, "type", None) not in ("ATTACK_HIT", "ATTACK_MISS", "ATTACK_EVADED"):
                continue

            payload = getattr(ev, "payload", None) or {}
            source_key, target_key = self._extract_actor_keys_from_combat_payload(payload)
            if not source_key or not target_key:
                continue

            cache_key = self._combat_participation_cache_key(target_key)
            tracker = cache.get(cache_key) or {
                "target_key": target_key,
                "sector_id": int(self.room) if str(self.room).isdigit() else self.room,
                "participants": {},
                "first_hit_at": None,
                "last_hit_at": None,
                "last_attack_at": None,
                "damage_to_hull": 0,
                "damage_to_shield": 0,
            }

            participants = tracker.setdefault("participants", {})
            participant = participants.get(source_key) or {
                "damage_total": 0,
                "damage_to_hull": 0,
                "damage_to_shield": 0,
                "attack_count": 0,
                "last_contribution_at": None,
                "is_final_blow": False,
                "is_counter_only": True,
            }

            participant["attack_count"] += 1
            participant["last_contribution_at"] = now_iso

            if payload.get("is_counter") is not True:
                participant["is_counter_only"] = False

            if ev.type == "ATTACK_HIT":
                dmg_shield = int(payload.get("damage_to_shield", 0) or 0)
                dmg_hull = int(payload.get("damage_to_hull", 0) or 0)
                participant["damage_to_shield"] += dmg_shield
                participant["damage_to_hull"] += dmg_hull
                participant["damage_total"] += (dmg_shield + dmg_hull)

                tracker["damage_to_shield"] = int(tracker.get("damage_to_shield", 0) or 0) + dmg_shield
                tracker["damage_to_hull"] = int(tracker.get("damage_to_hull", 0) or 0) + dmg_hull

                if tracker.get("first_hit_at") is None:
                    tracker["first_hit_at"] = now_iso
                tracker["last_hit_at"] = now_iso

            participants[source_key] = participant
            tracker["participants"] = participants
            tracker["last_attack_at"] = now_iso

            # TTL volontairement large: reset explicite viendra avec mort/warp hooks Sprint 3
            cache.set(cache_key, tracker, timeout=3600)

    def _annotate_combat_events(self, events, *, source_ad, target_ad) -> None:
        """
        Ajoute des champs de confort pour le front (noms, dÃ©gÃ¢ts appliquÃ©s).
        Le backend garde l'autoritÃ©; on Ã©vite juste de faire deviner le texte au client.
        """
        if not events:
            return

        initiator_name = self._get_actor_display_name(source_ad)
        initial_target_name = self._get_actor_display_name(target_ad)
        initiator_key = self.get_entity_key_from_adapter(source_ad)
        initial_target_key = self.get_entity_key_from_adapter(target_ad)

        for ev in events:
            if not ev or getattr(ev, "type", None) not in ("ATTACK_HIT", "ATTACK_MISS", "ATTACK_EVADED"):
                continue

            payload = getattr(ev, "payload", None) or {}
            is_counter = payload.get("is_counter") is True

            source_name = initial_target_name if is_counter else initiator_name
            target_name = initiator_name if is_counter else initial_target_name

            payload["source_name"] = source_name
            payload["target_name"] = target_name
            payload["initiator_name"] = initiator_name
            payload["initial_target_name"] = initial_target_name
            payload["initiator_key"] = initiator_key
            payload["initial_target_key"] = initial_target_key

            if ev.type == "ATTACK_HIT":
                dmg_shield = int(payload.get("damage_to_shield", 0) or 0)
                dmg_hull = int(payload.get("damage_to_hull", 0) or 0)
                payload["damage_total_applied"] = dmg_shield + dmg_hull

            ev.payload = payload

    def _build_sector_combat_players_roles(self, *, initiator_ad, initial_target_ad):
        """
        RÃ´les de logs de combat:
        - TRANSMITTER = initiateur (s'il est PC)
        - RECEIVER = cible initiale (si elle est PC)
        - OBSERVER = tous les autres joueurs prÃ©sents dans le secteur
        """
        try:
            sector_id = int(self.room)
        except Exception:
            return []

        sector_players = list(Player.objects.filter(sector_id=sector_id))
        if not sector_players:
            return []

        initiator_player_id = initiator_ad.actor.player_id if getattr(initiator_ad, "kind", None) == "PC" else None
        target_player_id = initial_target_ad.actor.player_id if getattr(initial_target_ad, "kind", None) == "PC" else None

        players_roles = []
        for p in sector_players:
            role = "OBSERVER"
            if initiator_player_id is not None and p.id == initiator_player_id:
                role = "TRANSMITTER"
            if target_player_id is not None and p.id == target_player_id:
                role = "RECEIVER"
            players_roles.append((p, role))
        return players_roles

    def _emit_combat_action_logs(self, *, initiator_ad, initial_target_ad, events) -> None:
        """
        Log temps rÃ©el dÃ©taillÃ© pour chaque ATTACK_* (attaque + riposte), avec rÃ´les:
        initiateur / cible initiale / observateurs secteur.
        """
        if not events:
            return

        players_roles = self._build_sector_combat_players_roles(
            initiator_ad=initiator_ad,
            initial_target_ad=initial_target_ad,
        )
        if not players_roles:
            return

        initiator_name = self._get_actor_display_name(initiator_ad)
        initial_target_name = self._get_actor_display_name(initial_target_ad)

        for ev in events:
            if not ev or getattr(ev, "type", None) not in ("ATTACK_HIT", "ATTACK_MISS", "ATTACK_EVADED"):
                continue

            p = getattr(ev, "payload", None) or {}
            is_counter = p.get("is_counter") is True
            source_name = p.get("source_name") or (initial_target_name if is_counter else initiator_name)
            target_name = p.get("target_name") or (initiator_name if is_counter else initial_target_name)

            payload = {
                "event": "COMBAT_ACTION",
                "combat_event_type": ev.type,
                "is_counter": is_counter,
                "is_critical": bool(p.get("is_critical", False)),
                "damage_type": (p.get("damage_type") or "").upper(),
                "damage_total": int(p.get("damage_total_applied", p.get("final_damage", 0)) or 0),
                "damage_to_hull": int(p.get("damage_to_hull", 0) or 0),
                "damage_to_shield": int(p.get("damage_to_shield", 0) or 0),
                "initiator_name": initiator_name,
                "initial_target_name": initial_target_name,
                "source_name": source_name,
                "target_name": target_name,
            }

            log = create_event_log(
                players_roles=players_roles,
                log_type="COMBAT_ACTION",
                payload=payload,
            )
            self.push_event_log(log.playerlog_set.select_related("player", "log").all())

    def _resolve_actor_key_from_message(self, msg: Any) -> Optional[str]:
        if not isinstance(msg, dict):
            return None
        if msg.get("actor_key"):
            return str(msg.get("actor_key"))
        if msg.get("target_key"):
            return str(msg.get("target_key"))
        if msg.get("player_id") is not None:
            return f"pc_{msg.get('player_id')}"
        if msg.get("player") is not None:
            return f"pc_{msg.get('player')}"
        if msg.get("npc_id") is not None:
            return f"npc_{msg.get('npc_id')}"
        return None

    def _purge_combat_participation_from_message(self, msg: Any) -> None:
        actor_key = self._resolve_actor_key_from_message(msg)
        if actor_key:
            cache.delete(self._combat_participation_cache_key(actor_key))

    def _pop_combat_participation_tracker(self, target_key: str, final_blow_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not target_key:
            return None
        cache_key = self._combat_participation_cache_key(target_key)
        tracker = cache.get(cache_key)
        if isinstance(tracker, dict) and final_blow_key:
            participant = (tracker.get("participants") or {}).get(final_blow_key)
            if isinstance(participant, dict):
                participant["is_final_blow"] = True
        cache.delete(cache_key)
        return tracker

    def _get_actor_display_name(self, adapter) -> str:
        try:
            if adapter.kind == "PC":
                return adapter.actor.player.name
            return adapter.actor.npc_template.displayed_name or adapter.actor.npc_template.name
        except Exception:
            return self.get_entity_key_from_adapter(adapter)

    def _set_actor_dead_status(self, adapter) -> None:
        try:
            if adapter.kind == "PC":
                adapter.actor.player.status = "DEAD"
                adapter.actor.player.save(update_fields=["status"])
                adapter.actor.is_current_ship = False
                adapter.actor.save(update_fields=["is_current_ship"])
                adapter.actor.status = "DEAD"
                adapter.actor.save(update_fields=["status"])
            elif adapter.kind == "NPC":
                adapter.actor.status = "DEAD"
                # Respawn delay is computed from npc.updated_at.
                # With update_fields, auto_now is not persisted unless the field is included.
                adapter.actor.updated_at = timezone.now()
                adapter.actor.save(update_fields=["status", "updated_at"])
        except Exception as e:
            logger.warning(f"Could not set DEAD status on {self.get_entity_key_from_adapter(adapter)}: {e}")

    def _emit_sector_combat_death_log(
        self,
        *,
        dead_ad,
        killer_ad,
        participants: list[str],
        dead_key: str,
        killer_key: str,
    ) -> None:
        """
        Sector-wide player log for a combat death.
        Roles:
        - killer PC => TRANSMITTER
        - dead PC => RECEIVER
        - all other players in sector => OBSERVER
        """
        try:
            sector_id = int(self.room)
        except Exception:
            return

        sector_players = list(Player.objects.filter(sector_id=sector_id))
        if not sector_players:
            return

        dead_player_id = dead_ad.actor.player_id if getattr(dead_ad, "kind", None) == "PC" else None
        killer_player_id = killer_ad.actor.player_id if getattr(killer_ad, "kind", None) == "PC" else None

        players_roles = []
        for p in sector_players:
            role = "OBSERVER"
            if killer_player_id is not None and p.id == killer_player_id:
                role = "TRANSMITTER"
            if dead_player_id is not None and p.id == dead_player_id:
                role = "RECEIVER"
            players_roles.append((p, role))

        payload = {
            "event": "COMBAT_DEATH",
            "dead": self._get_actor_display_name(dead_ad),
            "killer": self._get_actor_display_name(killer_ad),
            "dead_key": dead_key,
            "killer_key": killer_key,
            "participants": participants or [],
        }

        log = create_event_log(
            players_roles=players_roles,
            log_type="COMBAT_DEATH",
            payload=payload,
        )
        self.push_event_log(log.playerlog_set.select_related("player", "log").all())

    def _create_wreck_for_dead_actor(self, *, dead_ad, killer_ad, dead_key: str) -> Optional[Dict[str, Any]]:
        try:
            now = timezone.now()
            expires_at = now + datetime.timedelta(seconds=self.WRECK_TTL_SECONDS)

            if dead_ad.kind == "PC":
                player_ship = dead_ad.actor
                player_obj = player_ship.player
                ship_obj = player_ship.ship
                sector = player_obj.sector
                coords = player_obj.coordinates or {"x": 0, "y": 0}
                size = getattr(getattr(ship_obj, "ship_category", None), "size", None) or {"x": 1, "y": 1}
                origin_type = "PC"
                origin_player = player_obj
                origin_npc = None
            else:
                npc_obj = dead_ad.actor
                ship_obj = npc_obj.npc_template.ship if npc_obj.npc_template else None
                sector = npc_obj.sector
                coords = npc_obj.coordinates or {"x": 0, "y": 0}
                size = getattr(getattr(ship_obj, "ship_category", None), "size", None) or {"x": 1, "y": 1}
                origin_type = "NPC"
                origin_player = None
                origin_npc = npc_obj

            killer_player = killer_ad.actor.player if getattr(killer_ad, "kind", None) == "PC" else None

            wreck = ShipWreck.objects.create(
                origin_type=origin_type,
                origin_player=origin_player,
                origin_npc=origin_npc,
                killer_player=killer_player,
                sector=sector,
                ship=ship_obj,
                coordinates=coords,
                status="ACTIVE",
                expires_at=expires_at,
                metadata={
                    "source_actor_key": dead_key,
                    # RÃ©fÃ©rence stable pour purger le vieux PlayerShip quand la carcasse expire.
                    "source_player_ship_id": player_ship.id if dead_ad.kind == "PC" else None,
                    "source_npc_id": npc_obj.id if dead_ad.kind == "NPC" else None,
                },
            )

            try:
                metadata = self._ensure_wreck_loot_snapshot(wreck, metadata=self._wreck_metadata_dict(wreck))
                wreck.metadata = metadata
                wreck.save(update_fields=["metadata", "updated_at"])
            except Exception:
                logger.exception("wreck loot snapshot init failed")

            return {
                "wreck_id": wreck.id,
                "wreck_key": f"wreck_{wreck.id}",
                "dead_key": dead_key,
                "origin_type": origin_type,
                "coordinates": {
                    "x": int((coords or {}).get("x", 0) or 0),
                    "y": int((coords or {}).get("y", 0) or 0),
                },
                "size": {
                    "x": int((size or {}).get("x", 1) or 1),
                    "y": int((size or {}).get("y", 1) or 1),
                },
                "ship": {
                    "id": getattr(ship_obj, "id", None),
                    "name": getattr(ship_obj, "name", None),
                    "image": getattr(ship_obj, "image", None),
                },
                "expires_at": expires_at.isoformat(),
            }
        except Exception as e:
            logger.exception(f"Failed to create wreck for {dead_key}: {e}")
            return None
    
    def get_entity_key_from_adapter(self, adapter):
        if adapter.kind == "PC":
            return f"pc_{adapter.actor.player_id}"
        elif adapter.kind == "NPC":
            return f"npc_{adapter.actor.id}"
        else:
            raise ValueError(f"Unknown actor kind: {adapter.kind}")
    
    
    def combat_events(self, event):
        self._send_response({
            "type": "combat_events",
            "message": {
                "events": event.get("events", [])
            }
        })

    def combat_death(self, event):
        self._send_response({
            "type": "combat_death",
            "payload": event.get("payload", {}),
        })

    def wreck_created(self, event):
        self._send_response({
            "type": "wreck_created",
            "payload": event.get("payload", {}),
        })

    def wreck_expired(self, event):
        self._send_response({
            "type": "wreck_expired",
            "payload": event.get("payload", {}),
        })

    def npc_added(self, event):
        self._send_response({
            "type": "npc_added",
            "payload": event.get("payload", {}),
        })

    def _handle_respawn_action(self, payload):
        """
        Respawn PC minimal (Sprint 3)
        - bind non implÃ©mentÃ© -> fallback sector_id = DEFAULT_RESPAWN_SECTOR_ID
        - vaisseau gratuit = Ship.id = 1
        - placement via mÃªme algo que le warp (cases libres + tailles)
        - async_warp_complete rÃ©utilisÃ© cÃ´tÃ© front pour reload/reconnect
        """
        _ = payload

        if not self.player_id:
            self._send_response({"type": "action_failed", "reason": "PLAYER_NOT_FOUND"})
            return

        player = Player.objects.select_related("archetype", "sector").filter(id=self.player_id).first()
        if not player:
            self._send_response({"type": "action_failed", "reason": "PLAYER_NOT_FOUND"})
            return

        if player.status != "DEAD":
            self._send_response({"type": "action_failed", "reason": "PLAYER_NOT_DEAD"})
            return

        free_ship = Ship.objects.select_related("ship_category").filter(id=1).first()
        if not free_ship:
            self._send_response({"type": "action_failed", "reason": "RESPAWN_SHIP_NOT_FOUND"})
            return

        respawn_sector_id = int(self.DEFAULT_RESPAWN_SECTOR_ID)
        old_sector_id = player.sector_id

        ship_size = getattr(getattr(free_ship, "ship_category", None), "size", None) or {"x": 1, "y": 1}
        if not isinstance(ship_size, dict):
            ship_size = {"x": 1, "y": 1}
        ship_size_x = int(ship_size.get("x", 1) or 1)
        ship_size_y = int(ship_size.get("y", 1) or 1)

        pa = PlayerAction(self.user.id)
        padding_w = ship_size_x + getattr(pa, "MIN_PADDING", 3)
        padding_h = ship_size_y + getattr(pa, "MIN_PADDING", 3)
        respawn_coord = pa._calculate_destination_coord(
            respawn_sector_id,
            ship_size_x,
            ship_size_y,
            padding_h,
            padding_w,
        ) or {"x": 0, "y": 0}

        current_hp = int(free_ship.default_hp or 0)
        current_movement = int(free_ship.default_movement or 0)
        current_ballistic_defense = int(free_ship.default_ballistic_defense or 0)
        current_laser_defense = int(free_ship.default_laser_defense or 0)
        current_torpedo_defense = int(free_ship.default_torpedo_defense or 0)
        current_cargo_size = 2

        archetype_modules = []
        try:
            if player.archetype_id:
                archetype_modules = list(
                    ArchetypeModule.objects.select_related("module").filter(archetype_id=player.archetype_id)
                )
        except Exception:
            logger.exception("respawn: failed to load archetype modules")
            archetype_modules = []

        # Pour que le joueur rÃ©apparaisse aussi dans le cache secteur actuel (qui se base encore sur PlayerShipModule),
        # on rÃ©attache les modules d'archÃ©type au vaisseau gratuit (solution transitoire cohÃ©rente avec le systÃ¨me actuel).
        # CompatibilitÃ© transitoire avec le cache de secteur actuel:
        # un PC sans PlayerShipModule risque de "disparaÃ®tre" du cache/reload.
        for am in archetype_modules:
            mod = am.module
            if not mod:
                continue
            mtype = str(mod.type or "")
            if "DEFENSE" in mtype:
                defense_bonus = int(get_effect_numeric(mod, "defense", default=0, strategy="sum") or 0)
                if "BALLISTIC" in mtype:
                    current_ballistic_defense += defense_bonus
                elif "LASER" in mtype:
                    current_laser_defense += defense_bonus
                elif "TORPEDO" in mtype:
                    current_torpedo_defense += defense_bonus
            elif "MOVEMENT" in mtype:
                current_movement += int(get_effect_numeric(mod, "movement", default=0, strategy="sum") or 0)
            elif "HULL" in mtype:
                current_hp += int(get_effect_numeric(mod, "hp", default=0, strategy="sum") or 0)
            elif "HOLD" in mtype:
                current_cargo_size += int(get_effect_numeric(mod, "capacity", default=0, strategy="sum") or 0)

        try:
            with transaction.atomic():
                PlayerShip.objects.filter(player_id=player.id, is_current_ship=True).update(is_current_ship=False)

                new_ship = PlayerShip.objects.create(
                    player=player,
                    ship=free_ship,
                    is_current_ship=True,
                    is_reversed=False,
                    status="FULL",
                    current_hp=current_hp,
                    max_hp=current_hp,
                    current_movement=current_movement,
                    max_movement=current_movement,
                    current_ballistic_defense=current_ballistic_defense,
                    max_ballistic_defense=current_ballistic_defense,
                    current_laser_defense=current_laser_defense,
                    max_laser_defense=current_laser_defense,
                    current_torpedo_defense=current_torpedo_defense,
                    max_torpedo_defense=current_torpedo_defense,
                    current_cargo_size=current_cargo_size,
                )

                for am in archetype_modules:
                    if am.module_id:
                        PlayerShipModule.objects.create(player_ship=new_ship, module_id=am.module_id)

                # AP volontairement inchangÃ© (rÃ¨gle validÃ©e)
                Player.objects.filter(id=player.id).update(
                    status="ALIVE",
                    sector_id=respawn_sector_id,
                    coordinates=respawn_coord,
                )
        except Exception:
            logger.exception("respawn action failed")
            self._send_response({"type": "action_failed", "reason": "RESPAWN_FAILED"})
            return

        new_room_key = f"play_{respawn_sector_id}"
        new_sector_data = {}
        try:
            dest_cache = StoreInCache(new_room_key, self.user)
            dest_cache.get_or_set_cache(need_to_be_recreated=True)
            dest_cache.update_player_range_finding()
            dest_cache.update_sector_player_visibility_zone(self.player_id)
            new_sector_data = dest_cache.get_or_set_cache(need_to_be_recreated=False) or {}
        except Exception:
            logger.exception("respawn cache rebuild failed")

        # Tous les joueurs du secteur d'arrivÃ©e doivent voir apparaÃ®tre le joueur.
        try:
            async_to_sync(self.channel_layer.group_send)(
                new_room_key,
                {
                    "type": "async_user_join",
                    "message": (new_sector_data.get("pc", []) if isinstance(new_sector_data, dict) else []),
                },
            )
        except Exception:
            logger.exception("respawn broadcast failed")

        # Recycle le flux warp_complete cÃ´tÃ© front pour recharger proprement la page.
        self._send_response({
            "type": "async_warp_complete",
            "message": {
                "new_sector_id": respawn_sector_id,
                "new_room_key": new_room_key,
                "new_sector_data": new_sector_data,
                "player_id": self.player_id,
                "respawn": True,
                "old_sector_id": old_sector_id,
            }
        })
        self._emit_group_state_sync_for_player_group(
            int(self.player_id),
            reason="GROUP_MEMBER_RESPAWNED",
        )

    # Sprint 1 override block: split receive dispatch + WS envelope normalization.
    def receive(self, text_data=None, bytes_data=None):
        self._invalidate_expired_scans_safe()
        self._invalidate_expired_wrecks_safe()
        self._cleanup_stale_wreck_loot_locks_safe()
        self._process_due_wreck_loot_actions_safe()
        self._respawn_dead_npcs_safe()
        self._process_due_module_reconfigurations_safe()

        if not self._is_valid_request(text_data):
            return

        data = self._parse_client_json_message(text_data)
        if not data:
            return

        self._refresh_session()

        if self._dispatch_client_message(data):
            return

        try:
            message_data = self._extract_message_data(data)
            self._broadcast_message(message_data)
        except Exception as e:
            logger.error(f"Erreur traitement message generique: {e}")

    def _is_valid_request(self, text_data: Optional[str]) -> bool:
        return text_data is not None and self.user.is_authenticated

    def _invalidate_expired_scans_safe(self) -> None:
        try:
            expired_targets = ActionRules.invalidate_expired_scans(int(self.room))
            if not expired_targets:
                return

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "effects_invalidated",
                    "payload": [
                        {
                            "effect": "scan",
                            "target_type": t["target_type"],
                            "target_id": t["target_id"],
                        }
                        for t in expired_targets
                    ],
                }
            )
        except Exception as e:
            logger.error(f"Scan invalidation failed: {e}")

    def _invalidate_expired_wrecks_safe(self) -> None:
        # Expiration lazy cÃ´tÃ© backend (pas de scheduler dÃ©diÃ© pour l'instant).
        # Le front gÃ¨re la disparition visuelle exacte via timer local.
        try:
            sector_id = int(self.room)
        except Exception:
            return

        try:
            now = timezone.now()
            due_rows = list(
                ShipWreck.objects.filter(
                    sector_id=sector_id,
                    status="ACTIVE",
                    expires_at__isnull=False,
                    expires_at__lte=now,
                ).values("id")
            )
            for row in due_rows:
                wreck_id = int(row.get("id"))
                payload = self._expire_wreck_and_purge_source_ship(wreck_id, sector_id)
                if not payload:
                    continue

                self._update_room_cache_on_wreck_expired(wreck_id)
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "wreck_expired",
                        "payload": payload,
                    }
                )

            stale_expired_ids = list(
                ShipWreck.objects.filter(
                    sector_id=sector_id,
                    status="EXPIRED",
                ).values_list("id", flat=True)
            )
            for wreck_id in stale_expired_ids:
                payload = self._expire_wreck_and_purge_source_ship(int(wreck_id), sector_id)
                if not payload:
                    continue

                self._update_room_cache_on_wreck_expired(wreck_id)
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "wreck_expired",
                        "payload": payload,
                    }
                )
        except Exception as e:
            logger.error(f"Wreck invalidation failed: {e}")

    def _respawn_dead_npcs_safe(self) -> None:
        """
        Respawn NPC minimal (lazy, scope secteur courant).
        Le front consomme dÃ©jÃ  `npc_added`.
        """
        if not getattr(self, "user", None) or not getattr(self.user, "is_authenticated", False):
            return
        try:
            sector_id = int(self.room)
        except Exception:
            return

        try:
            now = timezone.now()
            dead_npcs = list(
                Npc.objects.filter(
                    sector_id=sector_id,
                    status="DEAD",
                )
                .select_related("npc_template")
                .only("id", "updated_at", "npc_template__respawn_delay_seconds")
            )
            due_ids = []
            for npc in dead_npcs:
                template_delay = getattr(getattr(npc, "npc_template", None), "respawn_delay_seconds", None)
                try:
                    respawn_delay = int(template_delay if template_delay is not None else self.NPC_RESPAWN_DELAY_SECONDS)
                except Exception:
                    respawn_delay = int(self.NPC_RESPAWN_DELAY_SECONDS)
                if npc.updated_at and npc.updated_at <= (now - datetime.timedelta(seconds=max(respawn_delay, 0))):
                    due_ids.append(int(npc.id))
            if not due_ids:
                return

            for npc_id in due_ids:
                payload = self._respawn_npc_and_build_payload(int(npc_id), sector_id)
                if not payload:
                    continue
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        "type": "npc_added",
                        "payload": payload,
                    }
                )
        except Exception:
            logger.exception("NPC respawn sweep failed")

    def _respawn_npc_and_build_payload(self, npc_id: int, sector_id: int) -> Optional[Dict[str, Any]]:
        try:
            with transaction.atomic():
                npc = (
                    Npc.objects.select_for_update()
                    .select_related("npc_template", "npc_template__ship", "npc_template__ship__ship_category")
                    .filter(id=npc_id, sector_id=sector_id, status="DEAD")
                    .first()
                )
                if not npc or not npc.npc_template or not npc.npc_template.ship:
                    return None

                tpl = npc.npc_template
                ship = tpl.ship

                ship_size = getattr(getattr(ship, "ship_category", None), "size", None) or {"x": 1, "y": 1}
                if not isinstance(ship_size, dict):
                    ship_size = {"x": 1, "y": 1}
                ship_size_x = int(ship_size.get("x", 1) or 1)
                ship_size_y = int(ship_size.get("y", 1) or 1)

                respawn_coord = self._choose_npc_respawn_coord(
                    npc=npc,
                    sector_id=sector_id,
                    ship_size_x=ship_size_x,
                    ship_size_y=ship_size_y,
                ) or (npc.spawn_coordinates or npc.coordinates or {"x": 0, "y": 0})

                npc.current_ap = int(npc.max_ap or 0)
                npc.hp = int(tpl.max_hp or 0)
                npc.movement = int(tpl.max_movement or 0)
                npc.torpedo_defense = int(tpl.max_torpedo_defense or 0)
                npc.laser_defense = int(tpl.max_laser_defense or 0)
                npc.ballistic_defense = int(tpl.max_ballistic_defense or 0)
                npc.coordinates = respawn_coord
                npc.status = "FULL"
                npc.save()

                NpcResource.objects.filter(npc_id=npc.id).delete()
                for tr in NpcTemplateResource.objects.filter(npc_template_id=tpl.id).values("resource_id", "quantity"):
                    resource_id = tr.get("resource_id")
                    if resource_id is None:
                        continue
                    NpcResource.objects.create(
                        npc_id=npc.id,
                        resource_id=resource_id,
                        quantity=int(tr.get("quantity", 0) or 0),
                    )

            room_key = f"play_{sector_id}"
            npc_entry = None
            try:
                room_cache = StoreInCache(room_key, self.user)
                room_cache.get_or_set_cache(need_to_be_recreated=True)
                cached = room_cache.get_or_set_cache(need_to_be_recreated=False) or {}
                npc_entry = next(
                    (
                        n for n in (cached.get("npc", []) or [])
                        if str((n.get("npc", {}) or {}).get("id")) == str(npc_id)
                    ),
                    None
                )
            except Exception:
                logger.exception("npc respawn cache rebuild failed")

            if not npc_entry:
                return None
            return {"npc": npc_entry}
        except Exception:
            logger.exception(f"NPC respawn failed for npc_id={npc_id}")
            return None

    def _choose_npc_respawn_coord(
        self,
        *,
        npc,
        sector_id: int,
        ship_size_x: int,
        ship_size_y: int,
    ) -> Optional[Dict[str, int]]:
        """
        Respawn NPC:
        1) tente `spawn_coordinates` (point de spawn fixe)
        2) sinon cherche la case libre la plus proche
        3) fallback sur l'algo gÃ©nÃ©rique actuel (zone warp + padding)
        """
        try:
            pa = PlayerAction(self.user.id)
            padding_w = int(ship_size_x) + int(getattr(pa, "MIN_PADDING", 3) or 3)
            padding_h = int(ship_size_y) + int(getattr(pa, "MIN_PADDING", 3) or 3)

            preferred = npc.spawn_coordinates or None
            if isinstance(preferred, dict) and preferred.get("x") is not None and preferred.get("y") is not None:
                preferred = {
                    "x": int(preferred.get("x", 0) or 0),
                    "y": int(preferred.get("y", 0) or 0),
                }
            else:
                preferred = None

            if preferred:
                sector_data = GetDataFromDB.get_items_from_sector(sector_id, with_npc=True)
                if sector_data and len(sector_data) >= 6:
                    planets, asteroids, stations, warpzones, npcs, pcs = sector_data

                    # On retire le NPC en cours de respawn des cases occupÃ©es pour ne pas se bloquer lui-mÃªme.
                    npcs = [
                        n for n in (npcs or [])
                        if str(n.get("id")) != str(getattr(npc, "id", ""))
                    ]

                    occupied_coords = pa._get_all_occupied_coordinates({
                        "planet": planets or [],
                        "asteroid": asteroids or [],
                        "station": stations or [],
                        "warpzone": warpzones or [],
                        "npc": npcs or [],
                        "pc": pcs or [],
                    })
                    occupied_coords = self._append_active_wreck_occupied_coords(
                        occupied_coords=occupied_coords,
                        sector_id=sector_id,
                    )

                    if pa._can_place_ship_at_position(preferred, occupied_coords, ship_size_x, ship_size_y):
                        return preferred

                    nearest = self._find_nearest_free_respawn_cell(
                        pa=pa,
                        preferred=preferred,
                        occupied_coords=occupied_coords,
                        ship_size_x=ship_size_x,
                        ship_size_y=ship_size_y,
                    )
                    if nearest:
                        return nearest

            # Fallback (comportement actuel): placement gÃ©nÃ©rique basÃ© sur warpzone.
            generic = pa._calculate_destination_coord(
                sector_id,
                ship_size_x,
                ship_size_y,
                padding_h,
                padding_w,
            )
            if not generic:
                return None

            # Le fallback historique ne connaÃ®t pas les carcasses. On vÃ©rifie donc
            # explicitement que la case proposÃ©e n'est pas occupÃ©e par un wreck actif.
            wreck_occupied = self._append_active_wreck_occupied_coords(
                occupied_coords=[],
                sector_id=sector_id,
            )
            if pa._can_place_ship_at_position(generic, wreck_occupied, ship_size_x, ship_size_y):
                return generic

            nearest_from_generic = self._find_nearest_free_respawn_cell(
                pa=pa,
                preferred={"x": int(generic.get("x", 0) or 0), "y": int(generic.get("y", 0) or 0)},
                occupied_coords=wreck_occupied,
                ship_size_x=ship_size_x,
                ship_size_y=ship_size_y,
            )
            return nearest_from_generic or generic
        except Exception:
            logger.exception(f"NPC respawn coord resolve failed for npc_id={getattr(npc, 'id', None)}")
            return None

    def _append_active_wreck_occupied_coords(self, *, occupied_coords, sector_id: int):
        """
        Ajoute les cases occupÃ©es par les carcasses actives Ã  une liste de coordonnÃ©es occupÃ©es.
        EmpÃªche notamment un NPC de respawn directement dans sa propre Ã©pave.
        """
        try:
            coords = list(occupied_coords or [])
            wrecks = (
                ShipWreck.objects
                .filter(sector_id=sector_id, status="ACTIVE")
                .select_related("ship__ship_category")
                .only("coordinates", "metadata", "ship__ship_category__size")
            )
            for w in wrecks:
                wc = w.coordinates if hasattr(w, "coordinates") else {}
                ws = None
                try:
                    ship_size = getattr(getattr(getattr(w, "ship", None), "ship_category", None), "size", None)
                    if isinstance(ship_size, dict):
                        ws = ship_size
                    elif isinstance(getattr(w, "metadata", None), dict):
                        ws = w.metadata.get("size")
                except Exception:
                    ws = None
                if not isinstance(ws, dict):
                    ws = {"x": 1, "y": 1}
                try:
                    x0 = int((wc or {}).get("x", 0) or 0)
                    y0 = int((wc or {}).get("y", 0) or 0)
                    sx = max(1, int((ws or {}).get("x", 1) or 1))
                    sy = max(1, int((ws or {}).get("y", 1) or 1))
                except Exception:
                    continue

                for yy in range(y0, y0 + sy):
                    for xx in range(x0, x0 + sx):
                        coords.append({"y": yy, "x": xx})
            return coords
        except Exception:
            logger.exception("Failed to append wreck occupied coords for NPC respawn")
            return list(occupied_coords or [])

    def _find_nearest_free_respawn_cell(
        self,
        *,
        pa,
        preferred: Dict[str, int],
        occupied_coords,
        ship_size_x: int,
        ship_size_y: int,
    ) -> Optional[Dict[str, int]]:
        """
        Recherche simple "au plus proche" autour du spawn prÃ©fÃ©rÃ© (Manhattan puis ordre stable).
        """
        try:
            px = int(preferred.get("x", 0) or 0)
            py = int(preferred.get("y", 0) or 0)
            sector_size = int(getattr(pa, "SECTOR_SIZE", 40) or 40)

            candidates = []
            for y in range(0, sector_size):
                for x in range(0, sector_size):
                    candidates.append({
                        "x": x,
                        "y": y,
                        "d": abs(x - px) + abs(y - py),
                    })

            candidates.sort(key=lambda c: (c["d"], abs(c["y"] - py), abs(c["x"] - px), c["y"], c["x"]))

            for c in candidates:
                pos = {"x": c["x"], "y": c["y"]}
                if pa._can_place_ship_at_position(pos, occupied_coords, ship_size_x, ship_size_y):
                    return pos
            return None
        except Exception:
            logger.exception("NPC nearest respawn search failed")
            return None

    def _expire_wreck_and_purge_source_ship(self, wreck_id: int, sector_id: int) -> Optional[Dict[str, Any]]:
        """
        Expire une carcasse et purge son vaisseau source (PC) si disponible.
        La suppression de PlayerShip dÃ©clenche la cascade Django sur:
        - PlayerShipModule
        - PlayerShipResource
        """
        try:
            with transaction.atomic():
                # Verrouille la carcasse pour Ã©viter un double cleanup concurrent.
                wreck = (
                    ShipWreck.objects.select_for_update()
                    .select_related("origin_player")
                    .filter(id=wreck_id, status__in=["ACTIVE", "EXPIRED"])
                    .first()
                )
                if not wreck:
                    return None

                metadata = wreck.metadata if isinstance(wreck.metadata, dict) else {}
                source_player_ship_id = metadata.get("source_player_ship_id")
                source_actor_key = str(metadata.get("source_actor_key") or "")

                # Fallback compat pour les vieilles carcasses crÃ©Ã©es avant l'ajout du metadata id.
                # Fallback compat pour les vieilles carcasses (sans metadata.source_player_ship_id).
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

                # La carcasse n'est plus utile aprÃ¨s expiration: suppression DB.
                # Suppression backend rÃ©elle (la disparition visuelle front arrive via ws/local timer).
                wreck.delete()

                return {
                    "wreck_id": wreck_id,
                    "wreck_key": f"wreck_{wreck_id}",
                    "sector_id": sector_id,
                    "purged_source_ship_id": source_player_ship_id,
                }
        except Exception:
            logger.exception(f"Failed to expire/purge wreck {wreck_id}")
            return None

    # ------------------------------------------------------------------
    # Wreck loot (Fouille / Salvage) - server authoritative lock & timers
    # ------------------------------------------------------------------
    def _parse_iso_datetime_safe(self, value: Any) -> Optional[datetime.datetime]:
        if not value:
            return None
        try:
            raw = str(value).strip()
            if not raw:
                return None
            if raw.endswith("Z"):
                raw = raw[:-1] + "+00:00"
            parsed = datetime.datetime.fromisoformat(raw)
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            return parsed
        except Exception:
            return None

    def _now_iso(self) -> str:
        return timezone.now().isoformat()

    def _safe_size_dict(self, value: Any) -> Dict[str, int]:
        if not isinstance(value, dict):
            return {"x": 1, "y": 1}
        return {
            "x": int(value.get("x", 1) or 1),
            "y": int(value.get("y", 1) or 1),
        }

    def _compute_center_chebyshev_distance(
        self,
        from_coords: Dict[str, Any],
        from_size: Dict[str, Any],
        to_coords: Dict[str, Any],
        to_size: Dict[str, Any],
    ) -> int:
        a_size = self._safe_size_dict(from_size)
        b_size = self._safe_size_dict(to_size)
        ax = int((from_coords or {}).get("x", 0) or 0)
        ay = int((from_coords or {}).get("y", 0) or 0)
        bx = int((to_coords or {}).get("x", 0) or 0)
        by = int((to_coords or {}).get("y", 0) or 0)

        acx = ax + (a_size["x"] - 1) / 2
        acy = ay + (a_size["y"] - 1) / 2
        bcx = bx + (b_size["x"] - 1) / 2
        bcy = by + (b_size["y"] - 1) / 2
        return int(max(abs(acx - bcx), abs(acy - bcy)))

    def _compute_player_ship_to_wreck_distance(self, player_ship: PlayerShip, wreck: ShipWreck) -> int:
        player_coords = getattr(getattr(player_ship, "player", None), "coordinates", None) or {"x": 0, "y": 0}
        player_size = getattr(getattr(getattr(player_ship, "ship", None), "ship_category", None), "size", None) or {"x": 1, "y": 1}
        wreck_coords = getattr(wreck, "coordinates", None) or {"x": 0, "y": 0}
        wreck_size = getattr(getattr(getattr(wreck, "ship", None), "ship_category", None), "size", None) or {"x": 1, "y": 1}
        return self._compute_center_chebyshev_distance(player_coords, player_size, wreck_coords, wreck_size)

    def _wreck_metadata_dict(self, wreck: ShipWreck) -> Dict[str, Any]:
        return wreck.metadata if isinstance(wreck.metadata, dict) else {}

    def _ensure_wreck_loot_container(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        loot = metadata.get("loot")
        if not isinstance(loot, dict):
            loot = {}
            metadata["loot"] = loot
        return loot

    def _build_resource_loot_entry(self, *, uid: str, resource_obj: Optional[Resource], quantity: int) -> Optional[Dict[str, Any]]:
        if not resource_obj:
            return None
        if int(quantity or 0) <= 0:
            return None
        resource_data = resource_obj.data if isinstance(resource_obj.data, dict) else {}
        return {
            "uid": str(uid),
            "resource_id": int(resource_obj.id),
            "name": resource_obj.name or "Resource",
            "quantity": int(quantity or 0),
            "data": resource_data,
            "description": str(resource_data.get("description") or ""),
            "kind": "RESOURCE",
        }

    def _build_module_loot_entry(
        self,
        *,
        uid: str,
        module_obj: Optional[Module],
        metadata: Optional[Dict[str, Any]] = None,
        chance_percent: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        if not module_obj:
            return None
        payload = {
            "uid": str(uid),
            "module_id": int(module_obj.id),
            "name": module_obj.name or "Module",
            "description": module_obj.description or "",
            "type": module_obj.type,
            "tier": int(module_obj.tier or 0),
            "metadata": metadata or {},
            "kind": "MODULE",
            **module_effect_fields(module_obj),
        }
        if chance_percent is not None:
            payload["chance_percent"] = int(chance_percent)
        return payload

    def _get_or_create_salvage_scrap_resource(self) -> Optional[Resource]:
        try:
            resource, _ = Resource.objects.get_or_create(
                name=self.WRECK_SALVAGE_RESOURCE_NAME,
                defaults={
                    "data": {
                        "description": "MatÃ©riaux rÃ©cupÃ©rÃ©s sur une carcasse. UtilisÃ©s pour le craft.",
                        "inventory_section": "RESOURCES",
                        "is_salvage_material": True,
                    }
                },
            )
            return resource
        except Exception:
            logger.exception("wreck loot: failed to get/create salvage scrap resource")
            return None

    def _ensure_wreck_loot_snapshot(self, wreck: ShipWreck, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        md = metadata if isinstance(metadata, dict) else self._wreck_metadata_dict(wreck)
        loot = self._ensure_wreck_loot_container(md)

        # DÃ©jÃ  initialisÃ© (schema versionnÃ© pour permettre les migrations de snapshot en runtime)
        existing_schema = int(loot.get("schema") or 0) if isinstance(loot.get("schema"), (int, str)) else 0
        if (
            existing_schema >= 2 and
            isinstance(loot.get("fouille"), dict) and
            isinstance(loot.get("salvage"), dict)
        ):
            loot.setdefault("schema", 2)
            loot.setdefault("lock", None)
            loot.setdefault("pending_action", None)
            return md

        fouille_resources = []
        fouille_modules = []
        salvage_modules = []

        if wreck.origin_type == "PC":
            source_player_ship_id = (md.get("source_player_ship_id") if isinstance(md, dict) else None)
            if source_player_ship_id:
                dead_player_id = None
                source_actor_key = str((md.get("source_actor_key") if isinstance(md, dict) else "") or "")
                if source_actor_key.startswith("pc_"):
                    try:
                        dead_player_id = int(source_actor_key.split("_", 1)[1])
                    except Exception:
                        dead_player_id = None
                if not dead_player_id:
                    dead_player_id = (
                        PlayerShip.objects
                        .filter(id=int(source_player_ship_id))
                        .values_list("player_id", flat=True)
                        .first()
                    )

                # Les ressources PC sont stockÃ©es sur PlayerResource (pas PlayerShipResource).
                # Fallback legacy conservÃ© au cas oÃ¹ une carcasse ancienne a Ã©tÃ© snapshotÃ©e
                # avec des donnÃ©es de soute dÃ©jÃ  prÃ©sentes sur PlayerShipResource.
                if dead_player_id:
                    res_rows = (
                        PlayerResource.objects
                        .select_related("resource")
                        .filter(source_id=int(dead_player_id), quantity__gt=0)
                        .order_by("-updated_at", "-id")
                    )
                else:
                    res_rows = (
                        PlayerShipResource.objects
                        .select_related("resource")
                        .filter(source_id=int(source_player_ship_id), quantity__gt=0)
                        .order_by("-updated_at", "-id")
                    )
                for row in res_rows:
                    entry = self._build_resource_loot_entry(
                        uid=f"fr_{row.id}",
                        resource_obj=getattr(row, "resource", None),
                        quantity=int(row.quantity or 0),
                    )
                    if entry:
                        fouille_resources.append(entry)

                cargo_mod_rows = (
                    PlayerShipInventoryModule.objects
                    .select_related("module")
                    .filter(player_ship_id=int(source_player_ship_id))
                    .order_by("-created_at", "-id")
                )
                for row in cargo_mod_rows:
                    entry = self._build_module_loot_entry(
                        uid=f"fm_{row.id}",
                        module_obj=getattr(row, "module", None),
                        metadata=(row.metadata if isinstance(row.metadata, dict) else {}),
                    )
                    if entry:
                        fouille_modules.append(entry)

                equipped_rows = (
                    PlayerShipModule.objects
                    .select_related("module")
                    .filter(player_ship_id=int(source_player_ship_id))
                    .order_by("id")
                )
                for row in equipped_rows:
                    entry = self._build_module_loot_entry(
                        uid=f"sm_pc_{row.id}",
                        module_obj=getattr(row, "module", None),
                        metadata={},
                        chance_percent=int(self.WRECK_SALVAGE_MODULE_RECOVERY_CHANCE * 100),
                    )
                    if entry:
                        salvage_modules.append(entry)
        else:
            source_npc_id = (md.get("source_npc_id") if isinstance(md, dict) else None)
            if source_npc_id:
                npc_res_rows = (
                    NpcResource.objects
                    .select_related("resource")
                    .filter(npc_id=int(source_npc_id), quantity__gt=0)
                    .order_by("-updated_at", "-id")
                )
                for row in npc_res_rows:
                    entry = self._build_resource_loot_entry(
                        uid=f"fr_npc_{row.id}",
                        resource_obj=getattr(row, "resource", None),
                        quantity=int(row.quantity or 0),
                    )
                    if entry:
                        fouille_resources.append(entry)

                npc = Npc.objects.select_related("npc_template").filter(id=int(source_npc_id)).first()
                module_ids = []
                if npc and npc.npc_template and isinstance(npc.npc_template.module_id_list, list):
                    module_ids = list(npc.npc_template.module_id_list)
                if module_ids:
                    try:
                        normalized_ids = [int(mid) for mid in module_ids if mid is not None]
                    except Exception:
                        normalized_ids = []
                    mods_by_id = {
                        int(m.id): m
                        for m in Module.objects.filter(id__in=normalized_ids)
                    }
                    for idx, mid in enumerate(normalized_ids):
                        mod = mods_by_id.get(int(mid))
                        entry = self._build_module_loot_entry(
                            uid=f"sm_npc_{source_npc_id}_{idx}",
                            module_obj=mod,
                            metadata={},
                            chance_percent=int(self.WRECK_SALVAGE_MODULE_RECOVERY_CHANCE * 100),
                        )
                        if entry:
                            salvage_modules.append(entry)

        salvage_resources = []
        salvage_resource = self._get_or_create_salvage_scrap_resource()
        if salvage_resource:
            ship_size = self._safe_size_dict(getattr(getattr(getattr(wreck, "ship", None), "ship_category", None), "size", None))
            base_qty = max(1, int(ship_size["x"] * ship_size["y"]))
            module_bonus = max(0, int(len(salvage_modules) / 2))
            random_bonus = random.randint(0, 2)
            salvage_qty = max(1, base_qty + module_bonus + random_bonus)
            salvage_entry = self._build_resource_loot_entry(
                uid=f"sr_{wreck.id}_0",
                resource_obj=salvage_resource,
                quantity=salvage_qty,
            )
            if salvage_entry:
                salvage_resources.append(salvage_entry)

        loot["schema"] = 2
        loot.setdefault("lock", None)
        loot.setdefault("pending_action", None)
        loot["fouille"] = {
            "resources": fouille_resources,
            "modules": fouille_modules,
        }
        loot["salvage"] = {
            "resources": salvage_resources,
            "modules": salvage_modules,
        }
        return md

    def _cleanup_stale_wreck_loot_lock_in_metadata(self, loot: Dict[str, Any], *, now: Optional[datetime.datetime] = None) -> bool:
        if not isinstance(loot, dict):
            return False
        changed = False
        now_dt = now or timezone.now()
        lock = loot.get("lock")
        if isinstance(lock, dict):
            expires_at = self._parse_iso_datetime_safe(lock.get("expires_at"))
            if expires_at and expires_at <= now_dt:
                loot["lock"] = None
                changed = True
        return changed

    def _refresh_wreck_loot_lock(self, loot: Dict[str, Any], *, player_id: int, mode: str) -> None:
        now = timezone.now()
        loot["lock"] = {
            "player_id": int(player_id),
            "mode": str(mode or "FOUILLE").upper(),
            "opened_at": now.isoformat(),
            "expires_at": (now + datetime.timedelta(seconds=self.WRECK_LOOT_LOCK_TIMEOUT_SECONDS)).isoformat(),
            "channel_name": str(getattr(self, "channel_name", "")),
        }

    def _is_wreck_lock_owned_by(self, lock: Any, player_id: int) -> bool:
        if not isinstance(lock, dict):
            return False
        try:
            return int(lock.get("player_id")) == int(player_id)
        except Exception:
            return False

    def _get_wreck_loot_pending_action(self, loot: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pending = loot.get("pending_action")
        return pending if isinstance(pending, dict) else None

    def _find_wreck_loot_item(
        self,
        loot: Dict[str, Any],
        *,
        mode: str,
        item_kind: str,
        item_uid: str,
    ) -> tuple[Optional[list], Optional[int], Optional[Dict[str, Any]]]:
        mode_key = "fouille" if str(mode).upper() == "FOUILLE" else "salvage"
        container = loot.get(mode_key)
        if not isinstance(container, dict):
            return None, None, None
        list_key = "resources" if str(item_kind).upper() == "RESOURCE" else "modules"
        items = container.get(list_key)
        if not isinstance(items, list):
            return None, None, None
        for idx, item in enumerate(items):
            if isinstance(item, dict) and str(item.get("uid")) == str(item_uid):
                return items, idx, item
        return items, None, None

    def _current_player_ship_for_wreck_loot(self, *, lock_for_update: bool = False):
        qs = (
            PlayerShip.objects
            .select_related("ship__ship_category", "player")
            .filter(player_id=self.player_id, is_current_ship=True)
        )
        if lock_for_update:
            qs = qs.select_for_update()
        return qs.first()

    def _broadcast_player_ap_entity_update(self, player: Player) -> None:
        if not player:
            return
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "entity_state_update",
                "entity_key": f"pc_{int(player.id)}",
                "change_type": "ap_update",
                "changes": {
                    "ap": {
                        "current": int(player.current_ap or 0),
                        "max": int(player.max_ap or 0),
                    }
                }
            }
        )

    def _build_wreck_loot_state_payload(self, wreck: ShipWreck, *, target_player_id: int, mode: Optional[str] = None) -> Dict[str, Any]:
        metadata = self._ensure_wreck_loot_snapshot(wreck, metadata=self._wreck_metadata_dict(wreck))
        loot = self._ensure_wreck_loot_container(metadata)
        self._cleanup_stale_wreck_loot_lock_in_metadata(loot)

        lock = loot.get("lock") if isinstance(loot.get("lock"), dict) else None
        active_mode = str(mode or (lock or {}).get("mode") or "FOUILLE").upper()
        if active_mode not in {"FOUILLE", "SALVAGE"}:
            active_mode = "FOUILLE"

        pending = self._get_wreck_loot_pending_action(loot)
        pending_payload = None
        if pending:
            execute_at = self._parse_iso_datetime_safe(pending.get("execute_at"))
            remaining = 0
            if execute_at:
                remaining = max(0, int((execute_at - timezone.now()).total_seconds()))
            pending_payload = {
                "mode": str(pending.get("mode") or "").upper(),
                "item_uid": pending.get("item_uid"),
                "item_kind": str(pending.get("item_kind") or "").upper(),
                "execute_at": pending.get("execute_at"),
                "remaining_seconds": remaining,
                "duration_seconds": int(pending.get("duration_seconds") or 0),
            }

        fouille = loot.get("fouille") if isinstance(loot.get("fouille"), dict) else {}
        salvage = loot.get("salvage") if isinstance(loot.get("salvage"), dict) else {}
        fouille_resources = list(fouille.get("resources") or [])
        fouille_modules = list(fouille.get("modules") or [])
        salvage_resources = list(salvage.get("resources") or [])
        salvage_modules = list(salvage.get("modules") or [])

        player_ship = (
            PlayerShip.objects
            .select_related("player")
            .filter(player_id=int(target_player_id), is_current_ship=True)
            .first()
        )
        current_ap = int(getattr(getattr(player_ship, "player", None), "current_ap", 0) or 0) if player_ship else 0
        has_scavenging_module = False
        if player_ship:
            has_scavenging_module = PlayerShipModule.objects.filter(
                player_ship_id=player_ship.id,
                module__type="GATHERING",
                module__name__iexact="scavenging module",
            ).exists()

        return {
            "wreck_id": int(wreck.id),
            "wreck_key": f"wreck_{int(wreck.id)}",
            "ship_name": (wreck.ship.name if wreck.ship else "Epave"),
            "active_mode": active_mode,
            "lock": {
                "player_id": int(lock.get("player_id")),
                "mode": str(lock.get("mode") or "").upper(),
                "expires_at": lock.get("expires_at"),
                "owned_by_current_player": self._is_wreck_lock_owned_by(lock, int(target_player_id)),
            } if lock else None,
            "pending_action": pending_payload,
            "fouille": {
                "resources": fouille_resources,
                "modules": fouille_modules,
                "resource_count": len(fouille_resources),
                "module_count": len(fouille_modules),
            },
            "salvage": {
                "resources": salvage_resources,
                "modules": salvage_modules,
                "resource_count": len(salvage_resources),
                "module_count": len(salvage_modules),
                "module_recovery_chance_percent": int(self.WRECK_SALVAGE_MODULE_RECOVERY_CHANCE * 100),
                "ap_cost": 1,
                "requires_module": {
                    "type": "GATHERING",
                    "name": "scavenging module",
                    "satisfied": bool(has_scavenging_module),
                },
                "current_ap": current_ap,
            },
        }

    def _emit_wreck_loot_session_state(self, target_player_id: int, wreck: ShipWreck, *, mode: Optional[str] = None) -> None:
        payload = self._build_wreck_loot_state_payload(wreck, target_player_id=int(target_player_id), mode=mode)
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "wreck_loot_session_state",
                "target_player_id": int(target_player_id),
                "message": payload,
            }
        )

    def _emit_wreck_loot_session_state_to_sector_players(
        self,
        wreck: ShipWreck,
        *,
        mode: Optional[str] = None,
        exclude_player_id: Optional[int] = None,
    ) -> None:
        """Broadcast personalized wreck loot state to players currently in the sector.

        Front-end side filters unsolicited updates unless a wreck-loot view is already open,
        so broadcasting here lets other viewers see lock changes (taken/released) live.
        """
        if not wreck or not getattr(wreck, "sector_id", None):
            return
        try:
            qs = Player.objects.filter(sector_id=int(wreck.sector_id)).values_list("id", flat=True)
            for pid in qs:
                try:
                    target_pid = int(pid)
                except Exception:
                    continue
                if exclude_player_id is not None and int(exclude_player_id) == target_pid:
                    continue
                self._emit_wreck_loot_session_state(target_pid, wreck, mode=mode)
        except Exception:
            logger.exception("wreck loot: sector state broadcast failed")

    def _emit_wreck_loot_session_closed(self, target_player_id: int, wreck_id: int, *, mode: Optional[str] = None, reason: Optional[str] = None) -> None:
        message = {
            "wreck_id": int(wreck_id),
            "wreck_key": f"wreck_{int(wreck_id)}",
        }
        if mode:
            message["active_mode"] = str(mode).upper()
        if reason:
            message["reason"] = str(reason)
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "wreck_loot_session_closed",
                "target_player_id": int(target_player_id),
                "message": message,
            }
        )

    def _award_resource_to_player_ship(self, player_ship: PlayerShip, *, resource_id: int, quantity: int) -> bool:
        if not player_ship or int(quantity or 0) <= 0:
            return False
        resource = Resource.objects.filter(id=int(resource_id)).first()
        if not resource:
            return False
        row = (
            PlayerShipResource.objects
            .select_for_update()
            .filter(source_id=player_ship.id, resource_id=resource.id)
            .first()
        )
        if row:
            row.quantity = int(row.quantity or 0) + int(quantity or 0)
            row.save(update_fields=["quantity", "updated_at"])
        else:
            PlayerShipResource.objects.create(
                source=player_ship,
                resource=resource,
                quantity=int(quantity or 0),
            )
        return True

    def _award_module_to_player_ship_inventory(self, player_ship: PlayerShip, *, module_id: int, metadata: Optional[Dict[str, Any]] = None) -> bool:
        if not player_ship:
            return False
        mod = Module.objects.filter(id=int(module_id)).first()
        if not mod:
            return False
        PlayerShipInventoryModule.objects.create(
            player_ship=player_ship,
            module=mod,
            metadata=(metadata if isinstance(metadata, dict) else {}),
        )
        return True

    def _cleanup_stale_wreck_loot_locks_safe(self) -> None:
        try:
            sector_id = int(self.room)
        except Exception:
            return
        try:
            now = timezone.now()
            wrecks = ShipWreck.objects.filter(sector_id=sector_id, status="ACTIVE").only("id", "metadata")
            for wreck in wrecks:
                metadata = self._wreck_metadata_dict(wreck)
                loot = metadata.get("loot")
                if not isinstance(loot, dict):
                    continue
                if not self._cleanup_stale_wreck_loot_lock_in_metadata(loot, now=now):
                    continue
                wreck.metadata = metadata
                wreck.save(update_fields=["metadata", "updated_at"])
        except Exception:
            logger.exception("wreck loot: stale lock cleanup failed")

    def _release_wreck_loot_locks_for_current_player_safe(self) -> None:
        if not getattr(self, "player_id", None):
            return
        try:
            sector_id = int(self.room)
        except Exception:
            return
        try:
            wreck_ids = list(
                ShipWreck.objects.filter(sector_id=sector_id, status="ACTIVE").values_list("id", flat=True)
            )
            for wreck_id in wreck_ids:
                with transaction.atomic():
                    wreck = ShipWreck.objects.select_for_update().filter(id=int(wreck_id), status="ACTIVE").first()
                    if not wreck:
                        continue
                    metadata = self._wreck_metadata_dict(wreck)
                    loot = metadata.get("loot")
                    if not isinstance(loot, dict):
                        continue
                    lock = loot.get("lock")
                    if not self._is_wreck_lock_owned_by(lock, int(self.player_id)):
                        continue
                    pending = self._get_wreck_loot_pending_action(loot)
                    if pending and int(pending.get("player_id") or 0) == int(self.player_id):
                        # Ne pas interrompre une action en cours; le lock expirera ou sera relÃ¢chÃ© Ã  la complÃ©tion.
                        continue
                    loot["lock"] = None
                    wreck.metadata = metadata
                    wreck.save(update_fields=["metadata", "updated_at"])
        except Exception:
            logger.exception("wreck loot: disconnect lock release failed")

    def _handle_wreck_loot_open(self, payload: Dict[str, Any]) -> None:
        try:
            wreck_id = int(payload.get("wreck_id") or payload.get("target_id") or 0)
        except Exception:
            wreck_id = 0
        mode = str(payload.get("mode") or "FOUILLE").upper()
        if mode not in {"FOUILLE", "SALVAGE"}:
            self._send_action_failed_response("INVALID_WRECK_LOOT_MODE", "Mode de loot invalide.")
            return
        if wreck_id <= 0:
            self._send_action_failed_response("WRECK_NOT_FOUND", "Carcasse introuvable.")
            return

        try:
            wreck_for_emit = None
            lock_conflict = False
            with transaction.atomic():
                player_ship = self._current_player_ship_for_wreck_loot(lock_for_update=True)
                if not player_ship:
                    self._send_action_failed_response("PLAYER_SHIP_NOT_FOUND", "Vaisseau courant introuvable.")
                    return

                wreck = (
                    ShipWreck.objects
                    .select_related("ship", "ship__ship_category")
                    .select_for_update()
                    .filter(id=wreck_id, status="ACTIVE")
                    .first()
                )
                if not wreck:
                    self._send_action_failed_response("WRECK_NOT_FOUND", "Carcasse introuvable.")
                    return

                if wreck.expires_at and wreck.expires_at <= timezone.now():
                    self._send_action_failed_response("WRECK_EXPIRED", "Cette carcasse n'est plus disponible.")
                    return

                distance = self._compute_player_ship_to_wreck_distance(player_ship, wreck)
                if distance > int(self.WRECK_LOOT_RANGE_MAX):
                    self._send_action_failed_response(
                        "WRECK_OUT_OF_RANGE",
                        f"Carcasse hors de portÃ©e ({distance} / {self.WRECK_LOOT_RANGE_MAX}).",
                        distance=distance,
                        max_range=int(self.WRECK_LOOT_RANGE_MAX),
                    )
                    return

                metadata = self._ensure_wreck_loot_snapshot(wreck, metadata=self._wreck_metadata_dict(wreck))
                loot = self._ensure_wreck_loot_container(metadata)
                self._cleanup_stale_wreck_loot_lock_in_metadata(loot)

                lock = loot.get("lock")
                if isinstance(lock, dict) and not self._is_wreck_lock_owned_by(lock, int(self.player_id)):
                    lock_conflict = True
                else:
                    self._refresh_wreck_loot_lock(loot, player_id=int(self.player_id), mode=mode)
                wreck.metadata = metadata
                wreck.save(update_fields=["metadata", "updated_at"])
                wreck_for_emit = wreck

            if wreck_for_emit:
                if lock_conflict:
                    # Le second joueur doit voir le mÃªme Ã©cran (actions visibles mais lockÃ©es)
                    # et un message explicite, sans prendre le lock.
                    self._emit_wreck_loot_session_state(int(self.player_id), wreck_for_emit, mode=mode)
                    self._send_action_failed_response(
                        "WRECK_ALREADY_LOOTED",
                        "Cette carcasse est dÃ©jÃ  en cours de fouille/rÃ©cupÃ©ration. Veuillez attendre.",
                        wreck_id=int(wreck_id),
                    )
                else:
                    self._emit_wreck_loot_session_state(int(self.player_id), wreck_for_emit, mode=mode)
                    self._emit_wreck_loot_session_state_to_sector_players(
                        wreck_for_emit,
                        mode=mode,
                        exclude_player_id=int(self.player_id),
                    )
        except Exception:
            logger.exception("wreck loot open failed")
            self._send_action_failed_response("WRECK_LOOT_OPEN_FAILED", "Impossible d'ouvrir le loot de la carcasse.")

    def _handle_wreck_loot_close(self, payload: Dict[str, Any]) -> None:
        try:
            wreck_id = int(payload.get("wreck_id") or payload.get("target_id") or 0)
        except Exception:
            wreck_id = 0
        if wreck_id <= 0:
            self._emit_wreck_loot_session_closed(int(self.player_id), 0, reason="INVALID_WRECK")
            return

        try:
            keep_lock = False
            active_mode = None
            wreck_for_refresh = None
            with transaction.atomic():
                wreck = (
                    ShipWreck.objects
                    .select_for_update()
                    .filter(id=wreck_id, status="ACTIVE")
                    .first()
                )
                if not wreck:
                    self._emit_wreck_loot_session_closed(int(self.player_id), int(wreck_id), reason="WRECK_NOT_FOUND")
                    return

                metadata = self._wreck_metadata_dict(wreck)
                loot = metadata.get("loot")
                if not isinstance(loot, dict):
                    self._emit_wreck_loot_session_closed(int(self.player_id), int(wreck_id), reason="NO_SESSION")
                    return

                self._cleanup_stale_wreck_loot_lock_in_metadata(loot)
                lock = loot.get("lock")
                if not self._is_wreck_lock_owned_by(lock, int(self.player_id)):
                    self._emit_wreck_loot_session_closed(int(self.player_id), int(wreck_id), reason="NOT_LOCK_OWNER")
                    return

                active_mode = str((lock or {}).get("mode") or "FOUILLE").upper()
                pending = self._get_wreck_loot_pending_action(loot)
                if pending and int(pending.get("player_id") or 0) == int(self.player_id):
                    keep_lock = True
                    self._refresh_wreck_loot_lock(loot, player_id=int(self.player_id), mode=active_mode)
                else:
                    loot["lock"] = None

                wreck.metadata = metadata
                wreck.save(update_fields=["metadata", "updated_at"])
                wreck_for_refresh = wreck

                if keep_lock:
                    self._emit_wreck_loot_session_state(int(self.player_id), wreck, mode=active_mode)
                    return

            if wreck_for_refresh:
                self._emit_wreck_loot_session_state_to_sector_players(
                    wreck_for_refresh,
                    mode=active_mode,
                    exclude_player_id=int(self.player_id),
                )
            self._emit_wreck_loot_session_closed(int(self.player_id), int(wreck_id), mode=active_mode, reason="CLOSED")
        except Exception:
            logger.exception("wreck loot close failed")
            self._emit_wreck_loot_session_closed(int(self.player_id), int(wreck_id or 0), reason="ERROR")

    def _handle_wreck_loot_take(self, payload: Dict[str, Any]) -> None:
        try:
            wreck_id = int(payload.get("wreck_id") or 0)
        except Exception:
            wreck_id = 0
        mode = str(payload.get("mode") or "FOUILLE").upper()
        item_uid = str(payload.get("item_uid") or "").strip()
        item_kind = str(payload.get("item_kind") or "").upper()

        if wreck_id <= 0:
            self._send_action_failed_response("WRECK_NOT_FOUND", "Carcasse introuvable.")
            return
        if mode not in {"FOUILLE", "SALVAGE"}:
            self._send_action_failed_response("INVALID_WRECK_LOOT_MODE", "Mode de loot invalide.")
            return
        if item_kind not in {"RESOURCE", "MODULE"} or not item_uid:
            self._send_action_failed_response("INVALID_WRECK_LOOT_ITEM", "Ã‰lÃ©ment de loot invalide.")
            return

        try:
            ap_spent = False
            player_for_ap = None
            wreck_after = None
            with transaction.atomic():
                player_ship = self._current_player_ship_for_wreck_loot(lock_for_update=True)
                if not player_ship:
                    self._send_action_failed_response("PLAYER_SHIP_NOT_FOUND", "Vaisseau courant introuvable.")
                    return

                wreck = (
                    ShipWreck.objects
                    .select_related("ship", "ship__ship_category")
                    .select_for_update()
                    .filter(id=wreck_id, status="ACTIVE")
                    .first()
                )
                if not wreck:
                    self._send_action_failed_response("WRECK_NOT_FOUND", "Carcasse introuvable.")
                    return

                if wreck.expires_at and wreck.expires_at <= timezone.now():
                    self._send_action_failed_response("WRECK_EXPIRED", "Cette carcasse n'est plus disponible.")
                    return

                distance = self._compute_player_ship_to_wreck_distance(player_ship, wreck)
                if distance > int(self.WRECK_LOOT_RANGE_MAX):
                    self._send_action_failed_response(
                        "WRECK_OUT_OF_RANGE",
                        f"Carcasse hors de portÃ©e ({distance} / {self.WRECK_LOOT_RANGE_MAX}).",
                        distance=distance,
                        max_range=int(self.WRECK_LOOT_RANGE_MAX),
                    )
                    return

                metadata = self._ensure_wreck_loot_snapshot(wreck, metadata=self._wreck_metadata_dict(wreck))
                loot = self._ensure_wreck_loot_container(metadata)
                self._cleanup_stale_wreck_loot_lock_in_metadata(loot)

                lock = loot.get("lock")
                if isinstance(lock, dict) and not self._is_wreck_lock_owned_by(lock, int(self.player_id)):
                    self._send_action_failed_response(
                        "WRECK_ALREADY_LOOTED",
                        "Cette carcasse est dÃ©jÃ  en cours de fouille/rÃ©cupÃ©ration par un autre joueur.",
                        wreck_id=int(wreck_id),
                    )
                    return
                if not self._is_wreck_lock_owned_by(lock, int(self.player_id)):
                    self._send_action_failed_response(
                        "WRECK_LOCK_REQUIRED",
                        "Vous devez ouvrir la fouille/rÃ©cupÃ©ration de cette carcasse avant de looter.",
                        wreck_id=int(wreck_id),
                    )
                    return

                pending = self._get_wreck_loot_pending_action(loot)
                if pending:
                    self._send_action_failed_response(
                        "WRECK_LOOT_ALREADY_PENDING",
                        "Une action de loot est dÃ©jÃ  en cours sur cette carcasse.",
                    )
                    return

                items, item_index, item_payload = self._find_wreck_loot_item(
                    loot,
                    mode=mode,
                    item_kind=item_kind,
                    item_uid=item_uid,
                )
                if item_index is None or not isinstance(item_payload, dict):
                    self._send_action_failed_response("WRECK_LOOT_ITEM_NOT_FOUND", "L'Ã©lÃ©ment Ã  looter n'est plus disponible.")
                    return

                if mode == "SALVAGE":
                    has_scavenging_module = PlayerShipModule.objects.filter(
                        player_ship_id=player_ship.id,
                        module__type="GATHERING",
                        module__name__iexact="scavenging module",
                    ).exists()
                    if not has_scavenging_module:
                        self._send_action_failed_response(
                            "SCAVENGING_MODULE_REQUIRED",
                            "Un module de rÃ©cupÃ©ration (scavenging module) est requis pour effectuer un salvage.",
                        )
                        return

                    player_for_ap = Player.objects.select_for_update().filter(id=int(self.player_id)).first()
                    if not player_for_ap:
                        self._send_action_failed_response("PLAYER_NOT_FOUND", "Joueur introuvable.")
                        return
                    if int(player_for_ap.current_ap or 0) < 1:
                        self._send_action_failed_response("NOT_ENOUGH_AP", "AP insuffisants pour effectuer un salvage.")
                        return

                    player_for_ap.current_ap = max(0, int(player_for_ap.current_ap or 0) - 1)
                    player_for_ap.save(update_fields=["current_ap"])
                    ap_spent = True

                duration_seconds = (
                    int(self.WRECK_LOOT_FOUILLE_SECONDS)
                    if mode == "FOUILLE"
                    else int(self.WRECK_LOOT_SALVAGE_SECONDS)
                )
                now = timezone.now()
                execute_at = now + datetime.timedelta(seconds=duration_seconds)

                loot["pending_action"] = {
                    "player_id": int(self.player_id),
                    "mode": mode,
                    "item_kind": item_kind,
                    "item_uid": item_uid,
                    "duration_seconds": int(duration_seconds),
                    "execute_at": execute_at.isoformat(),
                    "started_at": now.isoformat(),
                }
                self._refresh_wreck_loot_lock(loot, player_id=int(self.player_id), mode=mode)

                wreck.metadata = metadata
                wreck.save(update_fields=["metadata", "updated_at"])
                wreck_after = wreck

            if ap_spent and player_for_ap:
                self._broadcast_player_ap_entity_update(player_for_ap)
                self._emit_local_ship_module_sync(int(self.player_id), context="WRECK_LOOT_AP_SPENT")

            if wreck_after:
                self._emit_wreck_loot_session_state(int(self.player_id), wreck_after, mode=mode)
        except Exception:
            logger.exception("wreck loot take start failed")
            self._send_action_failed_response("WRECK_LOOT_TAKE_FAILED", "Impossible de lancer cette action de loot.")

    def _process_due_wreck_loot_actions_safe(self) -> None:
        try:
            sector_id = int(self.room)
        except Exception:
            return
        try:
            now = timezone.now()
            wreck_rows = list(
                ShipWreck.objects
                .filter(sector_id=sector_id, status="ACTIVE")
                .values("id", "metadata")[:80]
            )
            due_ids = []
            for row in wreck_rows:
                metadata = row.get("metadata")
                if not isinstance(metadata, dict):
                    continue
                loot = metadata.get("loot")
                if not isinstance(loot, dict):
                    continue
                pending = loot.get("pending_action")
                if not isinstance(pending, dict):
                    continue
                execute_at = self._parse_iso_datetime_safe(pending.get("execute_at"))
                if execute_at and execute_at <= now:
                    try:
                        due_ids.append(int(row.get("id")))
                    except Exception:
                        continue

            for wreck_id in due_ids:
                self._complete_pending_wreck_loot_action(int(wreck_id))
        except Exception:
            logger.exception("wreck loot sweep failed")

    def _complete_pending_wreck_loot_action(self, wreck_id: int) -> None:
        try:
            post_commit = None
            with transaction.atomic():
                wreck = (
                    ShipWreck.objects
                    .select_related("ship", "ship__ship_category")
                    .select_for_update()
                    .filter(id=int(wreck_id), status="ACTIVE")
                    .first()
                )
                if not wreck:
                    return

                metadata = self._wreck_metadata_dict(wreck)
                loot = metadata.get("loot")
                if not isinstance(loot, dict):
                    return

                pending = self._get_wreck_loot_pending_action(loot)
                if not pending:
                    return

                execute_at = self._parse_iso_datetime_safe(pending.get("execute_at"))
                now = timezone.now()
                if execute_at and execute_at > now:
                    return

                player_id = int(pending.get("player_id") or 0)
                mode = str(pending.get("mode") or "FOUILLE").upper()
                item_kind = str(pending.get("item_kind") or "").upper()
                item_uid = str(pending.get("item_uid") or "")

                items, item_index, item_payload = self._find_wreck_loot_item(
                    loot, mode=mode, item_kind=item_kind, item_uid=item_uid
                )
                if item_index is None or not isinstance(item_payload, dict):
                    loot["pending_action"] = None
                    lock = loot.get("lock")
                    if self._is_wreck_lock_owned_by(lock, player_id):
                        self._refresh_wreck_loot_lock(loot, player_id=player_id, mode=mode)
                    wreck.metadata = metadata
                    wreck.save(update_fields=["metadata", "updated_at"])
                    post_commit = {
                        "player_id": player_id,
                        "wreck_id": int(wreck.id),
                        "mode": mode,
                        "failed": {"reason": "WRECK_LOOT_ITEM_NOT_FOUND", "message": "L'Ã©lÃ©ment Ã  looter n'est plus disponible."},
                    }
                else:
                    player_ship = (
                        PlayerShip.objects
                        .select_related("player", "ship")
                        .select_for_update()
                        .filter(player_id=player_id, is_current_ship=True)
                        .first()
                    )
                    if not player_ship:
                        loot["pending_action"] = None
                        if self._is_wreck_lock_owned_by(loot.get("lock"), player_id):
                            loot["lock"] = None
                        wreck.metadata = metadata
                        wreck.save(update_fields=["metadata", "updated_at"])
                        post_commit = {
                            "player_id": player_id,
                            "wreck_id": int(wreck.id),
                            "mode": mode,
                            "failed": {"reason": "PLAYER_SHIP_NOT_FOUND", "message": "Vaisseau courant introuvable."},
                        }
                    else:
                        awarded = False
                        chance_failed = False
                        if item_kind == "RESOURCE":
                            awarded = self._award_resource_to_player_ship(
                                player_ship,
                                resource_id=int(item_payload.get("resource_id") or 0),
                                quantity=int(item_payload.get("quantity") or 0),
                            )
                            if awarded:
                                items.pop(int(item_index))
                        elif item_kind == "MODULE":
                            if mode == "SALVAGE":
                                awarded = random.random() < float(self.WRECK_SALVAGE_MODULE_RECOVERY_CHANCE)
                                if awarded:
                                    self._award_module_to_player_ship_inventory(
                                        player_ship,
                                        module_id=int(item_payload.get("module_id") or 0),
                                        metadata=item_payload.get("metadata") or {},
                                    )
                                else:
                                    chance_failed = True
                                items.pop(int(item_index))
                            else:
                                awarded = self._award_module_to_player_ship_inventory(
                                    player_ship,
                                    module_id=int(item_payload.get("module_id") or 0),
                                    metadata=item_payload.get("metadata") or {},
                                )
                                if awarded:
                                    items.pop(int(item_index))
                        else:
                            awarded = False

                        loot["pending_action"] = None
                        if self._is_wreck_lock_owned_by(loot.get("lock"), player_id):
                            self._refresh_wreck_loot_lock(loot, player_id=player_id, mode=mode)

                        wreck.metadata = metadata
                        wreck.save(update_fields=["metadata", "updated_at"])
                        post_commit = {
                            "player_id": int(player_id),
                            "wreck_id": int(wreck.id),
                            "mode": mode,
                            "awarded": bool(awarded),
                            "chance_failed": bool(chance_failed),
                        }

            if not post_commit:
                return

            target_player_id = int(post_commit.get("player_id") or 0)
            if target_player_id:
                self._emit_local_ship_module_sync(target_player_id, context="WRECK_LOOT_COMPLETED")

            if post_commit.get("failed") and target_player_id:
                self._emit_targeted_action_failed(
                    target_player_id,
                    reason=str(post_commit["failed"].get("reason") or "WRECK_LOOT_FAILED"),
                    message=post_commit["failed"].get("message"),
                )

            if post_commit.get("chance_failed") and target_player_id:
                self._emit_targeted_action_failed(
                    target_player_id,
                    reason="SALVAGE_RECOVERY_FAILED",
                    message="La rÃ©cupÃ©ration de ce module a Ã©chouÃ©.",
                )

            wreck = (
                ShipWreck.objects
                .select_related("ship", "ship__ship_category")
                .filter(id=int(post_commit["wreck_id"]), status="ACTIVE")
                .first()
            )
            if wreck and target_player_id:
                self._emit_wreck_loot_session_state(target_player_id, wreck, mode=post_commit.get("mode"))
                self._emit_wreck_loot_session_state_to_sector_players(
                    wreck,
                    mode=post_commit.get("mode"),
                    exclude_player_id=target_player_id,
                )
        except Exception:
            logger.exception("wreck loot completion failed")

    def _send_action_failed_response(self, reason: str, message: Optional[str] = None, **extra) -> None:
        payload = {"reason": reason}
        if message:
            payload["message"] = message
        if extra:
            payload.update(extra)
        self._send_response({
            "type": "action_failed",
            "message": payload,
        })

    def _emit_targeted_action_failed(self, target_player_id: int, reason: str, message: Optional[str] = None, **extra) -> None:
        payload = {"reason": reason}
        if message:
            payload["message"] = message
        if extra:
            payload.update(extra)
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "action_failed",
                "target_player_id": int(target_player_id),
                "message": payload,
            }
        )

    def _emit_local_ship_module_sync(self, target_player_id: int, context: str, extra: Optional[Dict[str, Any]] = None) -> None:
        data = build_pc_modal_data(int(target_player_id))
        if not data:
            return
        message = {
            "target_key": f"pc_{int(target_player_id)}",
            "data": data,
            "context": context,
        }
        if isinstance(extra, dict):
            message.update(extra)
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "ship_module_local_sync",
                "target_player_id": int(target_player_id),
                "message": message,
            }
        )

    def _get_active_scan_recipients_for_pc(self, target_player_id: int, sector_id: int) -> set[int]:
        now = timezone.now()
        scan_qs = ScanIntel.objects.filter(
            target_type="pc",
            target_id=int(target_player_id),
            sector_id=int(sector_id),
            invalidated_at__isnull=True,
            expires_at__gt=now,
        )
        recipients = set(int(pid) for pid in scan_qs.values_list("scanner_player_id", flat=True))
        scan_ids = list(scan_qs.values_list("id", flat=True))
        if scan_ids:
            group_ids = list(
                ScanIntelGroup.objects.filter(scan_id__in=scan_ids).values_list("group_id", flat=True)
            )
            if group_ids:
                recipients.update(
                    int(pid)
                    for pid in PlayerGroup.objects.filter(group_id__in=group_ids).values_list("player_id", flat=True)
                )
        return recipients

    def _build_scan_safe_pc_modal_payload(self, data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not isinstance(data, dict):
            return data
        ship_payload = data.get("ship")
        if not isinstance(ship_payload, dict):
            return data

        sanitized = dict(data)
        sanitized_ship = dict(ship_payload)
        sanitized_ship.pop("inventory_modules", None)
        sanitized_ship.pop("inventory_resources", None)
        sanitized_ship.pop("inventory_quest_items", None)
        sanitized_ship.pop("module_reconfiguration", None)
        sanitized["ship"] = sanitized_ship
        return sanitized

    def _emit_scan_target_refresh_for_pc(self, target_player_id: int, data: Optional[Dict[str, Any]] = None) -> None:
        try:
            sector_id = int(self.room)
        except Exception:
            return

        target_payload = data or build_pc_modal_data(int(target_player_id))
        target_payload = self._build_scan_safe_pc_modal_payload(target_payload)
        if not target_payload:
            return

        recipients = self._get_active_scan_recipients_for_pc(int(target_player_id), sector_id)
        target_key = f"pc_{int(target_player_id)}"
        for recipient_id in recipients:
            if int(recipient_id) == int(target_player_id):
                continue
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "scan_target_data_refresh",
                    "target_player_id": int(recipient_id),
                    "message": {
                        "target_key": target_key,
                        "data": target_payload,
                    }
                }
            )

    def _broadcast_ship_stats_entity_updates(self, player_ship: PlayerShip) -> None:
        entity_key = f"pc_{int(player_ship.player_id)}"
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "entity_state_update",
                "entity_key": entity_key,
                "change_type": "hp_update",
                "changes": {
                    "hp": {
                        "current": int(player_ship.current_hp or 0),
                        "max": int(player_ship.max_hp or 0),
                    },
                    "shields": {
                        "TORPEDO": int(player_ship.current_torpedo_defense or 0),
                        "LASER": int(player_ship.current_laser_defense or 0),
                        "BALLISTIC": int(player_ship.current_ballistic_defense or 0),
                    },
                    "shield_max": {
                        "TORPEDO": int(player_ship.max_torpedo_defense or 0),
                        "LASER": int(player_ship.max_laser_defense or 0),
                        "BALLISTIC": int(player_ship.max_ballistic_defense or 0),
                    },
                }
            }
        )
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "entity_state_update",
                "entity_key": entity_key,
                "change_type": "mp_update",
                "changes": {
                    "movement": {
                        "current": int(player_ship.current_movement or 0),
                        "max": int(player_ship.max_movement or 0),
                    }
                }
            }
        )

    def _refresh_room_cache_after_ship_module_change(self) -> None:
        try:
            StoreInCache(self.room_group_name, self.user).get_or_set_cache(need_to_be_recreated=True)
        except Exception:
            logger.exception("module reconfig: cache rebuild failed")

    def _process_due_module_reconfigurations_safe(self) -> None:
        try:
            sector_id = int(self.room)
        except Exception:
            return

        try:
            now = timezone.now()
            due_ids = list(
                PlayerShipModuleReconfiguration.objects.filter(
                    status="PENDING",
                    execute_at__lte=now,
                    player_ship__is_current_ship=True,
                    player_ship__player__sector_id=sector_id,
                ).values_list("id", flat=True)[:25]
            )
            for action_id in due_ids:
                self._complete_pending_module_reconfiguration(int(action_id))
        except Exception:
            logger.exception("module reconfig sweep failed")

    def _validate_module_reconfig_request(self, player_ship: PlayerShip, operation: str) -> Optional[Dict[str, Any]]:
        now = timezone.now()
        if operation not in {"EQUIP", "UNEQUIP"}:
            return {"reason": "INVALID_OPERATION", "message": "OpÃ©ration invalide."}

        if str(getattr(player_ship, "status", "")).upper() == "DEAD":
            return {"reason": "SHIP_DEAD", "message": "Impossible de modifier l'Ã©quipement sur un vaisseau dÃ©truit."}

        blocked_until = getattr(player_ship, "equipment_blocked_until", None)
        if blocked_until and blocked_until > now:
            remaining = max(1, int((blocked_until - now).total_seconds()))
            return {
                "reason": "IN_COMBAT_LOCK",
                "message": f"Impossible de modifier l'Ã©quipement pendant {remaining}s aprÃ¨s un combat.",
                "remaining_seconds": remaining,
            }

        if PlayerShipModuleReconfiguration.objects.filter(player_ship_id=player_ship.id, status="PENDING").exists():
            return {
                "reason": "RECONFIG_ALREADY_PENDING",
                "message": "Une reconfiguration est dÃ©jÃ  en cours sur ce vaisseau.",
            }

        return None

    def _validate_equip_capacity_constraints(self, player_ship: PlayerShip, module_obj: Module) -> Optional[Dict[str, Any]]:
        equipped_count = PlayerShipModule.objects.filter(player_ship_id=player_ship.id).count()
        global_max = int(getattr(getattr(player_ship, "ship", None), "module_slot_available", 0) or 0)
        if equipped_count >= global_max:
            return {
                "reason": "MODULE_SLOTS_FULL",
                "message": "Impossible d'Ã©quiper ce module : ce vaisseau est dÃ©jÃ  Ã  sa capacitÃ© maximale.",
                "equipped": equipped_count,
                "max": global_max,
            }

        limits = get_player_ship_module_limits(player_ship)
        counts = count_equipped_modules_by_limit_bucket(player_ship)
        bucket = module_limit_bucket(getattr(module_obj, "type", None))
        limit = limits.get(bucket)
        if isinstance(limit, int):
            current = int(counts.get(bucket, 0))
            if current >= int(limit):
                return {
                    "reason": "MODULE_TYPE_LIMIT_REACHED",
                    "message": "Impossible d'Ã©quiper ce module car cette catÃ©gorie est dÃ©jÃ  Ã  sa capacitÃ© maximum pour ce vaisseau.",
                    "module_type": bucket,
                    "equipped": current,
                    "max": int(limit),
                }
        return None

    def _handle_ship_module_reconfiguration(self, payload: Dict[str, Any]) -> None:
        try:
            player_ship = (
                PlayerShip.objects
                .select_related("ship", "player")
                .filter(player_id=self.player_id, is_current_ship=True)
                .first()
            )
            if not player_ship:
                self._send_action_failed_response("PLAYER_SHIP_NOT_FOUND", "Vaisseau courant introuvable.")
                return

            operation = str(payload.get("operation") or "").upper()
            base_error = self._validate_module_reconfig_request(player_ship, operation)
            if base_error:
                self._send_action_failed_response(**base_error)
                return

            execute_at = timezone.now() + datetime.timedelta(seconds=self.MODULE_RECONFIG_SECONDS)

            with transaction.atomic():
                locked_ship = (
                    PlayerShip.objects
                    .select_related("ship", "player")
                    .select_for_update()
                    .get(id=player_ship.id)
                )

                base_error = self._validate_module_reconfig_request(locked_ship, operation)
                if base_error:
                    self._send_action_failed_response(**base_error)
                    return

                created_action = None

                if operation == "UNEQUIP":
                    equipped_entry_id = payload.get("equipped_entry_id")
                    if not equipped_entry_id:
                        self._send_action_failed_response("MISSING_EQUIPPED_ENTRY_ID", "Module Ã©quipÃ© introuvable.")
                        return

                    equipped_entry = (
                        PlayerShipModule.objects
                        .select_related("module")
                        .filter(id=int(equipped_entry_id), player_ship_id=locked_ship.id)
                        .first()
                    )
                    if not equipped_entry or not equipped_entry.module:
                        self._send_action_failed_response("EQUIPPED_MODULE_NOT_FOUND", "Le module Ã  dÃ©sÃ©quiper est introuvable.")
                        return

                    created_action = PlayerShipModuleReconfiguration.objects.create(
                        player_ship=locked_ship,
                        requested_by_player_id=self.player_id,
                        action_type="UNEQUIP",
                        status="PENDING",
                        module=equipped_entry.module,
                        equipped_module_entry=equipped_entry,
                        execute_at=execute_at,
                        metadata={},
                    )

                elif operation == "EQUIP":
                    inventory_module_id = payload.get("inventory_module_id")
                    if not inventory_module_id:
                        self._send_action_failed_response("MISSING_INVENTORY_MODULE_ID", "Module d'inventaire introuvable.")
                        return

                    inventory_entry = (
                        PlayerShipInventoryModule.objects
                        .select_related("module")
                        .filter(id=int(inventory_module_id), player_ship_id=locked_ship.id)
                        .first()
                    )
                    if not inventory_entry or not inventory_entry.module:
                        self._send_action_failed_response("INVENTORY_MODULE_NOT_FOUND", "Le module Ã  Ã©quiper est introuvable.")
                        return

                    capacity_error = self._validate_equip_capacity_constraints(locked_ship, inventory_entry.module)
                    if capacity_error:
                        self._send_action_failed_response(**capacity_error)
                        return

                    created_action = PlayerShipModuleReconfiguration.objects.create(
                        player_ship=locked_ship,
                        requested_by_player_id=self.player_id,
                        action_type="EQUIP",
                        status="PENDING",
                        module=inventory_entry.module,
                        inventory_module_entry=inventory_entry,
                        execute_at=execute_at,
                        metadata=inventory_entry.metadata or {},
                    )

                else:
                    self._send_action_failed_response("INVALID_OPERATION", "OpÃ©ration invalide.")
                    return

            self._emit_local_ship_module_sync(
                self.player_id,
                context="MODULE_RECONFIG_STARTED",
                extra={
                    "operation": operation,
                    "reconfiguration_id": int(created_action.id),
                }
            )
        except Exception:
            logger.exception("module reconfig start failed")
            self._send_action_failed_response("MODULE_RECONFIG_START_FAILED", "Impossible de lancer la reconfiguration.")

    def _handle_ship_inventory_discard(self, payload: Dict[str, Any]) -> None:
        try:
            player_ship = (
                PlayerShip.objects
                .select_related("ship", "player")
                .filter(player_id=self.player_id, is_current_ship=True)
                .first()
            )
            if not player_ship:
                self._send_action_failed_response("PLAYER_SHIP_NOT_FOUND", "Vaisseau courant introuvable.")
                return

            item_kind = str(payload.get("item_kind") or "").upper()
            if item_kind not in {"MODULE", "RESOURCE"}:
                self._send_action_failed_response("INVALID_INVENTORY_ITEM_KIND", "Type d'objet d'inventaire invalide.")
                return

            removed_payload: Dict[str, Any] = {"item_kind": item_kind}

            with transaction.atomic():
                locked_ship = (
                    PlayerShip.objects
                    .select_for_update()
                    .filter(id=player_ship.id, is_current_ship=True)
                    .first()
                )
                if not locked_ship:
                    self._send_action_failed_response("PLAYER_SHIP_NOT_FOUND", "Vaisseau courant introuvable.")
                    return

                if item_kind == "MODULE":
                    inventory_module_id = payload.get("inventory_module_id")
                    try:
                        inventory_module_id_int = int(inventory_module_id)
                    except Exception:
                        self._send_action_failed_response("MISSING_INVENTORY_MODULE_ID", "Module d'inventaire introuvable.")
                        return

                    inventory_entry = (
                        PlayerShipInventoryModule.objects
                        .select_for_update()
                        .filter(id=inventory_module_id_int, player_ship_id=locked_ship.id)
                        .first()
                    )
                    if not inventory_entry:
                        self._send_action_failed_response("INVENTORY_MODULE_NOT_FOUND", "Le module a supprimer est introuvable.")
                        return

                    inventory_entry.delete()
                    removed_payload.update({
                        "inventory_module_id": inventory_module_id_int,
                        "removed_quantity": 1,
                    })
                else:
                    inventory_resource_id = payload.get("inventory_resource_id")
                    try:
                        inventory_resource_id_int = int(inventory_resource_id)
                    except Exception:
                        self._send_action_failed_response("MISSING_INVENTORY_RESOURCE_ID", "Ressource d'inventaire introuvable.")
                        return

                    resource_row = (
                        PlayerShipResource.objects
                        .select_for_update()
                        .filter(id=inventory_resource_id_int, source_id=locked_ship.id)
                        .first()
                    )
                    if not resource_row:
                        self._send_action_failed_response("INVENTORY_RESOURCE_NOT_FOUND", "La ressource a supprimer est introuvable.")
                        return

                    current_qty = int(resource_row.quantity or 0)
                    if current_qty <= 0:
                        resource_row.delete()
                        self._send_action_failed_response("INVENTORY_RESOURCE_EMPTY", "La pile de ressource est deja vide.")
                        return

                    remove_all = bool(payload.get("remove_all"))
                    quantity_raw = payload.get("quantity")
                    if isinstance(quantity_raw, str) and quantity_raw.strip().upper() == "ALL":
                        remove_all = True

                    if remove_all:
                        remove_qty = current_qty
                    else:
                        try:
                            remove_qty = int(quantity_raw)
                        except Exception:
                            self._send_action_failed_response("INVALID_DISCARD_QUANTITY", "Quantite de suppression invalide.")
                            return

                        if remove_qty <= 0:
                            self._send_action_failed_response("INVALID_DISCARD_QUANTITY", "Quantite de suppression invalide.")
                            return
                        if remove_qty > current_qty:
                            self._send_action_failed_response(
                                "DISCARD_QUANTITY_EXCEEDS_STACK",
                                "Quantite demandee superieure a la pile disponible.",
                                available_quantity=current_qty,
                            )
                            return

                    remaining_qty = current_qty - int(remove_qty)
                    if remaining_qty > 0:
                        resource_row.quantity = remaining_qty
                        resource_row.save(update_fields=["quantity", "updated_at"])
                    else:
                        resource_row.delete()

                    removed_payload.update({
                        "inventory_resource_id": inventory_resource_id_int,
                        "removed_quantity": int(remove_qty),
                        "remaining_quantity": max(0, remaining_qty),
                    })

            self._emit_local_ship_module_sync(
                self.player_id,
                context="INVENTORY_ITEM_DISCARDED",
                extra=removed_payload,
            )
        except Exception:
            logger.exception("inventory discard failed")
            self._send_action_failed_response("INVENTORY_DISCARD_FAILED", "Impossible de supprimer cet objet de l'inventaire.")

    def _complete_pending_module_reconfiguration(self, action_id: int) -> None:
        try:
            post_commit: Optional[Dict[str, Any]] = None
            now = timezone.now()

            with transaction.atomic():
                action = (
                    PlayerShipModuleReconfiguration.objects
                    .select_related(
                        "player_ship__ship",
                        "player_ship__player",
                        "module",
                        "equipped_module_entry__module",
                        "inventory_module_entry__module",
                    )
                    .select_for_update()
                    .filter(id=int(action_id))
                    .first()
                )
                if not action or action.status != "PENDING":
                    return
                if action.execute_at and action.execute_at > now:
                    return

                player_ship = action.player_ship
                if not player_ship or not player_ship.is_current_ship:
                    action.status = "FAILED"
                    action.completed_at = now
                    action.metadata = {**(action.metadata or {}), "error": "SHIP_NOT_CURRENT"}
                    action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                    post_commit = {
                        "status": "FAILED",
                        "player_id": int(action.requested_by_player_id or 0),
                        "reason": "SHIP_NOT_CURRENT",
                        "message": "Le vaisseau n'est plus disponible pour cette reconfiguration.",
                    }
                elif action.action_type == "UNEQUIP":
                    equipped_entry = (
                        PlayerShipModule.objects
                        .select_related("module")
                        .filter(id=action.equipped_module_entry_id, player_ship_id=player_ship.id)
                        .first()
                    )
                    if not equipped_entry or not equipped_entry.module:
                        action.status = "FAILED"
                        action.completed_at = now
                        action.metadata = {**(action.metadata or {}), "error": "EQUIPPED_ENTRY_MISSING"}
                        action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                        post_commit = {
                            "status": "FAILED",
                            "player_id": int(player_ship.player_id),
                            "reason": "UNEQUIP_TARGET_MISSING",
                            "message": "Le module Ã  dÃ©sÃ©quiper n'est plus disponible.",
                        }
                    else:
                        inv_entry = PlayerShipInventoryModule.objects.create(
                            player_ship=player_ship,
                            module=equipped_entry.module,
                            metadata=(action.metadata or {}),
                        )
                        equipped_entry.delete()
                        recompute_player_ship_stats(player_ship, save=True)
                        action.status = "COMPLETED"
                        action.completed_at = now
                        action.metadata = {**(action.metadata or {}), "result_inventory_module_id": int(inv_entry.id)}
                        action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                        post_commit = {
                            "status": "COMPLETED",
                            "player_id": int(player_ship.player_id),
                            "player_ship_id": int(player_ship.id),
                            "operation": "UNEQUIP",
                        }
                elif action.action_type == "EQUIP":
                    inventory_entry = (
                        PlayerShipInventoryModule.objects
                        .select_related("module")
                        .filter(id=action.inventory_module_entry_id, player_ship_id=player_ship.id)
                        .first()
                    )
                    if not inventory_entry or not inventory_entry.module:
                        action.status = "FAILED"
                        action.completed_at = now
                        action.metadata = {**(action.metadata or {}), "error": "INVENTORY_ENTRY_MISSING"}
                        action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                        post_commit = {
                            "status": "FAILED",
                            "player_id": int(player_ship.player_id),
                            "reason": "EQUIP_TARGET_MISSING",
                            "message": "Le module Ã  Ã©quiper n'est plus disponible dans l'inventaire.",
                        }
                    else:
                        capacity_error = self._validate_equip_capacity_constraints(player_ship, inventory_entry.module)
                        if capacity_error:
                            action.status = "FAILED"
                            action.completed_at = now
                            action.metadata = {**(action.metadata or {}), "error": capacity_error.get("reason")}
                            action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                            post_commit = {
                                "status": "FAILED",
                                "player_id": int(player_ship.player_id),
                                **capacity_error,
                            }
                        else:
                            equipped_entry = PlayerShipModule.objects.create(
                                player_ship=player_ship,
                                module=inventory_entry.module,
                            )
                            inventory_entry.delete()
                            recompute_player_ship_stats(player_ship, save=True)
                            action.status = "COMPLETED"
                            action.completed_at = now
                            action.metadata = {**(action.metadata or {}), "result_equipped_entry_id": int(equipped_entry.id)}
                            action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                            post_commit = {
                                "status": "COMPLETED",
                                "player_id": int(player_ship.player_id),
                                "player_ship_id": int(player_ship.id),
                                "operation": "EQUIP",
                            }
                else:
                    action.status = "FAILED"
                    action.completed_at = now
                    action.metadata = {**(action.metadata or {}), "error": "INVALID_ACTION_TYPE"}
                    action.save(update_fields=["status", "completed_at", "metadata", "updated_at"])
                    post_commit = {
                        "status": "FAILED",
                        "player_id": int(player_ship.player_id) if player_ship else int(action.requested_by_player_id or 0),
                        "reason": "INVALID_ACTION_TYPE",
                        "message": "Action de reconfiguration invalide.",
                    }

            if not post_commit:
                return

            target_player_id = int(post_commit.get("player_id") or 0)
            if target_player_id:
                self._refresh_room_cache_after_ship_module_change()
                self._emit_local_ship_module_sync(target_player_id, context=f"MODULE_RECONFIG_{post_commit['status']}")

            if post_commit["status"] != "COMPLETED":
                if target_player_id:
                    self._emit_targeted_action_failed(
                        target_player_id,
                        reason=str(post_commit.get("reason") or "MODULE_RECONFIG_FAILED"),
                        message=post_commit.get("message"),
                        module_type=post_commit.get("module_type"),
                        equipped=post_commit.get("equipped"),
                        max=post_commit.get("max"),
                    )
                return

            player_ship = (
                PlayerShip.objects
                .select_related("ship", "player")
                .filter(id=int(post_commit["player_ship_id"]))
                .first()
            )
            if not player_ship:
                return

            self._broadcast_ship_stats_entity_updates(player_ship)
            fresh_data = build_pc_modal_data(target_player_id)
            self._emit_scan_target_refresh_for_pc(target_player_id, data=fresh_data)

        except Exception:
            logger.exception("module reconfig completion failed")

    def _parse_client_json_message(self, text_data: str) -> Optional[Dict[str, Any]]:
        try:
            data = json.loads(text_data)
        except Exception:
            return None

        if not isinstance(data, dict):
            return None

        if not data.get("type"):
            return None

        return data

    def _dispatch_client_message(self, data: Dict[str, Any]) -> bool:
        msg_type = data["type"]
        handlers = {
            "ping": self._dispatch_ping_message,
            "request_data_sync": self._dispatch_data_sync_message,
            "request_scan_state_sync": self._dispatch_scan_state_sync_message,
            "async_move": self._dispatch_move_message,
            "canvas_flip_ship": self._dispatch_canvas_flip_ship_message,
            "async_chat_message": self._dispatch_chat_message,
            "async_send_mp": self._dispatch_private_message,
            "action_scan_pc_npc": self._dispatch_scan_action_message,
            "action_share_scan": self._dispatch_share_scan_message,
            "share_scan": self._dispatch_share_scan_message,
            "action_attack": self._dispatch_combat_action_message,
            "action_ship_module_reconfigure": self._dispatch_ship_module_reconfiguration_message,
            "action_ship_inventory_discard": self._dispatch_ship_inventory_discard_message,
            "action_group_invite": self._dispatch_group_invite_message,
            "action_group_invitation_response": self._dispatch_group_invitation_response_message,
            "action_group_kick": self._dispatch_group_kick_message,
            "action_group_transfer_lead": self._dispatch_group_transfer_lead_message,
            "action_group_leave": self._dispatch_group_leave_message,
            "action_group_disband": self._dispatch_group_disband_message,
            "action_wreck_loot_open": self._dispatch_wreck_loot_open_message,
            "action_wreck_loot_close": self._dispatch_wreck_loot_close_message,
            "action_wreck_loot_take": self._dispatch_wreck_loot_take_message,
            "action_respawn": self._dispatch_respawn_action_message,
        }
        handler = handlers.get(msg_type)
        if not handler:
            return False
        handler(data)
        return True

    def _get_client_payload(self, data: Dict[str, Any]) -> Any:
        if "payload" in data:
            return data.get("payload")
        return data.get("message")

    def _dispatch_ping_message(self, data: Dict[str, Any]) -> None:
        self._send_response(self._handle_ping_with_validation(data))

    def _dispatch_data_sync_message(self, data: Dict[str, Any]) -> None:
        self._handle_data_sync_request(data)

    def _dispatch_scan_state_sync_message(self, data: Dict[str, Any]) -> None:
        self.send_scan_state_sync()

    def _dispatch_move_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            logger.error(f"Payload async_move invalide: {data}")
            return
        self._handle_move_request(payload)

    def _dispatch_canvas_flip_ship_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                logger.error(f"Payload canvas_flip_ship invalide: {data}")
                return
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            logger.error(f"Payload canvas_flip_ship invalide: {data}")
            return

        response = self._process_ship_reversal(payload)
        if response:
            self._broadcast_message(response)

    def _dispatch_chat_message(self, data: Dict[str, Any]) -> None:
        self.async_send_chat_msg(data)

    def _dispatch_private_message(self, data: Dict[str, Any]) -> None:
        self.async_send_mp(data)

    def _dispatch_scan_action_message(self, data: Dict[str, Any]) -> None:
        self._handle_scan_action_pc_npc(self._get_client_payload(data))

    def _dispatch_share_scan_message(self, data: Dict[str, Any]) -> None:
        self._handle_share_scan(self._get_client_payload(data))

    def _dispatch_combat_action_message(self, data: Dict[str, Any]) -> None:
        self._handle_combat_action(self._get_client_payload(data))

    def _dispatch_ship_module_reconfiguration_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_response({
                "type": "action_failed",
                "reason": "INVALID_RECONFIG_PAYLOAD",
                "message": {"reason": "INVALID_RECONFIG_PAYLOAD"},
            })
            return
        self._handle_ship_module_reconfiguration(payload)

    def _dispatch_ship_inventory_discard_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_INVENTORY_DISCARD_PAYLOAD", "Payload d'inventaire invalide.")
            return
        self._handle_ship_inventory_discard(payload)

    def _dispatch_group_invite_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_GROUP_PAYLOAD", "Payload groupe invalide.")
            return
        self._handle_group_invite_action(payload)

    def _dispatch_group_invitation_response_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_GROUP_PAYLOAD", "Payload groupe invalide.")
            return
        self._handle_group_invitation_response_action(payload)

    def _dispatch_group_kick_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_GROUP_PAYLOAD", "Payload groupe invalide.")
            return
        self._handle_group_kick_action(payload)

    def _dispatch_group_transfer_lead_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_GROUP_PAYLOAD", "Payload groupe invalide.")
            return
        self._handle_group_transfer_lead_action(payload)

    def _dispatch_group_leave_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_GROUP_PAYLOAD", "Payload groupe invalide.")
            return
        self._handle_group_leave_action(payload)

    def _dispatch_group_disband_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_GROUP_PAYLOAD", "Payload groupe invalide.")
            return
        self._handle_group_disband_action(payload)

    def _resolve_group_target_player(self, payload: Dict[str, Any]) -> tuple[Optional[Player], Optional[str]]:
        raw_target_id = payload.get("target_player_id")
        raw_target_name = str(payload.get("target_name") or "").strip()

        target_id = None
        try:
            if raw_target_id not in (None, ""):
                target_id = int(raw_target_id)
        except (TypeError, ValueError):
            target_id = None

        if target_id:
            player = Player.objects.filter(id=target_id, is_npc=False).first()
            if not player:
                return None, "TARGET_NOT_FOUND"
            return player, None

        if not raw_target_name:
            return None, "TARGET_REQUIRED"

        candidates = list(
            Player.objects.filter(name__iexact=raw_target_name, is_npc=False)
            .order_by("id")[:2]
        )
        if not candidates:
            return None, "TARGET_NOT_FOUND"
        if len(candidates) > 1:
            return None, "TARGET_AMBIGUOUS"
        return candidates[0], None

    def _send_group_action_feedback(self, reason: str, message: str, level: str = "info", **extra) -> None:
        payload = {
            "reason": reason,
            "message": message,
            "level": level,
        }
        payload.update(extra)
        self._send_response({
            "type": "group_action_feedback",
            "payload": payload,
        })

    def _emit_group_action_feedback_to_player(
        self,
        target_player_id: int,
        *,
        reason: str,
        message: str,
        level: str = "info",
        **extra,
    ) -> None:
        sector_id = (
            Player.objects
            .filter(id=target_player_id)
            .values_list("sector_id", flat=True)
            .first()
        )
        if not sector_id:
            return

        payload = {
            "reason": reason,
            "message": message,
            "level": level,
        }
        payload.update(extra)

        async_to_sync(self.channel_layer.group_send)(
            f"play_{int(sector_id)}",
            {
                "type": "group_action_feedback",
                "target_player_id": int(target_player_id),
                "payload": payload,
            },
        )

    def _group_member_player_ids(self, group_id: int) -> list[int]:
        return [
            int(pid)
            for pid in PlayerGroup.objects.filter(group_id=group_id)
            .order_by("created_at", "id")
            .values_list("player_id", flat=True)
        ]

    def _group_member_player_ids_for_player(self, player_id: Optional[int] = None) -> list[int]:
        target_player_id = player_id if player_id is not None else self.player_id
        try:
            target_player_id = int(target_player_id)
        except (TypeError, ValueError):
            return []

        group_id = (
            PlayerGroup.objects.filter(player_id=target_player_id)
            .order_by("created_at", "id")
            .values_list("group_id", flat=True)
            .first()
        )
        if not group_id:
            return []

        return self._group_member_player_ids(int(group_id))

    def _emit_group_state_sync_for_player_group(
        self,
        player_id: Optional[int] = None,
        *,
        reason: Optional[str] = None,
    ) -> None:
        member_ids = self._group_member_player_ids_for_player(player_id)
        if not member_ids:
            return
        self._emit_group_state_sync_to_player_ids(member_ids, reason=reason)

    def _emit_group_state_sync_to_player_ids(
        self,
        player_ids: list[int],
        *,
        reason: Optional[str] = None,
        notice: Optional[str] = None,
    ) -> None:
        unique_ids = []
        seen = set()
        for pid in player_ids:
            try:
                casted = int(pid)
            except (TypeError, ValueError):
                continue
            if casted in seen:
                continue
            seen.add(casted)
            unique_ids.append(casted)

        if not unique_ids:
            return

        sectors = {
            int(row["id"]): int(row["sector_id"])
            for row in Player.objects.filter(id__in=unique_ids, is_npc=False)
            .exclude(sector_id__isnull=True)
            .values("id", "sector_id")
        }

        for target_player_id in unique_ids:
            sector_id = sectors.get(target_player_id)
            if not sector_id:
                continue

            payload = build_group_state_for_player(target_player_id)
            async_to_sync(self.channel_layer.group_send)(
                f"play_{sector_id}",
                {
                    "type": "group_state_sync",
                    "target_player_id": target_player_id,
                    "payload": payload,
                    "reason": reason,
                    "notice": notice,
                },
            )

    def _emit_group_invitation(
        self,
        *,
        invitee_id: int,
        invitation_id: int,
        group_id: int,
        group_name: str,
        inviter_id: int,
        inviter_name: str,
    ) -> None:
        sector_id = (
            Player.objects
            .filter(id=invitee_id)
            .values_list("sector_id", flat=True)
            .first()
        )
        if not sector_id:
            return

        async_to_sync(self.channel_layer.group_send)(
            f"play_{int(sector_id)}",
            {
                "type": "group_invitation",
                "target_player_id": int(invitee_id),
                "payload": {
                    "id": int(invitation_id),
                    "group_id": int(group_id),
                    "group_name": str(group_name or "Unnamed Group"),
                    "inviter_id": int(inviter_id),
                    "inviter_name": str(inviter_name or "Unknown"),
                },
            },
        )

    def _handle_group_invite_action(self, payload: Dict[str, Any]) -> None:
        try:
            with transaction.atomic():
                sender = (
                    Player.objects.select_for_update()
                    .filter(id=self.player_id, is_npc=False)
                    .first()
                )
                if not sender:
                    self._send_group_action_feedback("PLAYER_NOT_FOUND", "Player not found.", "error")
                    return

                membership = (
                    PlayerGroup.objects.select_related("group")
                    .select_for_update()
                    .filter(player_id=sender.id)
                    .order_by("created_at", "id")
                    .first()
                )

                target_player, resolve_error = self._resolve_group_target_player(payload)
                if resolve_error:
                    if resolve_error == "TARGET_AMBIGUOUS":
                        self._send_group_action_feedback(
                            "TARGET_AMBIGUOUS",
                            "Multiple players share this name. Use autocomplete to select one.",
                            "error",
                        )
                    elif resolve_error == "TARGET_REQUIRED":
                        self._send_group_action_feedback("TARGET_REQUIRED", "Choose a target player.", "error")
                    else:
                        self._send_group_action_feedback("TARGET_NOT_FOUND", "Target player not found.", "error")
                    return

                if int(target_player.id) == int(sender.id):
                    self._send_group_action_feedback("INVALID_TARGET", "You cannot invite yourself.", "error")
                    return

                if PlayerGroup.objects.filter(player_id=target_player.id).exists():
                    self._send_group_action_feedback("TARGET_ALREADY_IN_GROUP", "This player is already in a group.", "error")
                    return

                if membership:
                    group = membership.group
                    if int(group.creator_id) != int(sender.id):
                        self._send_group_action_feedback("NOT_GROUP_LEADER", "Only the group leader can invite players.", "error")
                        return
                else:
                    raw_group_name = str(payload.get("group_name") or "").strip()
                    group_name = raw_group_name[:50] if raw_group_name else f"{sender.name}'s Group"
                    group = Group.objects.create(creator_id=sender.id, name=group_name)
                    PlayerGroup.objects.create(player_id=sender.id, group_id=group.id)

                current_member_count = (
                    PlayerGroup.objects.select_for_update()
                    .filter(group_id=group.id)
                    .count()
                )
                if int(current_member_count) >= int(self.GROUP_MAX_MEMBERS):
                    self._send_group_action_feedback(
                        "GROUP_FULL",
                        f"Group is full ({self.GROUP_MAX_MEMBERS} members max).",
                        "error",
                        max_members=int(self.GROUP_MAX_MEMBERS),
                    )
                    return

                if GroupInvitation.objects.filter(
                    group_id=group.id,
                    invitee_id=target_player.id,
                    status="PENDING",
                ).exists():
                    self._send_group_action_feedback("INVITATION_ALREADY_PENDING", "An invitation is already pending for this player.", "error")
                    return

                invite = GroupInvitation.objects.create(
                    group_id=group.id,
                    inviter_id=sender.id,
                    invitee_id=target_player.id,
                    status="PENDING",
                )

                member_ids = self._group_member_player_ids(group.id)
                member_ids.append(int(target_player.id))

                transaction.on_commit(
                    lambda: self._emit_group_state_sync_to_player_ids(
                        member_ids,
                        reason="GROUP_INVITE_SENT",
                    )
                )
                transaction.on_commit(
                    lambda: self._emit_group_invitation(
                        invitee_id=int(target_player.id),
                        invitation_id=int(invite.id),
                        group_id=int(group.id),
                        group_name=group.name,
                        inviter_id=int(sender.id),
                        inviter_name=sender.name,
                    )
                )

            self._send_group_action_feedback(
                "GROUP_INVITE_SENT",
                f"Invitation sent to {target_player.name}.",
                "success",
                invitation_id=int(invite.id),
                target_player_id=int(target_player.id),
            )
        except Exception:
            logger.exception("group invite failed")
            self._send_group_action_feedback("GROUP_INVITE_FAILED", "Unable to send group invitation.", "error")

    def _handle_group_invitation_response_action(self, payload: Dict[str, Any]) -> None:
        invitation_id = payload.get("invitation_id")
        accept = bool(payload.get("accept"))

        try:
            invitation_id = int(invitation_id)
        except (TypeError, ValueError):
            self._send_group_action_feedback("INVALID_INVITATION_ID", "Invalid invitation id.", "error")
            return

        try:
            with transaction.atomic():
                invite = (
                    GroupInvitation.objects.select_for_update()
                    .select_related("group", "inviter", "invitee")
                    .filter(id=invitation_id, invitee_id=self.player_id)
                    .first()
                )
                if not invite:
                    self._send_group_action_feedback("INVITATION_NOT_FOUND", "Invitation not found.", "error")
                    return

                if str(invite.status or "").upper() != "PENDING":
                    self._send_group_action_feedback("INVITATION_NOT_PENDING", "Invitation is no longer available.", "error")
                    return

                now = timezone.now()
                affected_player_ids = [int(invite.inviter_id), int(invite.invitee_id)]
                if accept:
                    if PlayerGroup.objects.filter(player_id=self.player_id).exists():
                        invite.status = "DECLINED"
                        invite.responded_at = now
                        invite.save(update_fields=["status", "responded_at", "updated_at"])
                        self._send_group_action_feedback("ALREADY_IN_GROUP", "You are already in a group.", "error")
                        return

                    group = (
                        Group.objects.select_for_update()
                        .filter(id=invite.group_id)
                        .first()
                    )
                    if not group:
                        invite.status = "EXPIRED"
                        invite.responded_at = now
                        invite.save(update_fields=["status", "responded_at", "updated_at"])
                        self._send_group_action_feedback("GROUP_NOT_FOUND", "The group no longer exists.", "error")
                        return

                    current_member_count = (
                        PlayerGroup.objects.select_for_update()
                        .filter(group_id=group.id)
                        .count()
                    )
                    if int(current_member_count) >= int(self.GROUP_MAX_MEMBERS):
                        invite.status = "EXPIRED"
                        invite.responded_at = now
                        invite.save(update_fields=["status", "responded_at", "updated_at"])
                        transaction.on_commit(
                            lambda: self._emit_group_action_feedback_to_player(
                                int(invite.inviter_id),
                                reason="GROUP_FULL",
                                message=f"Invitation to {invite.invitee.name} expired because the group is full.",
                                level="info",
                                max_members=int(self.GROUP_MAX_MEMBERS),
                            )
                        )
                        self._send_group_action_feedback(
                            "GROUP_FULL",
                            f"Group is full ({self.GROUP_MAX_MEMBERS} members max).",
                            "error",
                            max_members=int(self.GROUP_MAX_MEMBERS),
                        )
                        return

                    PlayerGroup.objects.get_or_create(
                        player_id=self.player_id,
                        group_id=group.id,
                    )
                    invite.status = "ACCEPTED"
                    invite.responded_at = now
                    invite.save(update_fields=["status", "responded_at", "updated_at"])

                    GroupInvitation.objects.filter(
                        invitee_id=self.player_id,
                        status="PENDING",
                    ).exclude(id=invite.id).update(
                        status="EXPIRED",
                        responded_at=now,
                    )

                    affected_player_ids = self._group_member_player_ids(group.id)
                    transaction.on_commit(
                        lambda: self._emit_group_action_feedback_to_player(
                            int(invite.inviter_id),
                            reason="INVITATION_ACCEPTED",
                            message=f"{invite.invitee.name} has joined the group.",
                            level="success",
                        )
                    )
                else:
                    invite.status = "DECLINED"
                    invite.responded_at = now
                    invite.save(update_fields=["status", "responded_at", "updated_at"])
                    transaction.on_commit(
                        lambda: self._emit_group_action_feedback_to_player(
                            int(invite.inviter_id),
                            reason="INVITATION_DECLINED",
                            message=f"{invite.invitee.name} declined the invitation.",
                            level="info",
                        )
                    )

                transaction.on_commit(
                    lambda: self._emit_group_state_sync_to_player_ids(
                        affected_player_ids,
                        reason="GROUP_INVITATION_RESPONSE",
                    )
                )

            if accept:
                self._send_group_action_feedback("INVITATION_ACCEPTED", "You joined the group.", "success")
            else:
                self._send_group_action_feedback("INVITATION_DECLINED", "Invitation declined.", "info")
        except Exception:
            logger.exception("group invitation response failed")
            self._send_group_action_feedback("GROUP_INVITATION_RESPONSE_FAILED", "Unable to process invitation response.", "error")

    def _handle_group_kick_action(self, payload: Dict[str, Any]) -> None:
        try:
            target_id = int(payload.get("target_player_id"))
        except (TypeError, ValueError):
            self._send_group_action_feedback("INVALID_TARGET", "Invalid target player.", "error")
            return

        try:
            with transaction.atomic():
                membership = (
                    PlayerGroup.objects.select_related("group")
                    .select_for_update()
                    .filter(player_id=self.player_id)
                    .order_by("created_at", "id")
                    .first()
                )
                if not membership:
                    self._send_group_action_feedback("NOT_IN_GROUP", "You are not in a group.", "error")
                    return

                group = membership.group
                if int(group.creator_id) != int(self.player_id):
                    self._send_group_action_feedback("NOT_GROUP_LEADER", "Only the group leader can remove players.", "error")
                    return

                if target_id == int(self.player_id):
                    self._send_group_action_feedback("INVALID_TARGET", "Use Leave Group to leave the group.", "error")
                    return

                target_link = (
                    PlayerGroup.objects.select_related("player")
                    .select_for_update()
                    .filter(group_id=group.id, player_id=target_id)
                    .first()
                )
                if not target_link:
                    self._send_group_action_feedback("TARGET_NOT_IN_GROUP", "Target player is not in your group.", "error")
                    return

                kicked_name = target_link.player.name
                target_link.delete()
                GroupInvitation.objects.filter(group_id=group.id, invitee_id=target_id, status="PENDING").update(
                    status="CANCELED",
                    responded_at=timezone.now(),
                )

                remaining_ids = self._group_member_player_ids(group.id)
                affected = list(remaining_ids) + [int(target_id)]
                transaction.on_commit(
                    lambda: self._emit_group_state_sync_to_player_ids(
                        affected,
                        reason="GROUP_MEMBER_REMOVED",
                    )
                )
                transaction.on_commit(
                    lambda: self._emit_group_action_feedback_to_player(
                        int(target_id),
                        reason="REMOVED_FROM_GROUP",
                        message="You were removed from the group.",
                        level="info",
                    )
                )

            self._send_group_action_feedback("GROUP_MEMBER_REMOVED", f"{kicked_name} removed from the group.", "success")
        except Exception:
            logger.exception("group kick failed")
            self._send_group_action_feedback("GROUP_KICK_FAILED", "Unable to remove player from group.", "error")

    def _handle_group_transfer_lead_action(self, payload: Dict[str, Any]) -> None:
        try:
            target_id = int(payload.get("target_player_id"))
        except (TypeError, ValueError):
            self._send_group_action_feedback("INVALID_TARGET", "Invalid target player.", "error")
            return

        try:
            with transaction.atomic():
                membership = (
                    PlayerGroup.objects.select_related("group")
                    .select_for_update()
                    .filter(player_id=self.player_id)
                    .order_by("created_at", "id")
                    .first()
                )
                if not membership:
                    self._send_group_action_feedback("NOT_IN_GROUP", "You are not in a group.", "error")
                    return

                group = (
                    Group.objects.select_for_update()
                    .filter(id=membership.group_id)
                    .first()
                )
                if not group:
                    self._send_group_action_feedback("GROUP_NOT_FOUND", "Group not found.", "error")
                    return
                if int(group.creator_id) != int(self.player_id):
                    self._send_group_action_feedback("NOT_GROUP_LEADER", "Only the group leader can transfer leadership.", "error")
                    return
                if target_id == int(self.player_id):
                    self._send_group_action_feedback("INVALID_TARGET", "You are already the group leader.", "error")
                    return

                target_member = (
                    PlayerGroup.objects.select_related("player")
                    .filter(group_id=group.id, player_id=target_id)
                    .first()
                )
                if not target_member:
                    self._send_group_action_feedback("TARGET_NOT_IN_GROUP", "Target player is not in your group.", "error")
                    return

                group.creator_id = int(target_id)
                group.save(update_fields=["creator", "updated_at"])

                member_ids = self._group_member_player_ids(group.id)
                transaction.on_commit(
                    lambda: self._emit_group_state_sync_to_player_ids(
                        member_ids,
                        reason="GROUP_LEAD_TRANSFERRED",
                    )
                )

            self._send_group_action_feedback(
                "GROUP_LEAD_TRANSFERRED",
                f"Group leadership transferred to {target_member.player.name}.",
                "success",
            )
        except Exception:
            logger.exception("group transfer lead failed")
            self._send_group_action_feedback("GROUP_TRANSFER_LEAD_FAILED", "Unable to transfer group leadership.", "error")

    def _handle_group_leave_action(self, payload: Dict[str, Any]) -> None:
        try:
            with transaction.atomic():
                membership = (
                    PlayerGroup.objects.select_related("group")
                    .select_for_update()
                    .filter(player_id=self.player_id)
                    .order_by("created_at", "id")
                    .first()
                )
                if not membership:
                    self._send_group_action_feedback("NOT_IN_GROUP", "You are not in a group.", "error")
                    return

                group = (
                    Group.objects.select_for_update()
                    .filter(id=membership.group_id)
                    .first()
                )
                if not group:
                    membership.delete()
                    self._send_group_action_feedback("GROUP_NOT_FOUND", "Group no longer exists.", "info")
                    return

                leaving_player_id = int(self.player_id)
                membership.delete()

                remaining_links = list(
                    PlayerGroup.objects.select_for_update()
                    .filter(group_id=group.id)
                    .order_by("created_at", "id")
                )

                if not remaining_links:
                    GroupInvitation.objects.filter(group_id=group.id, status="PENDING").update(
                        status="CANCELED",
                        responded_at=timezone.now(),
                    )
                    group.delete()
                    affected = [leaving_player_id]
                else:
                    if int(group.creator_id) == leaving_player_id:
                        new_leader_link = remaining_links[0]
                        group.creator_id = int(new_leader_link.player_id)
                        group.save(update_fields=["creator", "updated_at"])
                    affected = [leaving_player_id] + [int(link.player_id) for link in remaining_links]

                transaction.on_commit(
                    lambda: self._emit_group_state_sync_to_player_ids(
                        affected,
                        reason="GROUP_MEMBER_LEFT",
                    )
                )

            self._send_group_action_feedback("GROUP_LEFT", "You left the group.", "success")
        except Exception:
            logger.exception("group leave failed")
            self._send_group_action_feedback("GROUP_LEAVE_FAILED", "Unable to leave the group.", "error")

    def _handle_group_disband_action(self, payload: Dict[str, Any]) -> None:
        try:
            with transaction.atomic():
                membership = (
                    PlayerGroup.objects.select_related("group")
                    .select_for_update()
                    .filter(player_id=self.player_id)
                    .order_by("created_at", "id")
                    .first()
                )
                if not membership:
                    self._send_group_action_feedback("NOT_IN_GROUP", "You are not in a group.", "error")
                    return

                group = (
                    Group.objects.select_for_update()
                    .filter(id=membership.group_id)
                    .first()
                )
                if not group:
                    self._send_group_action_feedback("GROUP_NOT_FOUND", "Group no longer exists.", "info")
                    return
                if int(group.creator_id) != int(self.player_id):
                    self._send_group_action_feedback("NOT_GROUP_LEADER", "Only the group leader can disband the group.", "error")
                    return

                member_ids = self._group_member_player_ids(group.id)
                GroupInvitation.objects.filter(group_id=group.id, status="PENDING").update(
                    status="CANCELED",
                    responded_at=timezone.now(),
                )
                PlayerGroup.objects.filter(group_id=group.id).delete()
                group.delete()

                transaction.on_commit(
                    lambda: self._emit_group_state_sync_to_player_ids(
                        member_ids,
                        reason="GROUP_DISBANDED",
                    )
                )

            self._send_group_action_feedback("GROUP_DISBANDED", "Group disbanded.", "success")
        except Exception:
            logger.exception("group disband failed")
            self._send_group_action_feedback("GROUP_DISBAND_FAILED", "Unable to disband the group.", "error")

    def _dispatch_respawn_action_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            logger.error(f"Payload action_respawn invalide: {data}")
            return
        self._handle_respawn_action(payload)

    def _dispatch_wreck_loot_open_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_WRECK_LOOT_PAYLOAD", "Payload de loot invalide.")
            return
        self._handle_wreck_loot_open(payload)

    def _dispatch_wreck_loot_close_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_WRECK_LOOT_PAYLOAD", "Payload de loot invalide.")
            return
        self._handle_wreck_loot_close(payload)

    def _dispatch_wreck_loot_take_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if not isinstance(payload, dict):
            self._send_action_failed_response("INVALID_WRECK_LOOT_PAYLOAD", "Payload de loot invalide.")
            return
        self._handle_wreck_loot_take(payload)

    def async_reverse_ship(self, event: Dict[str, Any]) -> None:
        """Relaye l'etat final d'orientation du vaisseau aux clients."""
        try:
            message = event.get("message", {})
            if isinstance(message, str):
                message = json.loads(message)
            if not isinstance(message, dict):
                return

            player_id = message.get("player_id", message.get("player"))
            try:
                player_id = int(player_id)
            except (TypeError, ValueError):
                return

            payload = {"player_id": player_id}
            if "is_reversed" in message:
                payload["is_reversed"] = bool(message.get("is_reversed"))

            self._send_response({
                "type": "async_reverse_ship",
                "message": payload,
            })
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors de l'inversion du vaisseau: {e}")

    def _process_ship_reversal(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Traite une demande de flip envoyee par le joueur courant.
        Retourne l'evenement de diffusion a envoyer a toute la room.
        """
        requested_player_id = message.get("player_id", message.get("player"))
        if requested_player_id is not None:
            try:
                if int(requested_player_id) != int(self.player_id):
                    logger.warning(
                        "Flip refuse: demande d'un autre joueur (sender=%s target=%s)",
                        self.player_id,
                        requested_player_id,
                    )
                    return None
            except (TypeError, ValueError):
                logger.warning("Flip refuse: player_id invalide (%s)", requested_player_id)
                return None

        player_action = PlayerAction(self.user.id)
        if not player_action.set_reverse_ship_status():
            logger.warning(
                "Flip impossible: vaisseau courant introuvable (player_id=%s)",
                self.player_id,
            )
            return None

        new_orientation = player_action.get_reverse_ship_status()
        if new_orientation is None:
            logger.warning(
                "Flip impossible: orientation introuvable apres update (player_id=%s)",
                self.player_id,
            )
            return None

        self._cache_store.update_ship_is_reversed(
            player_id=self.player_id,
            is_reversed=bool(new_orientation),
        )

        return {
            "type": "async_reverse_ship",
            "message": {
                "player_id": int(self.player_id),
                "is_reversed": bool(new_orientation),
            },
        }

    def _extract_message_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "type": data["type"],
            "user": self.user.username,
            "message": data.get("message", data.get("payload")),
        }

    def _normalize_ws_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(response, dict):
            return response

        normalized = dict(response)
        has_message = "message" in normalized
        has_payload = "payload" in normalized

        if has_message and not has_payload:
            normalized["payload"] = normalized["message"]
        elif has_payload and not has_message:
            normalized["message"] = normalized["payload"]

        return normalized

    def _send_response(self, response: Dict[str, Any]) -> None:
        """Envoie une rÃ©ponse via WebSocket."""
        
        if response:
            try:
                self.send(text_data=json.dumps(self._normalize_ws_response(response)))
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de la rÃ©ponse: {e}")
    


