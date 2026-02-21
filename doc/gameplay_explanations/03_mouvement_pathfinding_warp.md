# 03 - Mouvement, pathfinding, warp

## Mouvement joueur

- Validation/metier backend dans `core/backend/player_actions.py`.
- Cote front : `handlers/move_handlers.js` traite `player_move` et `update_mp`.
- Effets clients:
  - animation de trajectoire si disponible,
  - maj coordonnees acteur,
  - recentrage camera,
  - maj HUD mouvement,
  - `ModalLive.notify` pour modales ouvertes,
  - recalcul distance scene de combat si active.

## Pathfinding

- Calculs canvas pathfinding dans `engine/canvas_pathfinding.js` et `engine/pathfinding.js`.
- Interaction case cible via callbacks input.

## Warp inter-secteurs

- Front `handlers/warp_handlers.js`:
  - construit payload `async_warp_travel`,
  - bloque actions concurrentes,
  - affiche loading screen,
  - gere succes/erreur (`async_warp_complete`, `async_warp_failed`).
- Sur completion, fermeture scene combat et reload secteur.

## Flux WS (detail v2)

```text
Click tile / ordre move
-> compute path local
-> async_move
-> validation backend
-> player_move
-> animate path + update MP + camera + modal live

Warp action
-> async_warp_travel
-> serveur resolve destination
-> async_warp_complete|failed
-> fermeture scene combat + reload secteur
```

## Points techniques a refactor (v2)

- Verrouiller clairement les actions concurrentes pendant warp/sync.
- Distinguer "state update" et "animation event" pour simplifier handlers mouvement.
- Ajouter rollback client explicite si mouvement refuse serveur.
