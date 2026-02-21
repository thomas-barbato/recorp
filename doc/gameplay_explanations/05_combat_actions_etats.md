# 05 - Combat, actions, etats

## Regles d action pre-combat

`core/backend/action_rules.py`:

- Autorisations action selon modules/range (`action_attack`, `action_scan`, `action_dock`, `action_mine`, `action_hail`).
- Distance calculee avec prise en compte tailles entites.

## Resolution combat

`core/backend/combat_engine.py`:

- Adapte PC/NPC via `ActorAdapter` (AP, HP, shields).
- Calcule bonus precision/degats/evasion depuis skills.
- Applique degats shield -> hull.
- Produit evenements combat (`CombatEvent`) et updates d etat.

## Reception combat cote client

- `handlers/combat_handlers.js`:
  - filtre les evenements pour le duel actif de la modal combat,
  - logs locaux (`addCombatLog`),
  - animations projectiles/hit/miss/evade,
  - maj HUD AP/HP/shields pour joueur local.
- `canvas_engine/modals/action_scene_manager.js`:
  - orchestre la scene de combat,
  - maintient contexte attaquant/cible,
  - gere fermeture automatique (warp/actor removed/invalid).

## Etat live entite

- Message `entity_state_update` hydrate le runtime actor (`ap`, `hp`, `shields`, `movement`, `position`) et notifie modales live.

## Flux WS (detail v2)

```text
Attaque joueur
-> action_attack
-> resolve_combat_action
-> combat_events + entity_state_update
-> combat_handlers + modal_action_handlers
-> logs + anim + HUD + runtime actor
```

## Points techniques a refactor (v2)

- Encapsuler `ActionSceneManager` (API publique) et supprimer appels internes `_handle*` externes.
- Introduire un event bus combat dedie pour separer UI, animations et etat.
- Reduire couplage DOM ids hardcodes (barres HP/AP/shields) via mapping unique.
