# 01 - Boucle client canvas

## Bootstrap

`recorp/static/js/game/world_builder/canvas_engine/main_engine.js`:

- Initialise globals (`initGlobals`).
- Charge sprites (`SpriteManager`) et map (`MapData.prepare`).
- Instancie camera, canvases, renderer, input, pathfinding.
- Centre la camera sur le joueur courant.
- Ouvre un `WebSocketManager` sur le secteur courant.
- Lance `UpdateLoop` (FPS) et recalcule sur resize.

## Rendu et interaction

- Couche renderers (`canvas_engine/renderers/*`) : background, foreground, acteurs, UI.
- Input souris/touch (`engine/input.js`, `touch.js`) : hover, selection, click objet/case.
- Ouverture modales selon type d objet clique (pc/npc/foreground), avec variante `unknown-*` selon visibilite scan/sonar.

## Conventions runtime

- `window.canvasEngine` centralise map/renderer/ws/etat.
- `window.current_player_id` est la cle de filtrage local (HUD, AP/HP, animations).
- Le moteur combine donnees serveur (`map_informations`) + etat runtime hydrate par WS (`entity_state_update`).
