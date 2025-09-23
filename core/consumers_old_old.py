import json
import logging
from typing import Dict, Any, Optional
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from asgiref.sync import sync_to_async
import asyncio

from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.backend.get_data import GetDataFromDB

logger = logging.getLogger("django")


class GameConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer ASYNC pour gérer les interactions en temps réel du jeu.
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
        self._cache_store: Optional[StoreInCache] = None
        self._player_action: Optional[PlayerAction] = None

    async def connect(self) -> None:
        """Établit la connexion WebSocket et joint l'utilisateur au groupe de salle."""
        await self._setup_room_connection()
        await self._join_room_group()
        await self._handle_authenticated_user()

    async def _setup_room_connection(self) -> None:
        """Configure les informations de connexion à la salle."""
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.room_group_name = f"play_{self.room}"
        self.user = self.scope["user"]
        
        # Initialiser player_action de manière async si nécessaire
        if self.user and self.user.is_authenticated:
            self.player_id = await self._get_player_id_async(self.user.id)
        
        await self.accept()

    async def _get_player_id_async(self, user_id: int) -> int:
        """Récupère l'ID du joueur de manière asynchrone."""
        # Si PlayerAction fait des requêtes DB, les rendre async
        return await sync_to_async(PlayerAction(user_id).get_player_id)()

    async def _join_room_group(self) -> None:
        """Joint l'utilisateur au groupe de salle - MAINTENANT ASYNC."""
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

    async def _handle_authenticated_user(self) -> None:
        """Traite les utilisateurs authentifiés en initialisant le cache."""
        if self.user and self.user.is_authenticated:
            # Initialiser le cache store une seule fois
            self._cache_store = StoreInCache(self.room_group_name, self.user)
            self._player_action = PlayerAction(self.user.id)
            
            # Si get_or_set_cache fait des I/O, la rendre async
            await sync_to_async(self._cache_store.get_or_set_cache)(need_to_be_recreated=False)

    async def disconnect(self, close_code: int) -> None:
        """Gère la déconnexion WebSocket - MAINTENANT ASYNC."""
        await self._leave_room_group()
        await self.close()

    async def _leave_room_group(self) -> None:
        """Retire l'utilisateur du groupe de salle - MAINTENANT ASYNC."""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data: Optional[str] = None, bytes_data: Optional[bytes] = None) -> None:
        """
        Reçoit et traite les messages WebSocket - MAINTENANT ASYNC.
        
        Args:
            text_data: Données texte reçues
            bytes_data: Données binaires reçues
        """
        if not self._is_valid_request(text_data):
            return

        try:
            data = json.loads(text_data)
            message_data = self._extract_message_data(data)
            await self._broadcast_message(message_data)
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors du traitement du message: {e}")

    def _is_valid_request(self, text_data: Optional[str]) -> bool:
        """Vérifie si la requête est valide."""
        return text_data is not None and self.user and self.user.is_authenticated

    def _extract_message_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrait les données du message."""
        return {
            "type": data["type"],
            "user": self.user.username,
            "message": data["message"],
        }

    async def _broadcast_message(self, message_data: Dict[str, Any]) -> None:
        """Diffuse le message à tous les membres du groupe - MAINTENANT ASYNC."""
        await self.channel_layer.group_send(
            self.room_group_name,
            message_data,
        )

    async def async_move(self, event: Dict[str, Any]) -> None:
        """
        Gère les mouvements de manière complètement asynchrone.
        """
        try:
            message = json.loads(event["message"])
            
            # Vérification asynchrone de la destination
            can_move = await self._can_move_to_destination_async(message)
            if not can_move:
                return
                
            # Enregistrement asynchrone du mouvement
            move_registered = await self._register_move_async(message)
            if not move_registered:
                return
                
            # Mise à jour asynchrone du cache
            await self._update_player_position_async(message)
            await self._update_player_range_finding_async()
            
            # Préparer et envoyer la réponse
            if self._is_own_player_move(self.player_id, message):
                response = await self._create_own_move_response_async(message)
            else:
                response = await self._handle_other_player_move_async(message)
            
            await self._send_response_async(response)
                
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors du traitement du mouvement: {e}")

    async def _can_move_to_destination_async(self, message: Dict[str, Any]) -> bool:
        """Vérifie si la destination est libre - VERSION ASYNC."""
        # Si destination_already_occupied fait des requêtes DB
        return await sync_to_async(
            self._player_action.destination_already_occupied
        )(message['destination_id_array'])

    async def _register_move_async(self, message: Dict[str, Any]) -> bool:
        """Enregistre le mouvement du joueur - VERSION ASYNC."""
        return await sync_to_async(
            self._player_action.move_have_been_registered
        )(
            coordinates=message['destination_id_array'],
            move_cost=int(message["move_cost"]),
            player_id=message["player"],
        )

    async def _update_player_position_async(self, message: Dict[str, Any]) -> None:
        """Met à jour la position du joueur - VERSION ASYNC."""
        await sync_to_async(
            self._cache_store.update_player_position
        )(message, self.player_id)

    async def _update_player_range_finding_async(self) -> None:
        """Met à jour la portée du joueur - VERSION ASYNC."""
        await sync_to_async(
            self._cache_store.update_player_range_finding
        )()

    def _is_own_player_move(self, player_id: int, message: Dict[str, Any]) -> bool:
        """Vérifie si le mouvement concerne le joueur actuel."""
        return player_id == message["player"]

    async def _create_own_move_response_async(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Crée la réponse pour le mouvement du propre joueur - VERSION ASYNC."""
        # Mise à jour du secteur de visibilité
        await sync_to_async(
            self._cache_store.update_sector_player_visibility_zone
        )(self.player_id)
        
        # Récupération asynchrone des données
        other_player_data = await sync_to_async(
            self._cache_store.get_other_player_data
        )(self.player_id)
        
        current_player_data = await sync_to_async(
            self._cache_store.get_current_player_data
        )(self.player_id)
        
        sector_data = await sync_to_async(
            self._cache_store.get_sector_data
        )()
        
        modules_range = await sync_to_async(
            self._cache_store.get_specific_player_data
        )(self.player_id, "pc", "ship", "modules_range")
        
        visible_zone = await sync_to_async(
            self._cache_store.get_specific_player_data
        )(message["player"], "pc", "ship", "visible_zone")
        
        view_range = await sync_to_async(
            self._cache_store.get_specific_player_data
        )(message["player"], "pc", "ship", "view_range")
        
        return {
            "type": "player_move",
            "message": {
                "player_id": message["player"],
                "start_id_array": message["start_id_array"],
                "updated_other_player_data": other_player_data,
                "updated_current_player_data": current_player_data,
                "is_reversed": message["is_reversed"],
                "sector": sector_data,
                "move_cost": message["move_cost"],
                "modules_range": modules_range,
                "visible_zone": visible_zone,
                "view_range": view_range,
                "size": {"x": message["size_x"], "y": message["size_y"]},
            },
        }

    async def _handle_other_player_move_async(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Gère le mouvement d'un autre joueur - VERSION ASYNC."""
        # Récupération asynchrone des données
        other_player_data = await sync_to_async(
            self._cache_store.get_other_player_data
        )(self.player_id)
        
        current_player_data = await sync_to_async(
            self._cache_store.get_current_player_data
        )(self.player_id)
        
        other_player_name = await sync_to_async(
            self._player_action.get_other_player_name
        )(message["player"])
        
        sector_data = await sync_to_async(
            self._cache_store.get_sector_data
        )()
        
        movement_remaining = await sync_to_async(
            self._player_action.get_other_player_movement_remaining
        )(message["player"])
        
        max_movement = await sync_to_async(
            self._cache_store.get_specific_player_data
        )(message["player"], "pc", "ship", "max_movement")
        
        modules_range = await sync_to_async(
            self._cache_store.get_specific_player_data
        )(self.player_id, "pc", "ship", "modules_range")
        
        return {
            "type": "player_move",
            "message": {
                "player_id": message["player"],
                "updated_other_player_data": other_player_data,
                "updated_current_player_data": current_player_data,
                "otherPlayerData": other_player_name,
                "is_reversed": message["is_reversed"],
                "sector": sector_data,
                "start_id_array": message["start_id_array"],
                "movement_remaining": movement_remaining,
                "max_movement": max_movement,
                "modules_range": modules_range,
                "size": {"x": message["size_x"], "y": message["size_y"]},
            },
        }

    async def async_reverse_ship(self, event: Dict[str, Any]) -> None:
        """Gère l'inversion asynchrone du vaisseau - VRAIMENT ASYNC."""
        try:
            message = json.loads(event["message"])
            response = await self._process_ship_reversal_async(message)
            await self._send_response_async(response)
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors de l'inversion du vaisseau: {e}")

    async def _process_ship_reversal_async(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Traite l'inversion du vaisseau - VERSION ASYNC."""
        # Opérations asynchrones
        await sync_to_async(
            self._player_action.set_reverse_ship_status
        )()
        
        reverse_status = await sync_to_async(
            self._player_action.get_reverse_ship_status
        )()
        
        data = await sync_to_async(
            self._cache_store.update_ship_is_reversed
        )(message, message["player"], reverse_status)

        return {
            "type": "async_reverse_ship",
            "message": {
                "id_array": message["id_array"],
                "is_reversed": data[0],
                "player_id": data[1],
            },
        }

    async def async_warp_travel(self, event: Dict[str, Any]) -> None:
        """Gère le voyage par distorsion asynchrone - VRAIMENT ASYNC."""
        try:
            warp_data = json.loads(event["message"])["data"]
            await self._process_warp_travel_async(warp_data)
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Erreur lors du voyage par distorsion: {e}")

    async def _process_warp_travel_async(self, warp_data: Dict[str, Any]) -> None:
        """Traite le voyage par distorsion - VERSION ASYNC."""
        coordinates = warp_data["coordinates"]
        size = warp_data["size"]
        user = warp_data["user"]
        
        # Créer PlayerAction pour cet utilisateur si nécessaire
        other_player_action = PlayerAction(user)
        player_id = await sync_to_async(other_player_action.get_player_id)()

        await self._remove_player_from_current_sector_async(user)
        destination_room_key = await self._get_destination_room_key_async(other_player_action)
        
        if self._is_other_player(user):
            await self._handle_other_player_warp_async(coordinates, size, player_id)
        else:
            await self._handle_own_player_warp_async(destination_room_key, player_id)

    async def _remove_player_from_current_sector_async(self, user: int) -> None:
        """Retire le joueur du secteur actuel - VERSION ASYNC."""
        temp_store = StoreInCache(
            room_name=self.room_group_name, 
            user_calling=self.user.id
        )
        await sync_to_async(temp_store.delete_player_from_cache)(
            user, self.room_group_name
        )

    async def _get_destination_room_key_async(self, player_action: PlayerAction) -> str:
        """Obtient la clé de la salle de destination - VERSION ASYNC."""
        destination_sector_id = await sync_to_async(
            player_action.get_player_sector
        )()
        return f"play_{destination_sector_id}"

    def _is_other_player(self, user: int) -> bool:
        """Vérifie si c'est un autre joueur."""
        return user != self.user.id

    async def _handle_other_player_warp_async(self, coordinates: Any, size: Any, player_id: int) -> None:
        """Gère le voyage d'un autre joueur - VERSION ASYNC."""
        spaceship_data_coord = {
            "type": "async_remove_ship",
            "message": {
                "position": coordinates,
                "size": size,
                "player_id": player_id,
            },
        }
        await self._send_response_async(spaceship_data_coord)

    async def _handle_own_player_warp_async(self, destination_room_key: str, player_id: int) -> None:
        """Gère le voyage du joueur - VERSION ASYNC."""
        await self._setup_destination_cache_async(destination_room_key)
        await self._update_source_cache_async()
        await self._notify_destination_room_async(destination_room_key, player_id)

    async def _setup_destination_cache_async(self, destination_room_key: str) -> None:
        """Configure le cache de destination - VERSION ASYNC."""
        destination_store = StoreInCache(
            room_name=destination_room_key, 
            user_calling=self.user
        )
        await sync_to_async(destination_store.get_or_set_cache)(need_to_be_recreated=True)

    async def _update_source_cache_async(self) -> None:
        """Met à jour le cache source - VERSION ASYNC."""
        await sync_to_async(
            self._cache_store.update_player_range_finding
        )()

    async def _notify_destination_room_async(self, destination_room_key: str, player_id: int) -> None:
        """Notifie la salle de destination de l'arrivée du joueur - VERSION ASYNC."""
        # Accès cache asynchrone si nécessaire
        in_cache = await sync_to_async(cache.get)(destination_room_key)
        
        for pc in in_cache["pc"]:
            if pc["user"]["player"] == player_id:
                await self.channel_layer.group_send(
                    destination_room_key,
                    {
                        "type": "user_join",
                        "message": pc,
                    },
                )

    async def user_join(self, event: Dict[str, Any]) -> None:
        """Gère l'arrivée d'un utilisateur dans la salle - MAINTENANT ASYNC."""
        response = {
            "type": "user_join",
            "message": event["message"],
        }
        await self._send_response_async(response)

    async def _send_response_async(self, response: Dict[str, Any]) -> None:
        """Envoie une réponse via WebSocket - VERSION ASYNC."""
        if response:  # Évite d'envoyer des réponses vides
            await self.send(text_data=json.dumps(response))


# =====================================
# OPTIMISATIONS AVANCÉES RECOMMANDÉES
# =====================================

class OptimizedGameConsumer(AsyncWebsocketConsumer):
    """
    Version optimisée avec gestion d'erreurs avancée et pool de connexions.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._connection_pool = None
        self._cache_store = None
        self._player_action = None
        self._cached_player_id = None

    async def connect(self) -> None:
        """Version optimisée de la connexion."""
        try:
            await self._setup_room_connection_optimized()
            await self._join_room_group()
            await self._initialize_cached_dependencies()
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            await self.close(code=4000)

    async def _initialize_cached_dependencies(self) -> None:
        """Initialise toutes les dépendances en une seule fois."""
        if self.user and self.user.is_authenticated:
            # Initialisation en parallèle
            tasks = [
                self._get_player_id_async(self.user.id),
                self._setup_cache_store_async(),
                self._setup_player_action_async()
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            self._cached_player_id = results[0] if not isinstance(results[0], Exception) else None
            # Gérer les autres résultats...

    async def _setup_cache_store_async(self) -> None:
        """Configure le store de cache."""
        self._cache_store = StoreInCache(self.room_group_name, self.user)
        await sync_to_async(self._cache_store.get_or_set_cache)(need_to_be_recreated=False)

    async def _setup_player_action_async(self) -> None:
        """Configure l'action player."""
        self._player_action = PlayerAction(self.user.id)

    @property
    def player_id(self) -> Optional[int]:
        """Accès cached au player_id."""
        return self._cached_player_id

    # Utilisation de batching pour les opérations multiples
    async def _batch_cache_updates(self, operations: list) -> None:
        """Effectue plusieurs mises à jour cache en batch."""
        tasks = []
        for operation, *args in operations:
            if operation == 'update_position':
                tasks.append(sync_to_async(self._cache_store.update_player_position)(*args))
            elif operation == 'update_range':
                tasks.append(sync_to_async(self._cache_store.update_player_range_finding)())
            # Ajouter d'autres opérations...
        
        await asyncio.gather(*tasks, return_exceptions=True)
