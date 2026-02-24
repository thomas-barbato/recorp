import json
import logging
from typing import Dict, Any, Optional
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache
from django.db import transaction
import datetime
from django.utils import timezone

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.backend.get_data import GetDataFromDB
from core.backend.action_rules import ActionRules

from core.models import SectorWarpZone, ScanIntelGroup, ScanIntel, PlayerShip, Npc, Module, PlayerShipModule, Player, ShipWreck, Ship, ArchetypeModule, NpcResource, NpcTemplateResource
from core.backend.modal_builder import (
    build_npc_modal_data,
    build_pc_modal_data,
    build_sector_element_modal_data,
)
from core.backend.player_logs import create_event_log

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
    WRECK_TTL_SECONDS = 12 * 60 * 60  # 12h (scavenge => disparition immédiate)
    """
    WebSocket consumer pour gérer les interactions en temps réel du jeu.
    Gère les mouvements des joueurs, les actions de jeu et la synchronisation.
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


    def connect(self) -> None:
        """Établit la connexion WebSocket et joint l'utilisateur au groupe de salle."""
        self._setup_room_connection()
        self._join_room_group()
        self._handle_authenticated_user()
    
        # Maintenir la session active
        if hasattr(self.scope, 'session'):
            self.scope['session'].save()
        

    def _setup_room_connection(self) -> None:
        """Configure les informations de connexion à la salle."""
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.room_group_name = f"play_{self.room}"
        self.user = self.scope["user"]
        self.player_id = PlayerAction(self.user.id).get_player_id()
        self._cache_store = StoreInCache(self.room_group_name, self.user)
        
        self.accept()

    def _join_room_group(self) -> None:
        """Joint l'utilisateur au groupe de salle."""
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name,
        )

    def _handle_authenticated_user(self) -> None:
        """Traite les utilisateurs authentifiés en initialisant le cache."""
        if self.user.is_authenticated:
            # store = StoreInCache(self.room_group_name, self.user)
            # store.get_or_set_cache(need_to_be_recreated=False)
            self._cache_store.get_or_set_cache(need_to_be_recreated=False)

    def disconnect(self, close_code: int) -> None:
        """Gère la déconnexion WebSocket de manière asynchrone."""
        try:
            # Nettoyer les ressources AVANT de quitter le groupe
            if hasattr(self, '_cache_store'):
                # Optionnel : retirer le joueur du cache si nécessaire
                # self._cache_store.cleanup()
                pass
            
            # Quitter le groupe de manière asynchrone
            self._leave_room_group()
            
            logger.info(f"WebSocket déconnecté proprement - Code: {close_code}, Joueur: {self.player_id}")
            
        except Exception as e:
            logger.error(f"Erreur lors de la déconnexion: {e}")
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
        """Rafraîchit la session Django pour éviter l'expiration."""
        if hasattr(self.scope, 'session'):
            # Forcer la mise à jour du timestamp de session
            self.scope['session'].modified = True
            self.scope['session'].save()

    def _handle_ping_with_validation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Gère le ping et vérifie si une synchronisation est nécessaire."""
        client_hash = data.get("client_data_hash")
        player_id = data.get("player_id", self.player_id)
        
        # Générer le hash côté serveur
        server_hash = self._generate_server_data_hash(player_id)
        
        sync_required = (client_hash != server_hash) if client_hash else False
        
        return {
            "type": "pong",
            "sync_required": sync_required
        }
        
    def _generate_server_data_hash(self, player_id: int) -> str:
        """Génère un hash des données critiques côté serveur."""
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
            logger.error(f"Erreur génération hash serveur: {e}")
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
        """Diffuse le message à tous les membres du groupe."""
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            message_data,
        )
        
    # méthode pour gérer les demandes de synchronisation
    def _handle_data_sync_request(self, data: Dict[str, Any]) -> None:
        """
        Gère les demandes de synchronisation des données client.
        
        Args:
            data: Données de la demande de synchronisation
        """
        try:
            # Parser les données de la demande
            request_data = json.loads(data.get("message", "{}"))
            player_id = request_data.get("player_id", self.player_id)
            sector_id = request_data.get("sector_id")
            
            # Construire la réponse de synchronisation
            sync_response = self._build_sync_response(player_id, sector_id)
            
            # Envoyer la réponse directement au client demandeur
            self._send_response({
                "type": "data_sync_response",
                "message": sync_response
            })
            
        except Exception as e:
            # Envoyer une réponse d'erreur
            self._send_response({
                "type": "data_sync_error",
                "message": {"error": "Erreur lors de la synchronisation des données"}
            })
            
    # construire la réponse de synchronisation
    def _build_sync_response(self, player_id: int, sector_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Construit la réponse de synchronisation avec toutes les données nécessaires.
        
        Args:
            player_id: ID du joueur demandant la synchronisation
            sector_id: ID du secteur (optionnel)
            
        Returns:
            Dict contenant toutes les données de synchronisation
        """
        try:
            # Récupérer ou reconstruire le cache si nécessaire
            self._cache_store.get_or_set_cache(need_to_be_recreated=False)
            
            # Construire les données de synchronisation
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
            logger.error(f"Erreur lors de la construction de la réponse de sync: {e}")
            return {"error": "Erreur lors de la construction des données"}

    # 4. MÉTHODES HELPER pour construire les données de synchronisation
    def _get_current_player_sync_data(self, player_id: int) -> Optional[Dict[str, Any]]:
        """Récupère les données du joueur actuel."""
        try:
            current_player_data = self._cache_store.get_current_player_data(player_id)
            return current_player_data[0] if current_player_data else None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du joueur actuel: {e}")
            return None

    def _get_other_players_sync_data(self, player_id: int) -> list[Dict[str, Any]]:
        """Récupère les données des autres joueurs."""
        try:
            players = self._cache_store.get_other_player_data(player_id) or []
            return [
                p for p in players
                if (p.get("ship", {}).get("status") != "DEAD")
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des autres joueurs: {e}")
            return []

    def _get_map_informations_sync_data(self) -> Dict[str, Any]:
        """Récupère les informations de la carte."""
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
            logger.error(f"Erreur lors de la récupération des informations de carte: {e}")
            return {}

    def _get_npcs_sync_data(self) -> list[Dict[str, Any]]:
        """Récupère les données des NPCs."""
        try:
            cached_data = cache.get(self.room_group_name)
            if not cached_data:
                return []
            return [
                n for n in (cached_data.get("npc", []) or [])
                if n.get("ship", {}).get("status") != "DEAD"
            ]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des NPCs: {e}")
            return []

    def _get_sector_elements_sync_data(self) -> list[Dict[str, Any]]:
        """Récupère les éléments du secteur."""
        try:
            cached_data = cache.get(self.room_group_name)
            return cached_data.get("sector_element", []) if cached_data else []
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des éléments du secteur: {e}")
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

    # 5. MÉTHODE UTILITAIRE pour valider les données avant envoi
    def _validate_sync_data(self, sync_data: Dict[str, Any]) -> bool:
        """
        Valide les données de synchronisation avant envoi.
        
        Args:
            sync_data: Données à valider
            
        Returns:
            True si les données sont valides, False sinon
        """
        required_keys = ["current_player", "other_players", "map_informations"]
        
        try:
            # Vérifier la présence des clés requises
            if not all(key in sync_data for key in required_keys):
                logger.warning("Clés manquantes dans les données de synchronisation")
                return False
            
            # Vérifier que current_player n'est pas None si on s'attend à ce qu'il existe
            if sync_data["current_player"] is None:
                logger.warning("current_player est None dans les données de synchronisation")
                # Ce n'est pas forcément une erreur, le joueur pourrait ne pas être dans ce secteur
            
            # Vérifier que other_players est une liste
            if not isinstance(sync_data["other_players"], list):
                logger.warning("other_players n'est pas une liste")
                return False
            
            # Vérifier que map_informations est un dictionnaire
            if not isinstance(sync_data["map_informations"], dict):
                logger.warning("map_informations n'est pas un dictionnaire")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation des données de sync: {e}")
            return False
        
    def async_send_chat_msg(self, event: dict) -> None:
        """
        Gère l'envoi d'un message de chat par un joueur.
        - Seul le consumer du joueur auteur crée et diffuse le message.
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
                logger.warning("async_send_chat_msg: données incomplètes")
                return

            # Seul le consumer du joueur auteur traite le message
            if author_id != self.player_id:
                return

            player_action = PlayerAction(self.user.id)

            # === Création du message selon le canal ===
            msg, recipients = player_action.create_chat_message(content, channel)

            if not msg:
                logger.warning(f"Échec création message chat ({channel})")
                return

            if not recipients:
                logger.info(f"Aucun destinataire trouvé pour le canal {channel}")
                return
            
            # Données auteur
            author_data = player_action.get_player_data()
            
            author_name = author_data.values_list("name", flat=True)[0]
            author_faction = author_data.values_list("faction_id__name", flat=True)[0]
            author_faction_color = GetDataFromDB().get_faction_badge_color_class(author_faction)
            content = msg.content
            timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
            
            # Préparer le message formaté
            formatted_message = {
                "author": author_name,
                "faction": author_faction,
                "faction_color": author_faction_color,
                "content": content,
                "channel": channel,
                "timestamp": timestamp
            }

            self._broadcast_chat_message(channel, recipients, formatted_message)
            # Réponse locale au joueur auteur (message immédiat)
            self._send_response({
                "type": "async_receive_chat_message",
                "message": formatted_message
            })

        except Exception as e:
            logger.exception(f"Erreur async_send_chat_msg: {e}")

    def _broadcast_chat_message(self, channel: str, recipients: list, formatted_message: dict):
        """
        Diffuse un message de chat à tous les destinataires valides.
        """
        try:
            # Grouper les destinataires par secteur pour optimiser
            recipients_by_sector = {}
            
            for recipient in recipients:
                recipient_id = recipient.get("id")
                recipient_sector = recipient.get("sector_id")

                # Ne pas renvoyer à l'auteur (il a déjà reçu le message localement)
                if recipient_id == self.player_id:
                    continue
                
                # Pour faction/groupe, le secteur peut être différent
                if not recipient_sector:
                    logger.warning(f"Destinataire {recipient_id} sans sector_id")
                    continue
                
                # Grouper par room
                room_key = f"play_{recipient_sector}"
                if room_key not in recipients_by_sector:
                    recipients_by_sector[room_key] = []
                recipients_by_sector[room_key].append(recipient_id)
            
            # ✅ Envoyer UNE SEULE FOIS par room (pas par destinataire)
            for room_key, recipient_ids in recipients_by_sector.items():
                async_to_sync(self.channel_layer.group_send)(
                    room_key,
                    {
                        "type": "async_receive_chat_message",
                        "message": formatted_message,
                        "target_recipients": recipient_ids,  # Liste des IDs concernés
                    },
                )

        except Exception as e:
            logger.exception(f"Erreur lors de la diffusion du message chat: {e}")


    def async_receive_chat_message(self, event: dict) -> None:
        """
        Reçoit un message de chat pour ce joueur (appelé par group_send).
        """
        try:
            data = event.get("message")
            target_recipients = event.get("target_recipients", [])
            
            if not data:
                return
            
            # ✅ Ne délivrer que si ce consumer correspond à un destinataire
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
        Handler appelé quand un client a demandé d'envoyer un MP et que le message
        a été group_send sur la room du consumer de l'auteur.
        Cette méthode doit être exécutée **seulement** par le consumer du joueur-auteur.
        """
        try:
            # Accept both dict and JSON-string messages (robuste)
            message = event.get("message")
            if isinstance(message, str):
                message = json.loads(message)

            sender_id = message.get("senderId")
            # On ne traite QUE si ce consumer représente l'auteur
            if sender_id != self.player_id:
                # ignorer: seul le consumer de l'auteur doit créer l'entrée DB + notifier
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
                recipient_data = []  # à implémenter si nécessaire
            else:
                logger.warning(f"async_send_mp: recipient_type inconnu: {recipient_type}")
                return

            # liste d'ids destinataires
            recipient_id_list = [e["id"] for e in (recipient_data or [])]

            # créer les MP en DB
            player_action.create_new_mp(recipient_id_list, mp_subject, mp_body)

            # notifier l'auteur que l'envoi est ok
            self._send_response({
                "type": "async_sent_mp",
                "message": {"id": sender_id}
            })

            # notifier les destinataires (rooms éventuellement différentes)
            self._notify_msg(recipient_data, sender_id)

        except json.JSONDecodeError as e:
            logger.error(f"async_send_mp JSON error: {e}")
        except Exception as e:
            logger.exception(f"async_send_mp unexpected error: {e}")
            
            
    def async_receive_mp(self, event: Dict[str, Any]) -> None:
        """
        Handler exécuté par les consumers des rooms cibles.
        Il ne doit délivrer la notif que si ce consumer correspond au destinataire.
        """
        try:
            message = event.get("message")
            if isinstance(message, str):
                message = json.loads(message)

            recipient_id = message.get("recipient_id")

            # Si ce consumer n'est pas le destinataire, on ignore
            if recipient_id != self.player_id:
                return

            # Envoi au client final (websocket) : type et message à adapter côté front
            self._send_response({
                "type": "async_receive_mp",
                "message": {
                    "recipient_id": recipient_id,
                    "note": "Vous avez reçu un message privé"
                }
            })

        except Exception as e:
            logger.exception(f"async_receive_mp error: {e}")

    def async_recieve_mp(self, event: Dict[str, Any]) -> None:
        """
        Alias rétro-compatible (typo historique).
        Channels mappe `type` -> nom de méthode; on délègue vers le nom canonique.
        """
        self.async_receive_mp(event)
            
            
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

                # Toujours envoyer un dict (éviter la sérialisation incohérente)
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
            # Étape 1 : validation complète
            if not self._validate_move_request(message):
                return  # ne rien broadcaster si invalide

            # Étape 2 : enregistrement du mouvement (DB + cache)
            player_action = PlayerAction(self.user.id)

            registered = player_action.move_have_been_registered(
                coordinates=f"{message['end_y']}_{message['end_x']}",
                move_cost=int(message["move_cost"]),
                player_id=message["player"],
            )

            if not registered:
                self._send_error_response("Impossible d'enregistrer le mouvement")
                return

            # Mise à jour du cache
            self._cache_store.update_player_range_finding()
            self._cache_store.update_sector_player_visibility_zone(self.player_id)

            # Étape 3 : broadcast à tout le monde
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "async_move",
                    "message": message
                }
            )

        except Exception as e:
            logger.error(f"Erreur _handle_move_request: {e}")

    def _validate_move_request(self, message: Dict[str, Any]) -> bool:
        """
        Valide la demande de mouvement (appelé UNE SEULE FOIS).
        Retourne True si le mouvement est valide, False sinon.
        """
        try:
            # 1. Vérification identité joueur
            if message["player"] != self.player_id:
                self._send_error_response("Vous ne pouvez pas déplacer un autre joueur")
                return False
            
            player_action = PlayerAction(self.user.id)

            # 2. Vérifier PM restants
            if not player_action.check_if_player_get_movement_remaining(message['move_cost']):
                self._send_error_response("Points de mouvement insuffisants")
                return False

            # 3. Vérifier taille du vaisseau
            size_data = player_action.get_player_ship_size()
            if not size_data or "ship_id__ship_category_id__size" not in size_data:
                logger.error(f"Vaisseau introuvable ou non initialisé pour joueur {self.player_id}")
                self._send_error_response("Vaisseau introuvable")
                return False
            
            ship_size = size_data["ship_id__ship_category_id__size"]

            # 4. Vérifier destination
            target_cells = player_action._calculate_item_occupied_coords(
                {"x": message["end_x"], "y": message["end_y"]},
                ship_size
            )

            formatted = [f"{c['y']}_{c['x']}" for c in target_cells]
            if player_action.destination_already_occupied(formatted):
                self._send_error_response("Destination occupée")
                return False

            return True
        
        except Exception as e:
            logger.error(f"Erreur validation mouvement: {e}")
            self._send_error_response("Erreur de validation")
            return False


    def _send_error_response(self, error_message: str) -> None:
        return
        """Envoie une réponse d'erreur au client."""
        """
        self._send_response({
            "type": "move_error",
            "message": {"error": error_message}
        })"""
            

    def async_move(self, event: Dict[str, Any]) -> None:
        """
        Tous les autres consumers reçoivent la mise à jour.
        Ici : aucune validation, aucun enregistrement DB.
        Juste mise à jour du cache local + réponse client.
        """
        try:
            message = event["message"]
            player_action = PlayerAction(self.user.id)

            # Mise à jour du cache
            self._cache_store.update_player_position(message, self.player_id)
            self._cache_store.update_player_range_finding()
            movement_remaining = player_action.get_player_movement_remaining()
            movement_max = int(player_action.get_playerShip().values_list('max_movement', flat=True)[0])
            # Préparer la réponse pour CE joueur
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
        """Vérifie si le mouvement concerne le joueur actuel."""
        return player_id == message["player"]

    def _can_move_to_destination(self, player_action: PlayerAction, message: Dict[str, Any]) -> bool:
        """Vérifie si la destination est libre."""
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
        Réponse envoyée AU JOUEUR QUI BOUGE.
        On renvoie:
            - les infos attendues par le front pour animer le déplacement:
            end_x, end_y, move_cost, move, path, max_move, is_reversed, size
            - les infos supplémentaires pour mettre à jour map_informations / UI :
            modules_range, visible_zone, view_range, sector, updated_*_player_data
        """

        player_id = message["player"]

        # PM restants du joueur courant (après mouvement)
        movement_remaining = player_action.get_player_movement_remaining()
        max_movement = store.get_specific_player_data(
            player_id, "pc", "ship", "max_movement"
        )

        # Modules en portée + zones visibles + view_range
        modules_range = store.get_specific_player_data(
            player_id, "pc", "ship", "modules_range"
        )
        visible_zone = store.get_specific_player_data(
            player_id, "pc", "ship", "visible_zone"
        )
        view_range = store.get_specific_player_data(
            player_id, "pc", "ship", "view_range"
        )

        # Données complètes pour refresh UI / modals
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
                # PM restants après mouvement (ce que ton front appelle souvent "move")
                "move": movement_remaining,
                # chemin complet utilisé pour l’animation case par case
                "path": message.get("path", []),
                "max_move": max_movement,
                "is_reversed": message["is_reversed"],
                "size": {
                    "x": message["size_x"],
                    "y": message["size_y"],
                },

                # --- Infos gameplay complémentaires ---
                "modules_range": modules_range,
                "visible_zone": visible_zone,
                "view_range": view_range,

                # --- Pour éventuellement rafraîchir map_informations côté client ---
                "updated_current_player_data": updated_current_player_data,
                "updated_other_player_data": updated_other_player_data,
                "sector": sector_data,

                # Optionnel : si tu veux garder trace de la zone de départ complète
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
        """Gère le mouvement d'un autre joueur."""
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

    def async_reverse_ship(self, event: Dict[str, Any]) -> None:
        """
        Gère l'inversion asynchrone du vaisseau.
        
        Args:
            event: Événement contenant les données d'inversion
        """
        try:
            message = json.loads(event["message"])
            response = self._process_ship_reversal(message)
            self._send_response(response)
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors de l'inversion du vaisseau: {e}")

    def _process_ship_reversal(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Traite l'inversion du vaisseau."""
        # store = StoreInCache(room_name=self.room_group_name, user_calling=self.user)
        player_action = PlayerAction(self.user.id)
        player_action.set_reverse_ship_status()
        data = self._cache_store.update_ship_is_reversed(
            message, message["player"], player_action.get_reverse_ship_status()
        )

        return {
            "type": "async_reverse_ship",
            "message": {
                "id_array": message["id_array"],
                "is_reversed": data[0],
                "player_id": data[1],
            },
        }

    def async_warp_travel(self, event: Dict[str, Any]) -> None:
        """
        Gère le voyage par distorsion asynchrone.

        - Retire le joueur du secteur courant (visuel + cache)
        - Calcule la destination
        - Met à jour la DB
        - Met à jour les caches (ancien + nouveau secteur)
        - Notifie :
            * les joueurs de l'ancien secteur -> async_remove_ship
            * les joueurs du nouveau secteur -> async_user_join
            * le joueur lui-même        -> async_warp_complete
        """
        try:
            raw = event.get("message")
            if isinstance(raw, str):
                warp_data = json.loads(raw)
            else:
                warp_data = raw

            # --- Vérifications ---
            if not warp_data:
                logger.error("async_warp_travel: warp_data manquant")
                return

            player_id = warp_data.get("player_id")
            sectorwarpzone_id = warp_data.get("sectorwarpzone_id")
            current_sector_id = warp_data.get("current_sector_id")

            if not player_id or not sectorwarpzone_id or not current_sector_id:
                logger.error(f"async_warp_travel: données incomplètes {warp_data}")
                return

            # --- Si ce consumer n’est PAS le joueur concerné → sortir ---
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
                # déplacement impossible → prévenir joueur
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

            old_sector_id = current_sector_id  # déjà présent dans warp_data

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
            # 3) Mise à jour DB
            # =======================
            ok = pa.set_player_sector(destination_sector_id, dest_coord)
            if not ok:
                logger.error(
                    f"async_warp_travel: échec update DB pour player {player_id}"
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
            # 5) Mise à jour du cache du NOUVEAU secteur
            # =======================
            new_room_key = f"play_{destination_sector_id}"

            dest_cache = StoreInCache(new_room_key, self.user)
            # Forcer la recréation pour intégrer le joueur avec ses nouvelles coords
            dest_cache.get_or_set_cache(need_to_be_recreated=True)

            # Mettre à jour portée + visibilité dans ce nouveau secteur
            dest_cache.update_player_range_finding()
            dest_cache.update_sector_player_visibility_zone(player_id)

            # Récupérer les données prêtes à envoyer au front
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
            # 7) Notifier le joueur qui a warpé
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
        Méthode appelée automatiquement par WebSocketConsumer lorsque
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
        Un joueur quitte le secteur (warp ou déconnexion).
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

        # 1) Vérifier PA
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
        
        # 3) Construire les vraies données
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
        
        # 4) Répondre AU JOUEUR uniquement
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
        
        group = GetDataFromDB.get_group_member(player_id)
        if not group:
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "NOT_IN_GROUP"
                },
                
            })
            return

        if not player_action.consume_ap(1):
            self._send_response({
                "type": "action_failed",
                "message": {
                    "reason": "NOT_ENOUGH_AP"
                },
                
            })
            return
        
        sector_id_int = int(self.room)
        scan = GetDataFromDB.get_scan_target(player_id, sector_id_int)
        
        ScanIntelGroup.objects.get_or_create(
            scan=scan['id'],
            group=group
        )
            
        player_ids = GetDataFromDB.get_players_in_group(group)
            
        for pid in player_ids:
            if pid == self.player_id:
                continue
            
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "scan_share_to_group",
                    "message": {
                        "target_key": f"{target_type}_{target_id}",
                        "expires_at": scan["expires_at"].isoformat() if isinstance(scan, dict) else None,
                        "recipients": player_ids,
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
        Gère l'arrivée d'un utilisateur dans la salle.
        
        Args:
            event: Événement contenant les données d'arrivée
        """
        response = {
            "type": "async_user_join",
            "message": event["message"],
        }
        self._send_response(response)

    def effects_invalidated(self, event):
        """
        Reçoit l'invalidation d'effets (scan, buff, debuff…)
        """
        self._send_response({
            "type": "effects_invalidated",
            "payload": event.get("payload", []),
        })
        
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
        Envoie des logs temps réel en respectant EXACTEMENT
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
        self._send_response({
            "type": "event_log",
            "message": event['data']
        })

    def entity_state_update(self, event):
        """
        Reçoit une mise à jour d'état d'une entité (PC / NPC)
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
        Point d'entrée WS pour une attaque.
        Cette méthode orchestre le pipeline combat + les side-effects temps réel
        (patchs d'état, mort, carcasse, logs, événements d'animation).
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
            # Résolution attaquant
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
            # Résolution cible
            # -----------------------
            target_type, target_id = target_key.split("_")

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
            # être attaquée
            if target_ad.get_hp() <= 0:
                return

            # -----------------------
            # Module weaponry
            # -----------------------
            
            psm = source_ship.player_ship_module.select_related("module").filter(
                module_id=module_id
            ).first()

            if not psm:
                raise ValueError(f"Module {module_id} non équipé sur ce vaisseau")

            module = psm.module
            effect = module.effect or {}

            damage_type = effect.get("damage_type", "MISSILE").upper()

            weapon = WeaponProfile(
                damage_type=damage_type,
                min_damage=int(effect.get("min_damage", 1)),
                max_damage=int(effect.get("max_damage", 1)),
                range_tiles=int(effect.get("range", 1)),
            )

            # -----------------------
            # Distance / visibilité
            # (le front fait déjà le visuel,
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

            # Enrichit les events de combat (noms + dégâts appliqués) pour simplifier
            # le rendu front (modal combat / logs) sans recalcul local.
            self._annotate_combat_events(events, source_ad=source_ad, target_ad=target_ad)

            # Prépare les futures mécaniques (assist / XP / réputation) en mémorisant
            # qui a contribué sur cette cible avant même qu'elle ne meure.
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
            # On accumule d'abord les morts détectées puis on broadcast après la boucle,
            # pour éviter de mélanger la détection de kills avec l'itération sur les hits.
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
                # afin d'éviter qu'un second event (ou double traitement) réutilise ces contributions.
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
            # Si riposte tentée → envoyer AP cible
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
            # 4️⃣ Broadcast combat events
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
                effect = psm.effect or {}
                weapons.append(
                    WeaponProfile(
                        damage_type=effect.get("damage_type", "MISSILE").upper(),
                        min_damage=int(effect.get("min_damage", 1)),
                        max_damage=int(effect.get("max_damage", 1)),
                        range_tiles=int(effect.get("range", 1)),
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
                effect = psm.effect or {}
                weapons.append(
                    WeaponProfile(
                        damage_type=effect.get("damage_type", "MISSILE").upper(),
                        min_damage=int(effect.get("min_damage", 1)),
                        max_damage=int(effect.get("max_damage", 1)),
                        range_tiles=int(effect.get("range", 1)),
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
        Ajoute des champs de confort pour le front (noms, dégâts appliqués).
        Le backend garde l'autorité; on évite juste de faire deviner le texte au client.
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
        Rôles de logs de combat:
        - TRANSMITTER = initiateur (s'il est PC)
        - RECEIVER = cible initiale (si elle est PC)
        - OBSERVER = tous les autres joueurs présents dans le secteur
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
        Log temps réel détaillé pour chaque ATTACK_* (attaque + riposte), avec rôles:
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
                adapter.actor.save(update_fields=["status"])
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
                    # Référence stable pour purger le vieux PlayerShip quand la carcasse expire.
                    "source_player_ship_id": player_ship.id if dead_ad.kind == "PC" else None,
                    "source_npc_id": npc_obj.id if dead_ad.kind == "NPC" else None,
                },
            )

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
        - bind non implémenté -> fallback sector_id = DEFAULT_RESPAWN_SECTOR_ID
        - vaisseau gratuit = Ship.id = 1
        - placement via même algo que le warp (cases libres + tailles)
        - async_warp_complete réutilisé côté front pour reload/reconnect
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
        current_thermal_defense = int(free_ship.default_thermal_defense or 0)
        current_missile_defense = int(free_ship.default_missile_defense or 0)
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

        # Pour que le joueur réapparaisse aussi dans le cache secteur actuel (qui se base encore sur PlayerShipModule),
        # on réattache les modules d'archétype au vaisseau gratuit (solution transitoire cohérente avec le système actuel).
        # Compatibilité transitoire avec le cache de secteur actuel:
        # un PC sans PlayerShipModule risque de "disparaître" du cache/reload.
        for am in archetype_modules:
            mod = am.module
            if not mod:
                continue
            effect = mod.effect or {}
            mtype = str(mod.type or "")
            if "DEFENSE" in mtype:
                if "BALLISTIC" in mtype:
                    current_ballistic_defense += int(effect.get("defense", 0) or 0)
                elif "THERMAL" in mtype:
                    current_thermal_defense += int(effect.get("defense", 0) or 0)
                elif "MISSILE" in mtype:
                    current_missile_defense += int(effect.get("defense", 0) or 0)
            elif "MOVEMENT" in mtype:
                current_movement += int(effect.get("movement", 0) or 0)
            elif "HULL" in mtype:
                current_hp += int(effect.get("hp", 0) or 0)
            elif "HOLD" in mtype:
                current_cargo_size += int(effect.get("capacity", 0) or 0)

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
                    current_thermal_defense=current_thermal_defense,
                    max_thermal_defense=current_thermal_defense,
                    current_missile_defense=current_missile_defense,
                    max_missile_defense=current_missile_defense,
                    current_cargo_size=current_cargo_size,
                )

                for am in archetype_modules:
                    if am.module_id:
                        PlayerShipModule.objects.create(player_ship=new_ship, module_id=am.module_id)

                # AP volontairement inchangé (règle validée)
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

        # Tous les joueurs du secteur d'arrivée doivent voir apparaître le joueur.
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

        # Recycle le flux warp_complete côté front pour recharger proprement la page.
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

    # Sprint 1 override block: split receive dispatch + WS envelope normalization.
    def receive(self, text_data=None, bytes_data=None):
        self._invalidate_expired_scans_safe()
        self._invalidate_expired_wrecks_safe()
        self._respawn_dead_npcs_safe()

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
        # Expiration lazy côté backend (pas de scheduler dédié pour l'instant).
        # Le front gère la disparition visuelle exacte via timer local.
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
        Le front consomme déjà `npc_added`.
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
                npc.missile_defense = int(tpl.max_missile_defense or 0)
                npc.thermal_defense = int(tpl.max_thermal_defense or 0)
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
        3) fallback sur l'algo générique actuel (zone warp + padding)
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

                    # On retire le NPC en cours de respawn des cases occupées pour ne pas se bloquer lui-même.
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

            # Fallback (comportement actuel): placement générique basé sur warpzone.
            generic = pa._calculate_destination_coord(
                sector_id,
                ship_size_x,
                ship_size_y,
                padding_h,
                padding_w,
            )
            if not generic:
                return None

            # Le fallback historique ne connaît pas les carcasses. On vérifie donc
            # explicitement que la case proposée n'est pas occupée par un wreck actif.
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
        Ajoute les cases occupées par les carcasses actives à une liste de coordonnées occupées.
        Empêche notamment un NPC de respawn directement dans sa propre épave.
        """
        try:
            coords = list(occupied_coords or [])
            wrecks = (
                ShipWreck.objects
                .filter(sector_id=sector_id, status="ACTIVE")
                .values("coordinates", "size")
            )
            for w in wrecks:
                wc = w.get("coordinates") or {}
                ws = w.get("size") or {"x": 1, "y": 1}
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
        Recherche simple "au plus proche" autour du spawn préféré (Manhattan puis ordre stable).
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
        La suppression de PlayerShip déclenche la cascade Django sur:
        - PlayerShipModule
        - PlayerShipResource
        """
        try:
            with transaction.atomic():
                # Verrouille la carcasse pour éviter un double cleanup concurrent.
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

                # Fallback compat pour les vieilles carcasses créées avant l'ajout du metadata id.
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

                # La carcasse n'est plus utile après expiration: suppression DB.
                # Suppression backend réelle (la disparition visuelle front arrive via ws/local timer).
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
            "async_chat_message": self._dispatch_chat_message,
            "async_send_mp": self._dispatch_private_message,
            "action_scan_pc_npc": self._dispatch_scan_action_message,
            "share_scan": self._dispatch_share_scan_message,
            "action_attack": self._dispatch_combat_action_message,
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

    def _dispatch_respawn_action_message(self, data: Dict[str, Any]) -> None:
        payload = self._get_client_payload(data)
        if payload is None:
            payload = {}
        if not isinstance(payload, dict):
            logger.error(f"Payload action_respawn invalide: {data}")
            return
        self._handle_respawn_action(payload)

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
        """Envoie une réponse via WebSocket."""
        
        if response:
            try:
                self.send(text_data=json.dumps(self._normalize_ws_response(response)))
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de la réponse: {e}")
    

