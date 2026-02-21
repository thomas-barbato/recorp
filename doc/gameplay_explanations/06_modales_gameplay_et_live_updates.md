# 06 - Modales gameplay et live updates

## Source des donnees modales

- Endpoint `core/views.py::modal_data_view`.
- Reconstruit DB-only via `core/backend/modal_builder.py`:
  - `build_pc_modal_data`,
  - `build_npc_modal_data`,
  - `build_sector_element_modal_data`.

## Systeme live modal

- `canvas_engine/modals/modal_live_registry.js` : registre des modales ouvertes (`pc_x`, `npc_y`).
- `canvas_engine/modals/modal_live_router.js` : patch DOM en temps reel (`ap_update`, `hp_update`, `mp_update`, range).
- `handlers/modal_action_handlers.js::entity_state_update` envoie les notifications `ModalLive.notify`.

## Modales metier hors canvas

- `modals/chat_modal.js` : channels secteur/faction/groupe, unread, marquage lu.
- `modals/events_modal.js` : pagination des logs gameplay.
- `modals/inventory_modal.js` : rendu modules et details d effets.
- `modals/actors/*` : shell, mapping data, lifecycle et actions des modales acteurs.

## Role gameplay

Les modales sont a la fois:
- un point d action (scan/attaque/etc.),
- un tableau de bord local,
- une surface reactive aux updates WS sans rechargement page.

## Flux WS (detail v2)

```text
entity_state_update
-> runtime actor hydrate
-> ModalLive.isOpen?
-> ModalLive.notify(updateType)
-> patchers DOM ciblent modal active
```

## Points techniques a refactor (v2)

- Factoriser patchers modal (hp/ap/mp) avec schema de payload stable.
- Ajouter lifecycle strict register/unregister pour eviter fuites listeners.
- Introduire tests UI headless sur patching modal en temps reel.
