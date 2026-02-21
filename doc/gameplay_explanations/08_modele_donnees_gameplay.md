# 08 - Modele de donnees gameplay

## Entites monde (core/models.py)

- Carte/secteur: `Sector`, `Warp`, `WarpZone`, `SectorWarpZone`, `Security`, `Faction`.
- Foreground: `Planet`, `Asteroid`, `Station` (+ ressources associees).
- Joueur/vaisseau: `Player`, `PlayerShip`, `Ship`, `ShipCategory`, `PlayerShipModule`.
- NPC: `Npc`, templates et skills associes.
- Competences: `Skill`, `PlayerSkill`.
- Communication/logs: `Message`, `PrivateMessage`, `PlayerLog`, statuts de lecture.
- Renseignement: `ScanIntel`, `ScanIntelGroup`.

## Etat runtime critique

- Position (`coordinates`), AP (`current_ap`), mouvement (`current_movement`), hull/shields.
- Modules installes et effets (`module.effect`) conditionnent les actions possibles.
- Visibilite (`visible_zone`, scans actifs) conditionne information exploitable.

## Construction des payloads gameplay

- `core/backend/get_data.py` assemble carte, acteurs, modules, ranges, tailles.
- `core/backend/store_in_cache.py` (utilise par consumer/views) sert de cache secteur.
- `core/backend/modal_builder.py` reconstruit des snapshots precis pour UI modales.
