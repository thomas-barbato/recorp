# 14 - Sprint 3: plan d implementation (phases)

## Objet

Plan de delivery Sprint 3, aligne sur les specs v2 combat/mort/progression.

## Phase 0 - Instrumentation / cartographie (court)

- Cartographier `consumers.py -> _handle_combat_action -> combat_engine.py`
- Ajouter timings/logs debug backend cibles (feature flag / logger)
- Mesurer les hotspots DB (skills/modules/updates)

## Phase 1 - Combat core v2

- Integrer bonus/malus taille + `Evasive Maneuver`
- Integrer visibilite `SCANNED/SONAR/UNKNOWN` pour precision PC/NPC
- Ajouter sortie `EVADE` exploitable cote front (animation MISS + label)
- Introduire tracker participation multi-attaquants par cible

## Phase 2 - Mort / carcasses / respawn (minimum viable)

- Hook de mort backend (PC/NPC)
- Event WS mort + logs secteur
- UI mort joueur (overlay + modal + clic revive)
- `PlayerBind` + `action_respawn` WS
- Respawn joueur avec vaisseau gratuit `Ship.id=1`
- Carcasse avec TTL (60s de test)

## Phase 3 - NPC respawn + loot/scavenge

- Respawn NPC via `starting_pos` JSON + recherche case libre proche
- Regen soute depuis `NpcTemplateResource`
- Fouille soute carcasse
- Loot modules avec chance
- Scavenge (hook + placeholder ressources craft si besoin)

## Phase 4 - Progression / effets

- XP active/passive + level up logs
- Scan conteste `EWAR` vs `Counter EWAR` (PC/NPC uniquement)
- Buff/debuff minimal (precision/evasion, timers, logs lanceur/cible)

## Phase 5 - Perf / tests WS scenarios

### Optimisations backend (ROI fort)

- Cache skills par resolution combat (eviter requetes `Skill`/`PlayerSkill`/`NpcTemplateSkill` repetitives)
- Cache modules cible / armes de riposte
- Grouper certaines ecritures DB de stats si possible

### Tests scenarios WS (prioritaires)

- attaque -> hit/miss/evade + updates etat
- kill PC -> UI mort + respawn WS
- kill NPC -> carcasse + respawn NPC
- warp pendant combat
- acteur retire pendant combat
- scan conteste reussite/echec
- buffs/debuffs application + expiration

## Definition of done Sprint 3 (proposee)

- Combat core v2 fonctionnel (evasion taille+skill + visibilite)
- Mort PC/NPC + carcasse TTL + respawn PC/NPC basiques
- Tracking participation stable (base assist/kill)
- XP de base + level-up logs
- Buff/debuff minimal avec timer
- Optimisation combat backend sur hotspots identifies
- Tests WS scenarios critiques en place

## Hors scope explicite (pour eviter derive)

- Assurance vaisseau
- Systeme de group complet (bonus XP futur seulement)
- Mapping craft complet des ressources de scavenge
- Reputation (si manque de temps; feature deja reportee)
