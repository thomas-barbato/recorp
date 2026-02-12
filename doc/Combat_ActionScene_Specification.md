# Spécification Fonctionnelle Détaillée -- Combat ActionScene

## 1. Objectif de la fonctionnalité

Le **Combat ActionScene** remplace le menu d'attaque actuel intégré dans
les modals PC/NPC par une scène dédiée au combat.

Cette scène :

-   Est exclusive (bloque les autres interactions)
-   Est orientée interface uniquement (UI)
-   Ne modifie pas la logique serveur existante
-   Utilise strictement les flux WebSocket déjà en place
-   Est conçue pour être extensible à d'autres types d'actions (E-WAR,
    Gathering, etc.)

------------------------------------------------------------------------

## 2. Philosophie Générale

Le Combat ActionScene est une **couche d'interface spécialisée**, pas un
nouveau système de gameplay.

Le serveur reste l'unique source de vérité.

Le client : - Affiche - Met à jour dynamiquement - Observe les
événements - N'introduit aucune logique parallèle

------------------------------------------------------------------------

## 3. Conditions d'ouverture

Lorsqu'un joueur clique sur « Attaquer » :

1.  Vérifier la présence d'au moins un module WEAPONRY.
2.  Si aucun module :
    -   Afficher l'erreur existante.
3.  Si modules disponibles :
    -   Fermer le modal cible.
    -   Ouvrir `ActionScene(type="combat")`.
4.  Si la cible n'existe plus (warp ou destruction avant ouverture) :
    -   Ne pas ouvrir la scène.

------------------------------------------------------------------------

## 4. Exclusivité et Blocage

Pendant que le Combat ActionScene est actif :

-   Le joueur ne peut pas se déplacer.
-   Le joueur ne peut pas interagir avec la carte.
-   Le joueur ne peut pas ouvrir d'autres modals.
-   Le joueur peut fermer manuellement la scène.

Une seule ActionScene peut être active simultanément.

------------------------------------------------------------------------

## 5. Structure de la scène

### 5.1 Header

Reprise identique du header du modal cible : - Nom - Coordonnées - Style
visuel - Timer de scan si actif

------------------------------------------------------------------------

### 5.2 Distance

Affichage centré de la distance actuelle entre attaquant et cible.

La distance : - Utilise la même logique worker que le système de portée
existant. - Se met à jour dynamiquement lors des mouvements. - Est
recalculée uniquement lors d'événements (pas de boucle continue).

------------------------------------------------------------------------

### 5.3 Preview Canvas

Canvas léger interne affichant :

-   Vaisseau joueur (gauche)
-   Vaisseau cible (droite)

Règles : - Si cible hors sonar et non scannée → affichage jaune. - Pas
de pathfinding. - Pas de boucle d'animation. - Redraw uniquement lors de
changements d'état.

------------------------------------------------------------------------

### 5.4 Statistiques

Affichage côte à côte :

Attaquant \| Cible

-   HP
-   MP
-   AP
-   SHIELD

Mise à jour via `entity_state_update`.

------------------------------------------------------------------------

### 5.5 Modules

Chaque module peut être dans l'état :

-   ENABLED
-   DISABLED_RANGE
-   DISABLED_AP
-   DISABLED_DEAD

Les états sont recalculés lors de : - Mouvement - Variation AP - Mort
joueur - Mort cible

Les boutons utilisent strictement le flux WebSocket existant.

------------------------------------------------------------------------

### 5.6 Log de combat

Alimenté uniquement par : - `combat_events`

Ne remplace pas le HUD existant. Agit en complément.

------------------------------------------------------------------------

## 6. Règles dynamiques

### 6.1 Mouvement de la cible

-   Le combat continue.
-   La distance est recalculée.
-   Les modules sont activés/désactivés dynamiquement.

Si la cible sort de portée mais reste dans le secteur : - Combat
actif. - Modules désactivés tant que hors portée.

------------------------------------------------------------------------

### 6.2 Warp

Si la cible warp : - Fermeture automatique de la scène. - Pas de
réouverture du modal cible.

Si le joueur warp : - Fermeture automatique.

------------------------------------------------------------------------

### 6.3 Mort

Si la cible meurt : - La scène reste ouverte. - Modules désactivés. -
Message "Cible détruite". - Fermeture manuelle par le joueur.

Si le joueur meurt : - Fermeture automatique. - Aucune réouverture.

------------------------------------------------------------------------

## 7. Protection contre le Refresh Automatique

Le système existant de refresh modal doit être désactivé tant que
l'ActionScene est active.

Aucun reopen automatique ne doit être autorisé pendant le combat.

------------------------------------------------------------------------

## 8. Machine d'état interne

États possibles :

-   ACTIVE
-   TARGET_DEAD
-   PLAYER_DEAD
-   TARGET_WARPED
-   CLOSED

Transitions :

ACTIVE → TARGET_DEAD (pas fermeture)\
ACTIVE → PLAYER_DEAD (fermeture automatique)\
ACTIVE → TARGET_WARPED (fermeture automatique)\
ACTIVE → CLOSED (manuel)

------------------------------------------------------------------------

## 9. Intégration WebSocket

La scène doit observer :

-   combat_events
-   entity_state_update
-   ship_removed
-   warp_complete

Sans modifier les handlers existants.

------------------------------------------------------------------------

## 10. Extensibilité future

Le système ActionScene doit permettre l'ajout futur de :

-   E-WAR
-   Gathering
-   Hacking
-   Boarding
-   Boss fight

Le Combat ActionScene est la première implémentation d'un système
générique extensible.

------------------------------------------------------------------------

## 11. Contraintes techniques

-   Aucun polling.
-   Aucun recalcul en boucle permanente.
-   Architecture event-driven uniquement.
-   Séparation stricte entre modals classiques et ActionScenes.
-   Pas de duplication de logique gameplay.
