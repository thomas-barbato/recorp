import json
import os
import logging
from datetime import datetime
from typing import Optional, Dict, List, Tuple, Any
from django.core import serializers
from recorp.settings import BASE_DIR
from django.db.models import Q, F
from functools import reduce
import operator
from django.utils import timezone
from django.contrib.auth.models import User
from core.backend.get_data import GetDataFromDB
from core.backend.action_rules import ActionRules
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async, async_to_sync
from channels.layers import get_channel_layer
logger = logging.getLogger("django")


from core.models import (
    Planet,
    Asteroid,
    Station,
    Resource,
    PlanetResource,
    AsteroidResource,
    StationResource,
    Faction,
    FactionResource,
    Security,
    Sector,
    Player,
    PlayerShip,
    Warp,
    WarpZone,
    SectorWarpZone,
    LoggedInUser,
    PrivateMessage,
    PrivateMessageRecipients,
    Message, 
    PlayerGroup,
    Group,
    MessageReadStatus,
    PlayerLog
)


class PlayerAction:
    """Classe pour gérer les actions du joueur dans le jeu."""
    
    # Constantes de configuration
    SECTOR_SIZE = 40  # Taille maximale du secteur (0-39)
    MIN_PADDING = 3   # Padding minimum autour des objets
    
    def __init__(self, user_id: int):
        """
        Initialise une instance PlayerAction.
        
        Args:
            user_id (int): ID de l'utilisateur
        """
        self.id = user_id or None
        self.player = self._get_player_queryset()
        self.player_id = self.get_player_id()

    def _get_player_queryset(self):
        """Récupère le queryset du joueur."""
        return Player.objects.filter(user_id=self.id).all()

    def is_player_exists(self) -> bool:
        """Vérifie si le joueur existe."""
        return Player.objects.filter(id=self.player_id).exists()
        
    def get_player_id(self) -> Optional[int]:
        """
        Retourne l'ID du joueur s'il a créé un personnage, sinon None.
        
        Returns:
            Optional[int]: ID du joueur ou None
        """
        if self.player.exists():
            return self.player.values_list("id", flat=True).first()
        return None
    
    def get_session_key(self) -> List[str]:
        """Récupère les clés de session du joueur."""
        return list(LoggedInUser.objects.filter(user_id=self.id).values_list('session_key', flat=True))
    
    def get_player_sector_id(self) -> Optional[int]:
        """Récupère l'ID du secteur du joueur."""
        if self.player.exists():
            return self.player.values_list("sector_id", flat=True).first()
        return None
    
    def get_player_data(self) -> List[str]:
        if self.player.exists():
            return self.player.all()
        return None

    def get_player_faction(self) -> Optional[int]:
        """Récupère l'ID de la faction du joueur."""
        if self.player.exists():
            return self.player.values_list("faction_id", flat=True).first()
        return None

    def get_player_sector(self) -> Optional[int]:
        """Récupère le secteur du joueur (alias de get_player_sector_id)."""
        return self.get_player_sector_id()

    def get_coord(self) -> Optional[Dict[str, int]]:
        """Récupère les coordonnées du joueur."""
        if self.player.exists():
            return self.player.values_list("coordinates", flat=True).first()
        return None

    def get_other_player_name(self, other_player_id: int) -> Optional[str]:
        """
        Récupère le nom d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Optional[str]: Nom du joueur ou None
        """
        try:
            return Player.objects.filter(id=other_player_id).values_list("name", flat=True).first()
        except Player.DoesNotExist:
            return None
        
    def get_player_log(self, log):
        return PlayerLog.objects.filter(log=log)
        
        
    def get_other_player_data(self, other_player_id: int) -> Player:
        """
        Récupère l'ID utilisateur d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Player instance
        """
        try:
            return Player.objects.filter(id=other_player_id).all()
        except Player.DoesNotExist:
            return None
        
        

    def get_other_player_user_id(self, other_player_id: int) -> Optional[int]:
        """
        Récupère l'ID utilisateur d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Optional[int]: ID utilisateur ou None
        """
        try:
            return Player.objects.filter(id=other_player_id).values_list("user_id", flat=True).first()
        except Player.DoesNotExist:
            return None

    def get_other_player_coord(self, other_player_id: int) -> Optional[Dict[str, int]]:
        """
        Récupère les coordonnées d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Optional[Dict[str, int]]: Coordonnées du joueur ou None
        """
        try:
            return Player.objects.filter(id=other_player_id).values_list("coordinates", flat=True).first()
        except Player.DoesNotExist:
            return None
        
    def get_spaceship_coord_and_size(self, other_player_id: int) -> Optional[Dict[str, Any]]:
        """
        Récupère les coordonnées et la taille du vaisseau d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Optional[Dict]: Données du vaisseau ou None
        """
        try:
            return PlayerShip.objects.filter(
                player_id=other_player_id,
                is_current_ship=True
            ).values(
                'player_id__coordinates',
                'ship_id__ship_category_id__size'
            ).first()
        except PlayerShip.DoesNotExist:
            return None
        
    def get_playerShip(self):
        return PlayerShip.objects.filter(
            player_id=self.player_id,
            is_current_ship=True
        ).all()

    def destination_already_occupied(self, coordinates_list: list) -> bool:
        """
        Vérifie si une destination est déjà occupée.
        
        Args:
            end_x (int): Coordonnée X de destination
            end_y (int): Coordonnée Y de destination
            
        Returns:
            bool: True si occupée, False sinon
        """
        coordinates = [{"x": int(coord.split('_')[1]), "y": int(coord.split('_')[0])} for coord in coordinates_list]
        if len(coordinates) > 1:
            # Créer une liste de conditions Q pour chaque coordonnée
            q_objects = [Q(coordinates=coord) for coord in coordinates]
            
            # Combiner avec OR
            combined_q = reduce(operator.or_, q_objects)
            
            return Player.objects.filter(combined_q).exists()
        else:
            return Player.objects.filter(coordinates=coordinates).exists()
        

    def get_reverse_ship_status(self) -> Optional[bool]:
        """Récupère le statut de retournement du vaisseau."""
        if not self.player_id:
            return None
        
        try:
            return PlayerShip.objects.filter(
                player_id=self.player_id, 
                is_current_ship=True
            ).values_list("is_reversed", flat=True).first()
        except PlayerShip.DoesNotExist:
            return None

    def get_player_ship_size(self) -> Optional[Dict[str, Any]]:
        """Récupère la taille du vaisseau du joueur."""
        if not self.player_id:
            return None
            
        try:
            return PlayerShip.objects.filter(
                player_id=self.player_id, 
                is_current_ship=True
            ).values("ship_id__ship_category_id__size").first()
        except PlayerShip.DoesNotExist:
            return None

    def get_other_player_movement(self, other_player_id: int) -> Optional[int]:
        """
        Récupère le mouvement maximum d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Optional[int]: Mouvement maximum ou None
        """
        try:
            return PlayerShip.objects.filter(
                player_id=other_player_id, 
                is_current_ship=True
            ).values_list("max_movement", flat=True).first()
        except PlayerShip.DoesNotExist:
            return None

    def get_other_player_movement_remaining(self, other_player_id: int) -> Optional[int]:
        """
        Récupère le mouvement restant d'un autre joueur.
        
        Args:
            other_player_id (int): ID de l'autre joueur
            
        Returns:
            Optional[int]: Mouvement restant ou None
        """
        try:
            return PlayerShip.objects.filter(
                player_id=other_player_id, 
                is_current_ship=True
            ).values_list("current_movement", flat=True).first()
        except PlayerShip.DoesNotExist:
            return None

    def get_player_movement_remaining(self) -> Optional[int]:
        """
        Récupère le mouvement restant du joueur.
        Returns:
            Optional[int]: Mouvement restant ou None
        """
        try:
            return PlayerShip.objects.filter(
                player_id=self.player_id, 
                is_current_ship=True
            ).values_list("current_movement", flat=True).first()
        except PlayerShip.DoesNotExist:
            return None
        
    def set_player_sector(self, sector_id: int, coordinates: Dict[str, int]) -> bool:
        """
        Met à jour le secteur et les coordonnées du joueur.
        
        Args:
            sector_id (int): ID du nouveau secteur
            coordinates (Dict[str, int]): Nouvelles coordonnées
            
        Returns:
            bool: True si la mise à jour a réussi
        """
        if not self.player_id:
            return False
            
        updated_count = Player.objects.filter(
            id=self.player_id
        ).update(
            sector_id=sector_id,
            coordinates=coordinates,
            last_time_warpzone=datetime.now()
        )
        return updated_count > 0
    
    def set_reverse_ship_status(self) -> bool:
        """
        Inverse le statut de retournement du vaisseau.
        
        Returns:
            bool: True si la mise à jour a réussi
        """
        if not self.player_id:
            return False
            
        try:
            playership = PlayerShip.objects.get(
                player_id=self.player_id, 
                is_current_ship=True
            )
            playership.is_reversed = not playership.is_reversed
            playership.save()
            return True
        except PlayerShip.DoesNotExist:
            return False

    def _check_if_player_can_move_and_update(self, move_cost: int) -> bool:
        """
        Vérifie si le joueur peut se déplacer et met à jour ses points de mouvement.
        
        Args:
            move_cost (int): Coût du mouvement
            
        Returns:
            bool: True si le mouvement est possible
        """
        if not self.player_id:
            return False
            
        try:
            playership = PlayerShip.objects.get(
                player_id=self.player_id,
                is_current_ship=True,
                current_movement__gte=move_cost,
            )
            
            new_movement = playership.current_movement - move_cost
            if new_movement >= 0:
                playership.current_movement = new_movement
                playership.save()
                return True
        except PlayerShip.DoesNotExist:
            return False

    def move_have_been_registered(self, coordinates, move_cost: int, player_id: int) -> bool:
        """
        Enregistre un mouvement du joueur.
        
        Args:
            end_x (int): Coordonnée X de destination
            end_y (int): Coordonnée Y de destination
            move_cost (int): Coût du mouvement
            
        Returns:
            bool: True si le mouvement a été enregistré
        """
        coordinates_split = coordinates.split('_')
        coord = {"x": int(coordinates_split[1]), "y": int(coordinates_split[0])}
        if self.player_id == player_id:
            if self._check_if_player_can_move_and_update(move_cost):
                Player.objects.filter(id=player_id).update(
                    coordinates=coord
                )
                return True
        else:
            return True
    
    def player_travel_to_destination(self, warpzone_home_id, warpzone_destination_id: int) -> Optional[Tuple[int, Dict[str, int]]]:
        """
        Fait voyager le joueur vers une destination via une warpzone.
        
        Args:
            warpzone_home_name (str): Nom de la warpzone de départ
            warpzone_home_id (int): ID de la warpzone de départ
            
        Returns:
            Optional[Tuple[int, Dict[str, int]]]: (ID secteur destination, coordonnées) ou None
        """
        
        player_sector_id = self.get_player_sector_id()
        if not player_sector_id:
            return None
            
        warpzone = SectorWarpZone.objects.filter(
            warp_home_id=warpzone_home_id,
            warp_destination_id=warpzone_destination_id,
        )
        
        sector_id = warpzone.values_list('warp_destination_id__sector_id', flat=True)[0]
        
        if warpzone.exists() is False:
            return
        
        player_spaceship = self.get_player_ship_size()
        if not player_spaceship:
            return None
            
        ship_size = player_spaceship['ship_id__ship_category_id__size']
        spaceship_size_x = ship_size['x']
        spaceship_size_y = ship_size['y']

        padding_w = spaceship_size_x + self.MIN_PADDING
        padding_h = spaceship_size_y + self.MIN_PADDING
        
        destination_cell = self._calculate_destination_coord(
            sector_id, 
            spaceship_size_x, 
            spaceship_size_y, 
            padding_h, 
            padding_w
        )
        
        if destination_cell:
            return sector_id, destination_cell
    
    def _calculate_destination_coord(self, destination_sector_id: int, spaceship_size_x: int, 
        spaceship_size_y: int, padding_h: int, padding_w: int) -> Optional[Dict[str, int]]:
        """
        Calcule les coordonnées de destination libres dans un secteur.
        
        Args:
            destination_sector_id (int): ID du secteur de destination
            spaceship_size_x (int): Largeur du vaisseau
            spaceship_size_y (int): Hauteur du vaisseau
            padding_h (int): Padding vertical
            padding_w (int): Padding horizontal
            
        Returns:
            Optional[Dict[str, int]]: Coordonnées libres ou None
        """
        # Récupération des données du secteur
        sector_data = GetDataFromDB.get_items_from_sector(destination_sector_id, with_npc=True)
        if not sector_data or len(sector_data) < 6:
            return None
            
        planets, asteroids, stations, warpzones, npcs, pcs = sector_data
        
        # Construction de la liste des coordonnées occupées
        occupied_coords = self._get_all_occupied_coordinates({
            "planet": planets,
            "asteroid": asteroids,
            "station": stations,
            "warpzone": warpzones,
            "npc": npcs,
            "pc": pcs,
        })
        
        # Recherche des coordonnées de la warpzone pour définir la zone de recherche
        warp_bounds = self._get_warpzone_bounds(warpzones)
        if not warp_bounds:
            return None
            
        # Définition de la zone de recherche
        search_zone = self._calculate_search_zone(warp_bounds, padding_w, padding_h)
        
        # Recherche d'une position libre
        return self._find_free_position(
            search_zone, 
            occupied_coords, 
            spaceship_size_x, 
            spaceship_size_y,
            destination_sector_id,
            padding_h,
            padding_w
        )

    def _get_all_occupied_coordinates(self, foreground_items: Dict[str, List]) -> List[Dict[str, int]]:
        """
        Récupère toutes les coordonnées occupées dans le secteur.
        
        Args:
            foreground_items (Dict): Dictionnaire des objets du secteur
            
        Returns:
            List[Dict[str, int]]: Liste des coordonnées occupées
        """
        all_coords = []
        
        for item_type, items in foreground_items.items():
            for item in items:
                coords, size = self._extract_item_coords_and_size(item, item_type)
                if coords and size:
                    item_coords = self._calculate_item_occupied_coords(coords, size)
                    all_coords.extend(item_coords)
        
        return all_coords

    def _extract_item_coords_and_size(self, item: Dict, item_type: str) -> Tuple[Optional[Dict], Optional[Dict]]:
        """
        Extrait les coordonnées et la taille d'un objet.
        
        Args:
            item (Dict): Objet à analyser
            item_type (str): Type de l'objet
            
        Returns:
            Tuple[Optional[Dict], Optional[Dict]]: (coordonnées, taille)
        """
        if item_type in ["npc", "pc"]:
            size = (item.get('ship_id__ship_category_id__size') or 
            item.get('npc_template_id__ship_id__ship_category_id__size'))
            coords = item.get('coordinates') or item.get('player_id__coordinates')
        else:
            size = item.get('source_id__size')
            coords = item.get('coordinates')
            
        return coords, size

    def _calculate_item_occupied_coords(self, coords: Dict, size: Dict) -> List[Dict[str, int]]:
        """
        Calcule toutes les coordonnées occupées par un objet.
        
        Args:
            coords (Dict): Coordonnées de l'objet
            size (Dict): Taille de l'objet
            
        Returns:
            List[Dict[str, int]]: Liste des coordonnées occupées
        """
        coord_x, coord_y = int(coords['x']), int(coords['y'])
        size_x, size_y = int(size['x']), int(size['y'])
        
        occupied = []
        
        if size_x > 1 or size_y > 1:
            for y in range(coord_y, coord_y + size_y):
                for x in range(coord_x, coord_x + size_x):
                    occupied.append({'y': y, 'x': x})
        else:
            occupied.append({'y': coord_y, 'x': coord_x})
            
        return occupied

    def _get_warpzone_bounds(self, warpzones: List) -> Optional[Dict[str, int]]:
        """
        Récupère les limites de la warpzone.
        
        Args:
            warpzones (List): Liste des warpzones
            
        Returns:
            Optional[Dict[str, int]]: Limites de la warpzone ou None
        """
        for warpzone in warpzones:
            if warpzone.get('id'):
                coords = warpzone.get('coordinates', {})
                size = warpzone.get('source_id__size', {})
                
                return {
                    'start_x': int(coords.get('x', 0)),
                    'start_y': int(coords.get('y', 0)),
                    'end_x': int(coords.get('x', 0)) + int(size.get('x', 1)),
                    'end_y': int(coords.get('y', 0)) + int(size.get('y', 1))
                }
        return None

    def _calculate_search_zone(self, warp_bounds: Dict[str, int], padding_w: int, padding_h: int) -> List[Dict[str, int]]:
        """
        Calcule la zone de recherche autour de la warpzone.
        
        Args:
            warp_bounds (Dict): Limites de la warpzone
            padding_w (int): Padding horizontal
            padding_h (int): Padding vertical
            
        Returns:
            List[Dict[str, int]]: Coordonnées de la zone de recherche
        """
        start_x = max(0, warp_bounds['start_x'] - padding_w)
        end_x = min(self.SECTOR_SIZE - 1, warp_bounds['end_x'] + padding_w)
        start_y = max(0, warp_bounds['start_y'] - padding_h)
        end_y = min(self.SECTOR_SIZE - 1, warp_bounds['end_y'] + padding_h)
        
        return [
            {"y": y, "x": x} 
            for y in range(start_y, end_y + 1) 
            for x in range(start_x, end_x + 1)
        ]

    def _find_free_position(self, search_zone: List[Dict[str, int]], occupied_coords: List[Dict[str, int]], 
        spaceship_size_x: int, spaceship_size_y: int, destination_sector_id: int,
        padding_h: int, padding_w: int) -> Optional[Dict[str, int]]:
        """
        Trouve une position libre pour le vaisseau.
        
        Args:
            search_zone (List): Zone de recherche
            occupied_coords (List): Coordonnées occupées
            spaceship_size_x (int): Largeur du vaisseau
            spaceship_size_y (int): Hauteur du vaisseau
            destination_sector_id (int): ID du secteur de destination
            padding_h (int): Padding vertical
            padding_w (int): Padding horizontal
            
        Returns:
            Optional[Dict[str, int]]: Position libre ou None
        """
        for cell in search_zone:
            if self._can_place_ship_at_position(cell, occupied_coords, spaceship_size_x, spaceship_size_y):
                return cell
        
        # Si aucune position n'est trouvée, augmenter le padding et réessayer (récursion contrôlée)
        if padding_h < 10 and padding_w < 10:  # Limite pour éviter la récursion infinie
            return self._calculate_destination_coord(
                destination_sector_id, 
                spaceship_size_x, 
                spaceship_size_y, 
                padding_h + 1, 
                padding_w + 1
            )
        
        return None

    def _can_place_ship_at_position(self, position: Dict[str, int], occupied_coords: List[Dict[str, int]], 
        ship_size_x: int, ship_size_y: int) -> bool:
        """
        Vérifie si un vaisseau peut être placé à une position donnée.
        
        Args:
            position (Dict): Position à tester
            occupied_coords (List): Coordonnées occupées
            ship_size_x (int): Largeur du vaisseau
            ship_size_y (int): Hauteur du vaisseau
            
        Returns:
            bool: True si le placement est possible
        """
        cell_x, cell_y = position['x'], position['y']
        
        # Vérifier que le vaisseau ne dépasse pas les limites du secteur
        if (cell_x + ship_size_x > self.SECTOR_SIZE or 
            cell_y + ship_size_y > self.SECTOR_SIZE):
            return False
        
        # Vérifier que toutes les cellules nécessaires sont libres
        for y in range(cell_y, cell_y + ship_size_y):
            for x in range(cell_x, cell_x + ship_size_x):
                if {'y': y, 'x': x} in occupied_coords:
                    return False
        
        return True

    def create_new_mp(self, recipient_id, subject, body, priority='LOW'):
        """
        Crée un nouveau message privé avec priorité.
        
        Args:
            recipient_id: Liste des IDs des destinataires
            subject: Sujet du message
            body: Corps du message
            priority: 'LOW', 'NORMAL', 'HIGH', ou 'URGENT' (défaut: 'LOW')
        """
        
        recipients = Player.objects.filter(id__in=recipient_id).values('id')
    
        sender_player = Player.objects.get(id=self.player_id)
        sender_user = sender_player.user
        
        # Si l'expéditeur est staff/admin, priorité haute
        if sender_user.is_staff or sender_user.is_superuser:
            priority = 'HIGH'
        
        new_mp = PrivateMessage(
            subject=subject,
            body=body,
            sender_id=self.player_id,
            priority=priority
        )
        
        new_mp.save()
        
        if not PrivateMessageRecipients.objects.filter(message_id=new_mp.id, recipient_id=self.player_id).exists():
            add_author_mp = PrivateMessageRecipients(
                message_id=new_mp.id,
                recipient_id=self.player_id,
                is_read=True,
                is_author=True,
            )
        
            add_author_mp.save()
        
        # Ajouter tous les destinataires
        recipients_to_create = [
            PrivateMessageRecipients(
                message_id=new_mp.id,
                recipient_id=recipient['id'],
                is_read=False,
            )
            for recipient in recipients
        ]
        
        # Création en masse pour optimiser les performances
        PrivateMessageRecipients.objects.bulk_create(recipients_to_create)
        
    def check_if_player_get_movement_remaining(self, cost):
        return PlayerShip.objects.filter(player_id=self.player_id, is_current_ship=True, current_movement__gte=cost).exists()
    
    def set_spaceship_statistics_with_module(self):
        """Placeholder pour les statistiques du vaisseau avec modules."""
        pass
    
    def calculate_path_cost(
        self, 
        start_x: int, 
        start_y: int, 
        end_x: int, 
        end_y: int
    ) -> int:
        """
        Calcule une estimation du coût basée sur la distance Manhattan
        et les obstacles connus.
        
        Cette version est plus rapide mais moins précise qu'A*.
        """
        try:
            # Distance Manhattan (minimum théorique)
            manhattan = abs(end_x - start_x) + abs(end_y - start_y)
            
            # Récupérer les obstacles sur le chemin direct
            obstacles_on_path = self._count_obstacles_on_path(
                start_x, start_y, end_x, end_y
            )
            
            # Estimation: distance + obstacles * facteur de détour
            estimated_cost = manhattan + (obstacles_on_path * 2)
            
            return estimated_cost
            
        except Exception as e:
            logger.error(f"Erreur estimation chemin: {e}")
            return abs(end_x - start_x) + abs(end_y - start_y)
    
    def _count_obstacles_on_path(
        self, 
        start_x: int, 
        start_y: int, 
        end_x: int, 
        end_y: int
    ) -> int:
        """Compte les obstacles sur le chemin direct."""
        from core.backend.get_data import GetDataFromDB
        
        # Récupérer les obstacles du secteur
        player_data = GetDataFromDB.get_player_sector(self.player_id)
        sector_id = player_data.get("sector_id")
        obstacles = self._get_sector_obstacles(sector_id)
        
        # Convertir en set pour recherche rapide
        obstacle_positions = {(obs["x"], obs["y"]) for obs in obstacles}
        
        count = 0
        # Parcourir approximativement le chemin direct
        steps = max(abs(end_x - start_x), abs(end_y - start_y))
        
        if steps == 0:
            return 0
        
        for i in range(steps + 1):
            t = i / steps
            x = int(start_x + t * (end_x - start_x))
            y = int(start_y + t * (end_y - start_y))
            
            if (x, y) in obstacle_positions:
                count += 1
        
        return count
    
    def get_player_group(self):
        """
        Retourne un dictionnaire (ou rien) du groupe auquel le joueur appartien.
        """
        return PlayerGroup.objects.filter(player_id=self.player_id) or []
    
    def create_chat_message(self, content: str, channel: str):
        """
        Crée un message de chat selon le type de canal.
        Retourne (message_obj, destinataires)
        """
        try:
            player_data = self.get_player_data()
            author_id = player_data.values_list('id', flat=True)[0]
            faction_id = player_data.values_list('faction_id', flat=True)[0]
            sector_id = player_data.values_list('sector_id', flat=True)[0]
            
            msg_data = {
                "content": content,
                "author_id": author_id,
                "channel": channel.upper(),  # SECTOR, FACTION, GROUP
            }

            recipients = []

            # === CANAL SECTEUR ===
            if channel == "sector":
                msg_data["sector_id"] = sector_id
                recipients = GetDataFromDB.get_players_in_sector(sector_id)

            # === CANAL FACTION ===
            elif channel == "faction":
                msg_data["faction_id"] = faction_id
                recipients = GetDataFromDB.get_players_in_faction(faction_id)

            # === CANAL GROUPE ===
            elif channel == "group":
                group = PlayerGroup.objects.filter(player_id=author_id).first()
                if not group:
                    return None, []  # joueur sans groupe
                msg_data["group_id"] = group.group_id
                recipients = GetDataFromDB.get_players_in_group(group.group_id, author_id)
                
            
            else:
                logger.warning(f"Canal de chat inconnu: {channel}")
                return None, []
            
            recipients_data = [
                r for r in recipients
                if r["id"] != author_id
            ]

            
            msg = Message.objects.create(**msg_data)
            
            read_statuses = []
            for recipient in recipients_data:
                read_statuses.append(
                    MessageReadStatus(
                        player_id=recipient['id'],
                        message_id=msg.id,
                        is_read=False
                    )
                )
            
            # Ajouter l'auteur (déjà lu)
            if not MessageReadStatus.objects.filter(player_id=author_id, message_id=msg.id).exists():
                read_statuses.append(
                    MessageReadStatus(
                        player_id=author_id,
                        message_id=msg.id,
                        is_read=True,
                        read_at=timezone.now()
                    )
                )
            
            # Bulk create pour optimisation
            MessageReadStatus.objects.bulk_create(read_statuses)

            return msg, recipients

        except Exception as e:
            logger.exception(f"Erreur create_chat_message ({channel}): {e}")
            return None, []
        

    def consume_ap(self, cost: int) -> bool:
        if not self.player_id:
            return False

        updated = Player.objects.filter(
            id=self.player_id,
            current_ap__gte=cost
        ).update(
            current_ap=F("current_ap") - cost
        )
        player = Player.objects.filter(id=self.player_id).values('current_ap').first()
        return updated > 0, player['current_ap']
    

    def _emit_scan_visibility_update(self, scan):
            channel_layer = get_channel_layer()

            payload = {
                "type": "scan_visibility_update",
                "target_key": f"{scan.target_type}_{scan.target_id}",
                "expires_at": scan.expires_at.isoformat(),
                "sector_id": scan.sector_id,
            }

            # joueur qui a scanné
            async_to_sync(channel_layer.group_send)(
                f"player_{scan.scanner_player_id}",
                payload
            )

            # groupes partagés
            for link in scan.scan_to_group.select_related("group"):
                async_to_sync(channel_layer.group_send)(
                    f"group_{link.group.id}",
                    payload
                )
                
    def _emit_scan_invalidation(self, target_type: str, target_id: int, sector_id: int):
        channel_layer = get_channel_layer()

        target_key = f"{target_type}_{target_id}"

        payload = {
            "type": "scan_visibility_update",
            "remove": [target_key],
            "reason": "invalidate",
        }

        async_to_sync(channel_layer.group_send)(
            f"play_{sector_id}",
            payload
        )
                
    def perform_scan(self, target_type, target_id, sector_id):
        scan = ActionRules.upsert_scan(
            scanner_player_id=self.player_id,
            target_type=target_type,
            target_id=target_id,
            sector_id=sector_id
        )
        
        self._emit_scan_visibility_update(scan)

        return scan
    
    
def send_admin_announcement(subject, body, recipient_ids=None, priority='HIGH'):
    """
    Fonction pour envoyer des annonces administratives avec haute priorité.
    
    Args:
        subject: Sujet du message
        body: Corps du message
        recipient_ids: Liste des IDs destinataires (None = tous les joueurs)
        priority: 'HIGH' ou 'URGENT'
    """
    # Récupérer l'admin/système
    admin_player = Player.objects.filter(user__is_superuser=True).first()
    
    if not admin_player:
        raise ValueError("Aucun admin trouvé")
    
    # Si pas de destinataires spécifiés, envoyer à tous
    if recipient_ids is None:
        recipient_ids = list(Player.objects.values_list('id', flat=True))
    
    # Créer le message
    message = PrivateMessage.objects.create(
        sender=admin_player,
        subject=subject,
        body=body,
        priority=priority
    )
        
    # Créer les entrées destinataires
    recipients_to_create = [
        PrivateMessageRecipients(
            message=message,
            recipient_id=recipient_id,
            is_read=False
        )
        for recipient_id in recipient_ids
    ]
    
    PrivateMessageRecipients.objects.bulk_create(recipients_to_create)
    
    return message