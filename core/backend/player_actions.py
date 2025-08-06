import json
import os
from typing import Optional, Dict, List, Tuple, Any
from django.core import serializers
from recorp.settings import BASE_DIR
from django.db.models import Q
from functools import reduce
import operator
from django.contrib.auth.models import User
from core.backend.get_data import GetDataFromDB
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
        self.id = user_id
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
            coordinates=coordinates
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
            pass
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
        if self._check_if_player_can_move_and_update(move_cost):
            Player.objects.filter(id=player_id).update(
                coordinates=coord
            )
            return True
        return False
        
    
    def player_travel_to_destination(self, warpzone_home_name: str, warpzone_home_id: int) -> Optional[Tuple[int, Dict[str, int]]]:
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
            
        try:
            warpzone_home = SectorWarpZone.objects.filter(
                warp_home_id=warpzone_home_id,
                warp_home_id__name=warpzone_home_name,
                warp_home_id__sector_id=player_sector_id
            ).values_list('warp_destination_id__sector_id', flat=True).first()
            
            destination_sector_id = warpzone_home
            
            player_spaceship = self.get_player_ship_size()
            if not player_spaceship:
                return None
                
            ship_size = player_spaceship['ship_id__ship_category_id__size']
            spaceship_size_x = ship_size['x']
            spaceship_size_y = ship_size['y']

            padding_w = spaceship_size_x + self.MIN_PADDING
            padding_h = spaceship_size_y + self.MIN_PADDING
            
            destination_cell = self._calculate_destination_coord(
                destination_sector_id, 
                spaceship_size_x, 
                spaceship_size_y, 
                padding_h, 
                padding_w
            )
            
            if destination_cell:
                return destination_sector_id, destination_cell
                
        except SectorWarpZone.DoesNotExist:
            pass
        return None
    
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

    def set_spaceship_statistics_with_module(self):
        """Placeholder pour les statistiques du vaisseau avec modules."""
        pass