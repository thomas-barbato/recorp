# Mapping: doc

- Nombre de fichiers: 3

| Fichier | Extension | Role |
|---|---|---|
| `doc/Combat_ActionScene_Specification.md` | `.md` | Documentation Markdown. |
| `doc/uml.eddx` | `.eddx` | Schéma UML au format edition. |
| `doc/uml.jpg` | `.jpg` | Schéma UML. |

## Cartographie ciblee - Refactor runtime/modals/combat (Sprint 1-3)

### Backend WS

- `core/consumers.py` : point d entree WS, dispatch `_dispatch_*`, normalisation envelope `payload/message`, scan/combat/sync.
- `core/backend/modal_builder.py` : construction des donnees modales (`pc`, `npc`, `sector_element`).
- `core/backend/combat_engine.py` : resolution combat backend (hit/miss/evade, damage shields/hull, distance, skills combat).

### Front - Etat / WS / patching

- `recorp/static/js/game/world_builder/canvas_engine/globals.js` : `window.GameState` (state container / bridge compat).
- `recorp/static/js/game/world_builder/canvas_engine/network/ws_actions.js` : registre des actions WS + routeur `entity_state_update`.
- `recorp/static/js/game/world_builder/canvas_engine/handlers/entity_state_patcher.js` : patching unifie runtime/HUD/modal (`HP/AP/MP + shields`).
- `recorp/static/js/game/world_builder/canvas_engine/handlers/combat_handlers.js` : handlers combat WS (`combat_events`, `combat_death`, `wreck_created`, `wreck_expired`) + cleanup UI.

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

### Sprint 3 - Mort / Carcasses / Respawn / Scheduler

- `core/models.py` : modeles `Player.status`, `ShipWreck`, `Npc.spawn_coordinates` (point de respawn fixe futur IA).
- `core/tasks.py` : tick gameplay Celery (`game_world_tick`) pour remplacer les traitements lazy (wreck expiry / respawn NPC).
- `recorp/celery.py` : configuration Celery + import explicite des tasks projet (`core.tasks`).
- `recorp/settings.py` : broker Redis + `CELERY_BEAT_SCHEDULE` (tick periodique).
- `core/backend/store_in_cache.py` : rebuild cache secteur (wrecks actifs) + exclusion des NPC `DEAD`.
- `recorp/static/js/game/world_builder/canvas_engine/renderers/map_data.js` : gestion runtime des `wrecks` (ajout/suppression/timer local), ajout dynamique NPC.
- `recorp/static/js/game/world_builder/canvas_engine/renderers/actors_renderer.js` : rendu visuel des carcasses (silhouette rouge).

