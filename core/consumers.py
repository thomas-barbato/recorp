import json
import logging
from typing import Dict, Any, Optional
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache
import datetime
from django.utils import timezone

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.backend.get_data import GetDataFromDB
from core.backend.action_rules import ActionRules

from core.models import SectorWarpZone, ScanIntelGroup, ScanIntel
from core.backend.modal_builder import build_npc_modal_data, build_pc_modal_data
from core.backend.player_logs import create_event_log

logger = logging.getLogger("django")

class GameConsumer(WebsocketConsumer):
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

    def receive(self, text_data=None, bytes_data=None):
        """
        Réception sécurisée des messages WebSocket
        """
        # 0) Vérifie tous les timers
        try:
            expired_targets = ActionRules.invalidate_expired_scans(int(self.room))

            if expired_targets:
                
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
                
            # 1) Rien à traiter
            if not text_data:
                return

        # 2) L'utilisateur doit être authentifié
        if not self.user.is_authenticated:
            return

        # 3) Essayer de parser le JSON
        try:
            data = json.loads(text_data)
        except Exception:
            # Ce n'est pas un JSON → ignorer (ex: ping navigateur)
            return

        # 4) S'assurer que c'est un dict JSON
        if not isinstance(data, dict):
            return
        msg_type = data.get("type")
        if not msg_type:
            return
        

        # 5) Rafraîchir la session
        self._refresh_session()

        # ------------------------------
        # TRAITEMENT DES TYPES
        # ------------------------------
        # PING (client)
        if msg_type == "ping":
            response = self._handle_ping_with_validation(data)
            self._send_response(response)
            return

        # SYNC
        if msg_type == "request_data_sync":
            self._handle_data_sync_request(data)
            return
        
        if msg_type == "request_scan_state_sync":
            self.send_scan_state_sync()
            return

        # MOVE
        if msg_type == "async_move":
            payload = data.get("payload")
            if not isinstance(payload, dict):
                logger.error(f"Payload async_move invalide: {data}")
                return
            self._handle_move_request(payload)
            return

        # CHAT
        if msg_type == "async_chat_message":
            self.async_send_chat_msg(data)
            return
        
        # PRIVATE MESSAGE
        if msg_type == "async_send_mp":
            self.async_send_mp(data)
            return
        
        # SCAN (PC / NPC)
        if msg_type == "action_scan_pc_npc":
            self._handle_scan_action_pc_npc(data.get("payload"))
            return
        
        # SHARE SCAN WITH GROUP (PC / NPC) (if scan success)
        if msg_type == "share_scan":
            self._handle_share_scan(data.get("payload"))
            return

        # MESSAGE GÉNÉRIQUE
        try:
            message_data = self._extract_message_data(data)
            self._broadcast_message(message_data)
        except Exception as e:
            logger.error(f"Erreur traitement message générique: {e}")



    def _is_valid_request(self, text_data: Optional[str]) -> bool:
        """Vérifie si la requête est valide."""
        return text_data is not None and self.user.is_authenticated
    
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

    def _extract_message_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrait les données du message."""
        return {
            "type": data["type"],
            "user": self.user.username,
            "message": data["message"],
        }

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
            return self._cache_store.get_other_player_data(player_id) or []
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
                "pc": cached_data.get("pc", []),
                "npc": cached_data.get("npc", []),
                "sector_element": cached_data.get("sector_element", []),
                "messages": cached_data.get("messages", [])
            }
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des informations de carte: {e}")
            return {}

    def _get_npcs_sync_data(self) -> list[Dict[str, Any]]:
        """Récupère les données des NPCs."""
        try:
            cached_data = cache.get(self.room_group_name)
            return cached_data.get("npc", []) if cached_data else []
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
            
            
    def async_recieve_mp(self, event: Dict[str, Any]) -> None:
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
                "type": "async_recieve_mp",
                "message": {
                    "recipient_id": recipient_id,
                    "note": "Vous avez reçu un message privé"
                }
            })

        except Exception as e:
            logger.exception(f"async_recieve_mp error: {e}")
            
            
    def _notify_msg(self, recipient_data, sender_id) -> None:
        """
        Envoie une notification de type 'async_recieve_mp' dans la room de
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
                        "type": "async_recieve_mp",   # garder la même orthographe si front attend ça
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
            # Préparer la réponse pour CE joueur
            response = {
                "type": "player_move",
                "message": {
                    "player_id": message["player"],
                    "end_x": message["end_x"],
                    "end_y": message["end_y"],
                    "move_cost": message["move_cost"],
                    "move": player_action.get_player_movement_remaining(),
                    "path": message["path"],
                    "max_move": int(player_action.get_playerShip().values_list('max_movement', flat=True)[0]),
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
            * les joueurs de l’ancien secteur -> async_remove_ship
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
            receiver_playerObj = player.get_other_player_data(data['user']['player'])
            receiver_instance = receiver_playerObj.first()
            target_name = receiver_instance.name
            players_roles = [
                (transmitter_instance, "TRANSMITTER"), 
                (receiver_instance, "RECEIVER")
            ]
            
        else:
            data = build_npc_modal_data(target_id)
            target_name = data['npc']['displayed_name']
            players_roles = [(transmitter_instance, "TRANSMITTER")]
        
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

        for scan in scans:
            if scan.target_type == "pc":
                data = build_pc_modal_data(scan.target_id)
            else:
                data = build_npc_modal_data(scan.target_id)

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
        # 🔐 filtre CRUCIAL
        if event.get("target_player_id") != self.player_id:
            return
        self._send_response({
            "type": "event_log",
            "message": event['data']
        })

    def _send_response(self, response: Dict[str, Any]) -> None:
        """Envoie une réponse via WebSocket."""
        
        if response:
            try:
                self.send(text_data=json.dumps(response))
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de la réponse: {e}")
    