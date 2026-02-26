"""
Module de géométrie centralisé pour le système de grille du jeu.

Tous les calculs de distance, visibilité et détection doivent passer par ce module
pour éviter les incohérences entre les algos en JavaScript et Python.

Convention: Distance Chebyshev (max(|dx|, |dy|)) pour une grille 8-directionnelle.
"""

import logging
from typing import Dict, Literal

logger = logging.getLogger(__name__)


def compute_center(position: Dict, size: Dict = None) -> Dict[Literal['x', 'y'], float]:
    """
    Calcule le centre d'une entité basé sur sa position et taille.
    
    Args:
        position: {'x': int, 'y': int}
        size: {'x': int, 'y': int} (defaults to 1x1)
    
    Returns:
        {'x': float, 'y': float} - centre calculé
    """
    if size is None:
        size = {'x': 1, 'y': 1}
    
    size_x = size.get('x', 1) or 1
    size_y = size.get('y', 1) or 1
    
    return {
        'x': position['x'] + (size_x - 1) / 2.0,
        'y': position['y'] + (size_y - 1) / 2.0,
    }


def compute_chebyshev_distance(from_pos: Dict, to_pos: Dict, from_size: Dict = None, to_size: Dict = None) -> int:
    """
    Calcule la distance Chebyshev (distance de grille 8-directions).
    
    ✅ C'est la métrique correcte pour:
    - Combat (portée d'attaque)
    - Visibilité (range de vue)
    - Détection sonar
    - Mouvement
    
    Distance = max(|dx|, |dy|) où dx/dy sont mesurés ENTRE LES CENTRES des entités.
    
    Args:
        from_pos: {'x': int, 'y': int} - position de l'origine
        to_pos: {'x': int, 'y': int} - position de la cible
        from_size: {'x': int, 'y': int} - taille de l'origine (optionnel, défaut 1x1)
        to_size: {'x': int, 'y': int} - taille de la cible (optionnel, défaut 1x1)
    
    Returns:
        int: Distance en tiles (guaranteed >= 0)
    
    Examples:
        # Distance entre deux entités 1x1
        compute_chebyshev_distance({'x': 5, 'y': 5}, {'x': 8, 'y': 7})  # => 3
        
        # Distance entre deux planètes (4x4 chacune)
        p1 = {'x': 0, 'y': 0}
        p2 = {'x': 10, 'y': 10}
        compute_chebyshev_distance(p1, p2, {'x': 4, 'y': 4}, {'x': 4, 'y': 4})  # => ?
    """
    from_center = compute_center(from_pos, from_size)
    to_center = compute_center(to_pos, to_size)
    
    dx = abs(from_center['x'] - to_center['x'])
    dy = abs(from_center['y'] - to_center['y'])
    
    distance = int(max(dx, dy))
    
    return max(0, distance)  # Jamais négative


def is_in_range(from_pos: Dict, to_pos: Dict, range_tiles: int, from_size: Dict = None, to_size: Dict = None) -> bool:
    """
    Vérifie si une cible est à portée (distance Chebyshev).
    
    Args:
        from_pos: Position de l'observateur/attaquant
        to_pos: Position de la cible
        range_tiles: Portée en tiles
        from_size: Taille de l'observateur
        to_size: Taille de la cible
    
    Returns:
        bool: True si distance <= range_tiles
    """
    distance = compute_chebyshev_distance(from_pos, to_pos, from_size, to_size)
    return distance <= range_tiles


def get_tiles_in_range(center_pos: Dict, range_tiles: int, center_size: Dict = None, grid_width: int = 40, grid_height: int = 40) -> list:
    """
    Retourne toutes les coordonnées (tuples x,y) qui sont à portée.
    
    ✅ Alternative au buggy _calculate_view_range() en Euclidienne.
    
    Args:
        center_pos: Position centrale {'x': int, 'y': int}
        range_tiles: Portée en tiles
        center_size: Taille de l'entité centrale (pour le centre exact)
        grid_width: Largeur de la grille
        grid_height: Hauteur de la grille
    
    Returns:
        list: Coordonnées stringifiées comme "y_x" (format legacy)
    """
    center = compute_center(center_pos, center_size)
    center_x = center['x']
    center_y = center['y']
    
    result = []
    
    # Limite de recherche (avec marge pour les entités larges)
    search_range = int(range_tiles) + 2
    
    start_x = max(0, int(center_x - search_range))
    end_x = min(grid_width, int(center_x + search_range) + 1)
    start_y = max(0, int(center_y - search_range))
    end_y = min(grid_height, int(center_y + search_range) + 1)
    
    for y in range(start_y, end_y):
        for x in range(start_x, end_x):
            # Distance Chebyshev (correct!)
            dx = abs(x - center_x)
            dy = abs(y - center_y)
            distance = max(dx, dy)
            
            if distance <= range_tiles:
                result.append(f"{y}_{x}")
    
    logger.debug(f"[GEOMETRY] get_tiles_in_range: center={center}, range={range_tiles}, tiles_found={len(result)}")
    return result




def compute_euclidean_distance(from_pos: Dict, to_pos: Dict, from_size: Dict = None, to_size: Dict = None) -> float:
    """
    Calcule la distance Euclidienne entre les centres des entités.
    Utilisé pour des effets circulaires (sonar, explosions, zones de dégâts).

    Retourne un float (pas d'arrondi) pour permettre des comparaisons précises
    avec un rayon flottant. Les tuiles individuels sont "dans le cercle" si
    la distance entre le centre du sonar et le point le plus proche du rectangle
    de l'entité est <= rayon.
    """
    from_center = compute_center(from_pos, from_size)
    to_center = compute_center(to_pos, to_size)
    
    dx = from_center['x'] - to_center['x']
    dy = from_center['y'] - to_center['y']
    return (dx*dx + dy*dy) ** 0.5


def get_tiles_in_circle(center_pos: Dict, range_tiles: float, center_size: Dict = None, grid_width: int = 40, grid_height: int = 40) -> list:
    """
    Retourne les tuiles dont **n'importe quel point de l'entité** est à
    distance euclidienne <= range_tiles du centre.

    Cela reproduit exactement la même logique que le client utilise
    dans `sonar_system.js` (closest point to rectangle, dist squared).
    """
    center = compute_center(center_pos, center_size)
    center_x = center['x']
    center_y = center['y']
    
    result = []
    
    search_range = int(range_tiles) + 2
    
    start_x = max(0, int(center_x - search_range))
    end_x = min(grid_width, int(center_x + search_range) + 1)
    start_y = max(0, int(center_y - search_range))
    end_y = min(grid_height, int(center_y + search_range) + 1)
    
    for y in range(start_y, end_y):
        for x in range(start_x, end_x):
            # coordonnées du rectangle tile
            left = x
            right = x + 1
            top = y
            bottom = y + 1
            # point du rectangle le plus proche du centre
            closest_x = max(left, min(center_x, right))
            closest_y = max(top, min(center_y, bottom))
            dx = closest_x - center_x
            dy = closest_y - center_y
            if dx*dx + dy*dy <= range_tiles*range_tiles:
                result.append(f"{y}_{x}")
    
    logger.debug(f"[GEOMETRY] get_tiles_in_circle: center={center}, range={range_tiles}, tiles={len(result)}")
    return result


# ---- Backward compatibility ----
# Alias pour faciliter la migration
chebyshev_distance = compute_chebyshev_distance
