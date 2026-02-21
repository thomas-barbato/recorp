# 00 - Overview gameplay

## Architecture generale

- Backend Django/Channels : logique metier, validation d actions, persistance, diffusion WS.
- Frontend canvas engine : rendu de carte, interactions joueur, HUD, modales et animations.
- Canal temps reel : WebSocket par secteur (`/ws/play_<room>/`) pour tous les evenements gameplay.
- Cache de secteur : utilise pour synchronisation et hash de coherence cote serveur.

## Entrees principales

- Vue de jeu : `core/views.py` (`DisplayGameView`) construit `map_informations`, `current_player_state`, `player_event_logs`.
- Template de jeu : `core/templates/core/game_elements/play.html` charge ecrans, panneaux, modales.
- Bootstrap moteur canvas : `recorp/static/js/game/world_builder/canvas_engine/main_engine.js`.

## Boucles gameplay majeures

1. Initialisation secteur + etat joueur.
2. Tick client (render/update/input).
3. Actions joueur -> WS -> backend rules/actions.
4. Broadcast serveur -> handlers front (`ActionRegistry`) -> HUD/map/modales.
5. Logs/evenements et etats derives (scan, combat, chat, warp).
