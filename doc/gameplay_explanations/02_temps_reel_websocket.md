# 02 - Temps reel WebSocket

## Backend consumer

`core/consumers.py` (`GameConsumer`):

- Gere connexion/deconnexion au groupe `play_<room>`.
- Rafraichit session, verifie auth, parse messages JSON.
- Route les types gameplay :
  - `ping` / `pong` avec hash serveur pour detection de desync.
  - `request_data_sync`, `request_scan_state_sync`.
  - `async_move`, `async_chat_message`, `async_send_mp`.
  - `action_scan_pc_npc`, `share_scan`, `action_attack`.
- Invalide periodiquement les scans expires via `ActionRules.invalidate_expired_scans` et broadcast `effects_invalidated`.

## Front dispatcher

- `engine/websocket_manager.js` : socket + reconnexion + dispatch local/global.
- `network/action_registry.js` : registre action -> handler.
- `network/ws_actions.js` : wiring des types WS vers handlers gameplay.

## Pattern d integration

1. Serveur envoie `{ type, payload/message }`.
2. WebSocketManager parse et dispatch.
3. Handler met a jour map/HUD/modales/effects.
4. Redraw canvas et feedback joueur (texte, barre AP/HP/MP, logs).

## Flux WS (detail v2)

```text
Front action/input -> WebSocketManager.send()
-> GameConsumer.receive()
-> branch metier (move/scan/combat/chat/sync)
-> channel_layer.group_send()
-> WebSocketManager._onMessage()
-> ActionRegistry.run(type)
-> handler domaine
-> maj runtime + HUD/modales + render
```

## Points techniques a refactor (v2)

- Normaliser le contrat des messages (`payload` unique, champs obligatoires).
- Extraire les branches `receive()` en sous-handlers testables.
- Ajouter telemetry minimale par type WS (latence, erreurs, retries).
