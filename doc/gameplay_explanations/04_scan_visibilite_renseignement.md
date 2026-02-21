# 04 - Scan, visibilite, renseignement

## Regles backend scan

`core/backend/action_rules.py`:

- `upsert_scan` cree un scan actif (TTL court, 30s observe dans code).
- `share_scan_to_group` partage au groupe.
- `get_visible_scans_for_player` fusionne scans directs + partages.
- `invalidate_expired_scans` et invalidation cible/receiver.

## Flux frontend scan

`handlers/modal_action_handlers.js`:

- `getScanResult` : enregistre effet scan, hydrate cache modal scanne, retire AP local, redraw.
- `sendScanResultToGroup` : propage scan partage cote receveur.
- `handleScanStateSync` : resync complet des scans a la connexion/reco.
- `handleScanVisibilityUpdate` : purge scan expire/invalide et re-render modales.

## Effet gameplay

- Un target non scanne reste partiellement inconnu (`unknown-*`, stats masquees dans certaines scenes).
- Le scan impacte directement l accessibilite des infos en modal et certaines interactions de combat.

## Flux WS (detail v2)

```text
Action scan
-> action_scan_pc_npc
-> upsert scan + TTL
-> broadcast scan_result
-> client: registerEffect + cache modal + AP update + redraw

Expiration
-> invalidate_expired_scans
-> effects_invalidated / scan_visibility_update
-> purge etat scan + rebuild modal unknown
```

## Points techniques a refactor (v2)

- Centraliser la source de verite scan (Set + meta + cache modal actuellement distribues).
- Uniformiser events expiration (`scan:expired`, WS invalidation) pour eviter divergence UI.
- Ajouter tests de coherence scan partage groupe vs scan direct.
