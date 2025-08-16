import json
import logging
from typing import Dict, Any, Optional
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.backend.get_data import GetDataFromDB

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

    def connect(self) -> None:
        """Établit la connexion WebSocket et joint l'utilisateur au groupe de salle."""
        self._setup_room_connection()
        self._join_room_group()
        self._handle_authenticated_user()

    def _setup_room_connection(self) -> None:
        """Configure les informations de connexion à la salle."""
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.room_group_name = f"play_{self.room}"
        self.user = self.scope["user"]
        self.player_id = PlayerAction(self.user.id).get_player_id()
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
            store = StoreInCache(self.room_group_name, self.user)
            store.get_or_set_cache(need_to_be_recreated=False)

    def disconnect(self, close_code: int) -> None:
        """Gère la déconnexion WebSocket."""
        self._leave_room_group()
        self.close()

    def _leave_room_group(self) -> None:
        """Retire l'utilisateur du groupe de salle."""
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name,
        )

    def receive(self, text_data: Optional[str] = None, bytes_data: Optional[bytes] = None) -> None:
        """
        Reçoit et traite les messages WebSocket.
        
        Args:
            text_data: Données texte reçues
            bytes_data: Données binaires reçues
        """
        if not self._is_valid_request(text_data):
            return

        try:
            data = json.loads(text_data)
            message_data = self._extract_message_data(data)
            self._broadcast_message(message_data)
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors du traitement du message: {e}")

    def _is_valid_request(self, text_data: Optional[str]) -> bool:
        """Vérifie si la requête est valide."""
        return text_data is not None and self.user.is_authenticated

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

    def async_move(self, event: Dict[str, Any]) -> None:
        try:
            message = json.loads(event["message"])
            player_action = PlayerAction(self.user.id)
            store = StoreInCache(room_name=self.room_group_name, user_calling=self.user)
            
            # Traiter le mouvement
            if self._can_move_to_destination(player_action, message):
                if self._register_move(player_action, message):
                    store.update_player_position(message)
                    # Toujours mettre à jour la portée du joueur connecté
                    store.update_player_range_finding()
                    
                    # Préparer la réponse selon le type de mouvement
                    if self._is_own_player_move(self.player_id, message):
                        # Le joueur connecté a bougé
                        store.update_sector_player_visibility_zone(self.player_id)
                        response = self._create_own_move_response(player_action, store, message, self.player_id)
                    else:
                        # Un autre joueur a bougé
                        response = self._handle_other_player_move(message, player_action, store, self.player_id)
                    
                    # Envoyer la réponse personnalisée au joueur connecté
                    self._send_response(response)
                
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors du traitement du mouvement: {e}")

    def _is_own_player_move(self, player_id: int, message: Dict[str, Any]) -> bool:
        """Vérifie si le mouvement concerne le joueur actuel."""
        return player_id == message["player"]

    def _can_move_to_destination(self, player_action: PlayerAction, message: Dict[str, Any]) -> bool:
        """Vérifie si la destination est libre."""
        return not player_action.destination_already_occupied(
            message['destination_id_array']
        )

    def _register_move(self, player_action: PlayerAction, message: Dict[str, Any]) -> bool:
        """Enregistre le mouvement du joueur."""
        return player_action.move_have_been_registered(
            coordinates=message['destination_id_array'][0],
            move_cost=int(message["move_cost"]),
            player_id=message["player"]
        )

    def _create_own_move_response(
        self, 
        player_action: PlayerAction, 
        store: StoreInCache, 
        message: Dict[str, Any], 
        player_id: int
    ) -> Dict[str, Any]:
        """Crée la réponse pour le mouvement du propre joueur."""
        return {
            "type": "player_move",
            "message": {
                "player_id": message["player"],
                "start_id_array": message["start_id_array"],
                "updated_other_player_data": store.get_other_player_data(self.player_id),
                "updated_current_player_data": store.get_current_player_data(self.player_id),
                "is_reversed": message["is_reversed"],
                "sector": store.get_sector_data(),
                "move_cost": message["move_cost"],
                "modules_range": store.get_specific_player_data(
                    player_id, "pc", "ship", "modules_range"
                ),
                "visible_zone": store.get_specific_player_data(
                    message["player"], "pc", "ship", "visible_zone"
                ),
                "view_range": store.get_specific_player_data(
                    message["player"], "pc", "ship", "view_range" 
                ),
                "size": {"x" : message["size_x"], "y" : message["size_y"]},
                
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
        store = StoreInCache(room_name=self.room_group_name, user_calling=self.user)
        player_action = PlayerAction(self.user.id)
        player_action.set_reverse_ship_status()
        data = store.update_ship_is_reversed(
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
        
        Args:
            event: Événement contenant les données de voyage
        """
        try:
            warp_data = json.loads(event["message"])["data"]
            self._process_warp_travel(warp_data)
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors du voyage par distorsion: {e}")

    def _process_warp_travel(self, warp_data: Dict[str, Any]) -> None:
        """Traite le voyage par distorsion."""
        coordinates = warp_data["coordinates"]
        size = warp_data["size"]
        user = warp_data["user"]
        
        player_action = PlayerAction(user)
        player_id = player_action.get_player_id()

        self._remove_player_from_current_sector(user)
        destination_room_key = self._get_destination_room_key(player_action)
        if self._is_other_player(user):
            self._handle_other_player_warp(coordinates, size, player_id)
        else:
            self._handle_own_player_warp(destination_room_key, player_id)

    def _remove_player_from_current_sector(self, user: int) -> None:
        """Retire le joueur du secteur actuel."""
        StoreInCache(
            room_name=self.room_group_name, 
            user_calling=self.user.id
        ).delete_player_from_cache(user, self.room_group_name)

    def _get_destination_room_key(self, player_action: PlayerAction) -> str:
        """Obtient la clé de la salle de destination."""
        destination_sector_id = player_action.get_player_sector()
        return f"play_{destination_sector_id}"

    def _is_other_player(self, user: int) -> bool:
        """Vérifie si c'est un autre joueur."""
        return user != self.user.id

    def _handle_other_player_warp(self, coordinates: Any, size: Any, player_id: int) -> None:
        """Gère le voyage d'un autre joueur."""
        spaceship_data_coord = {
            "type": "async_remove_ship",
            "message": {
                "position": coordinates,
                "size": size,
                "player_id": player_id,
            },
        }
        self._send_response(spaceship_data_coord)

    def _handle_own_player_warp(self, destination_room_key: str, player_id: int) -> None:
        """Gère le voyage du joueur."""
        self._setup_destination_cache(destination_room_key)
        self._update_source_cache()
        self._notify_destination_room(destination_room_key, player_id)

    def _setup_destination_cache(self, destination_room_key: str) -> None:
        """Configure le cache de destination."""
        StoreInCache(
            room_name=destination_room_key, 
            user_calling=self.user
        ).get_or_set_cache(need_to_be_recreated=True)

    def _update_source_cache(self) -> None:
        """Met à jour le cache source."""
        StoreInCache(
            room_name=self.room_group_name, 
            user_calling=self.user
        ).update_player_range_finding()

    def _notify_destination_room(self, destination_room_key: str, player_id: int) -> None:
        """Notifie la salle de destination de l'arrivée du joueur."""
        in_cache = cache.get(destination_room_key)
        
        for pc in in_cache["pc"]:
            if pc["user"]["player"] == player_id:
                async_to_sync(self.channel_layer.group_send)(
                    destination_room_key,
                    {
                        "type": "user_join",
                        "message": pc,
                    },
                )

    def user_join(self, event: Dict[str, Any]) -> None:
        """
        Gère l'arrivée d'un utilisateur dans la salle.
        
        Args:
            event: Événement contenant les données d'arrivée
        """
        response = {
            "type": "user_join",
            "message": event["message"],
        }
        self._send_response(response)

    def _send_response(self, response: Dict[str, Any]) -> None:
        """Envoie une réponse via WebSocket."""
        if response:  # Évite d'envoyer des réponses vides
            self.send(text_data=json.dumps(response))