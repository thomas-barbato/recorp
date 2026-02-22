# Mapping: doc

- Nombre de fichiers: 3

| Fichier | Extension | Role |
|---|---|---|
| `doc/Combat_ActionScene_Specification.md` | `.md` | Documentation Markdown. |
| `doc/uml.eddx` | `.eddx` | Schéma UML au format edition. |
| `doc/uml.jpg` | `.jpg` | Schéma UML. |

## Cartographie ciblee - Refactor runtime/modals (Sprint 1-2)

### Backend WS

- `core/consumers.py` : point d entree WS, dispatch `_dispatch_*`, normalisation envelope `payload/message`, scan/combat/sync.
- `core/backend/modal_builder.py` : construction des donnees modales (`pc`, `npc`, `sector_element`).

### Front - Etat / WS / patching

- `recorp/static/js/game/world_builder/canvas_engine/globals.js` : `window.GameState` (state container / bridge compat).
- `recorp/static/js/game/world_builder/canvas_engine/network/ws_actions.js` : registre des actions WS + routeur `entity_state_update`.
- `recorp/static/js/game/world_builder/canvas_engine/handlers/entity_state_patcher.js` : patching unifie runtime/HUD/modal (`HP/AP/MP + shields`).

### Front - Handlers gameplay / sync UI

- `recorp/static/js/game/world_builder/canvas_engine/handlers/move_handlers.js` : mouvements + sync MP/coords (GameState-first).
- `recorp/static/js/game/world_builder/canvas_engine/handlers/modal_action_handlers.js` : scan/share scan/sync scans + refresh modals/ranges.
- `recorp/static/js/game/world_builder/canvas_engine/handlers/warp_handlers.js` : warp/remove actor + purge scans + fermeture combat scene.
- `recorp/static/js/game/world_builder/canvas_engine/handlers/timers_handlers.js` : invalidation d effets (scan expiry) + refresh UI.
- `recorp/static/js/game/world_builder/canvas_engine/handlers/npc_handlers.js` / `sector_handlers.js` : sync map + redraw (quick wins GameState-first).

### Front - Modals actors / combat

- `recorp/static/js/game/world_builder/canvas_engine/modals/action_scene_manager.js` : modal combat live, listeners, distance/range, actions combat.
- `recorp/static/js/game/world_builder/canvas_engine/modals/modal_live_router.js` : patchs DOM live (HP/AP/MP/shields).
- `recorp/static/js/game/world_builder/modals/actors/actors_modal_actions.js` : actions PC/NPC/foreground, ranges, routeur foreground local.
- `recorp/static/js/game/world_builder/modals/actors/actors_modals.js` : construction modals + affichage ressources foreground selon scan.
- `recorp/static/js/game/world_builder/modals/actors/actors_modal_lifecycle.js` : open/close modal, fetch/caches scans, rebuild.
- `recorp/static/js/game/world_builder/modals/actors/actors_modal_data_mapper.js` : mapping data backend -> UI modal.
- `recorp/static/js/game/world_builder/modals/actors/modal_mode_manager.js` : bascule mode info/combat pour modals actors.

### Utilitaires

- `recorp/static/js/game/world_builder/utils/range_utils.js` : calculs de distance / portee (helper partage modules + combat).

