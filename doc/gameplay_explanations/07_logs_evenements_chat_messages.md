# 07 - Logs, evenements, chat, messages

## Event logs joueur

- Backend:
  - `core/views.py::get_player_logs` (historique pagine),
  - `core/views.py::get_player_logs_preview` (recent HUD).
- Front:
  - `events/events_hud.js` charge l historique initial,
  - `events/events_renderer.js` formate le texte selon type+role,
  - `events/events_config.js` map style/couleur par type.

## Chat temps reel

- UI et UX chat dans `modals/chat_modal.js`.
- WS type `async_chat_message` cote consumer.
- Lecture des historiques via endpoints `/chat/get/<channel>/`.
- Unread counters via `/chat/unread-counts/` et marquage lu par canal.

## Messages prives

- Endpoints `core/views.py` (`messages/*`) pour lecture/recherche/suppression/compteurs.
- WS utilise pour notification envoi/reception (`async_send_mp`, handlers message).

## Valeur gameplay

Les logs/chat/messages servent de couche de feedback social + traçabilite action (scan, attaque, changement de zone, etc.).

## Flux WS (detail v2)

```text
chat input -> async_chat_message -> broadcast -> appendMessage + unread
mp send -> async_send_mp -> ack sender + notify recipient
combat/scan events -> event_log -> renderer HUD/modal
```

## Points techniques a refactor (v2)

- Unifier la gestion unread (chat + mp) dans un service unique.
- Harmoniser endpoint + WS naming (typos et mix FR/EN).
- Ajouter dedup anti-double affichage lors de reconnect WS.
