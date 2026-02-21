# 09 - Flux WS par pan gameplay

## Mouvement

```text
Input click/ordre mouvement
-> Front (pathfinding local)
-> WS: async_move
-> GameConsumer._handle_move_request
-> Validation + update DB/cache
-> Broadcast: player_move (+ update_mp)
-> move_handlers.js
-> animation + HUD + modal live + redraw
```

## Scan

```text
Action scan en modal
-> WS: action_scan_pc_npc
-> GameConsumer._handle_scan_action_pc_npc
-> ActionRules.upsert_scan / partage groupe
-> Broadcast: scan_result | scan_share_to_group | scan_state_sync
-> modal_action_handlers.js
-> effet scan local + refresh modales + redraw
```

## Combat

```text
Action attaque
-> WS: action_attack
-> GameConsumer._handle_combat_action
-> combat_engine.resolve_combat_action
-> Broadcast: combat_events + entity_state_update
-> combat_handlers.js + modal_action_handlers.js
-> animations + logs + HUD + runtime actor hydration
```

## Warp

```text
Action warp
-> WS: async_warp_travel
-> backend travel logic
-> Broadcast: async_warp_complete | async_warp_failed
-> warp_handlers.js
-> close combat scene + reload secteur (success)
```

## Chat / messages

```text
Saisie chat
-> WS: async_chat_message
-> consumer chat branch
-> Broadcast canal
-> chat_modal.js (append + unread)

Message prive
-> WS: async_send_mp
-> backend dispatch recipients
-> events async_sent_mp / async_recieve_mp
-> message_handlers.js + UI notif
```

## Synchronisation defensive

```text
Client ping + hash
-> WS: ping
-> consumer genere server hash
-> pong(sync_required)
-> client peut declencher request_data_sync
```
