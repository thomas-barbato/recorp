# 11 - Sprint 3: spec combat v2 (pipeline serveur)

## Objet

Ce document fixe la comprehension fonctionnelle et technique du combat v2 avant implementation Sprint 3.
Il sert de contrat de travail pour:

- resolution combat backend
- evenements WS
- tracking participation (assist / kill)
- points d extension (mort, XP, buffs/debuffs, logs, reputation)

## Perimetre Sprint 3 (ordre de travail)

1. Cadrer le pipeline combat serveur canonique
2. Introduire tracking de participation multi-attaquants
3. Ajouter hooks de mort / logs / XP / buffs (reputation reportee)
4. Optimiser les hotspots DB du noyau combat
5. Poser les tests WS par scenarios

## Regles validees (issues des decisions gameplay)

- Esquive basee sur la taille du vaisseau + skill `Evasive Maneuver`.
- Malus de precision si cible `PC/NPC` non scannee et hors sonar.
- Le scan conteste (reussite/echec) ne concerne que `PC/NPC` (pas foreground).
- Participation au kill: conservee jusqu a sortie du combat / reset cible (pas une simple fenetre temporelle).
- Reputation: calculee au moment de la mort (pas a chaque coup).
- `gather` foreground reste hors scope combat (placeholder front accepte).

## Sources de donnees combat

### Taille du vaisseau (size)

- PC: `PlayerShip.ship -> Ship -> ShipCategory.size`
- NPC: `NpcTemplate.ship -> Ship -> ShipCategory.size`

### Skills (evasion / precision / contre-EWAR)

- PC: `PlayerSkill.level`
- NPC: `NpcTemplateSkill.level`

### Visibilite (precision)

- `SCANNED`: pas de malus
- `SONAR`: malus reduit (selon formule backend)
- `UNKNOWN` (hors sonar et non scanne): malus plus fort

## Pipeline canonique d une attaque (serveur)

### 1. Validation d entree (consumer)

- Verifier payload (`module_id`, cible, ownership, AP, secteur, etc.)
- Resoudre `source_ad` / `target_ad` (`ActorAdapter`)
- Verifier cible valide (vivante, presente, attaquable)
- Construire `WeaponProfile` depuis module
- Calculer distance et etat de visibilite

### 2. Resolution combat (noyau)

Pour UNE attaque:

- Lire bonus de precision/degats de l attaquant (skills + module)
- Lire bonus d esquive / defense de la cible
- Integrer modificateurs actifs (buffs/debuffs)
- Calculer hit chance finale
- Jet HIT / MISS
- Si HIT: jet EVASION (esquive)
- Si EVASION:
  - produire event `ATTACK_EVADED`
  - frontend: animation type MISS + label `EVADE`
- Si HIT confirme:
  - calcul degats
  - appliquer shield du type de degat puis hull
  - produire event `ATTACK_HIT`

### 3. Effets systemiques post-resolution (hooks)

Ordre recommande (important pour coherences):

1. MAJ AP attaquant / cible (si riposte)
2. MAJ HP/shields via `entity_state_update`
3. Enregistrement participation combat (attaquant(s) sur cible)
4. Detection mort cible / mort attaquant
5. Si mort:
   - evenement(s) de mort
   - logs secteur
   - hooks XP / reputation (si actifs)
   - hooks carcasse / respawn
6. Broadcast `combat_events`

## Participation multi-attaquants (assist / kill)

## Objectif

Conserver la participation de tous les attaquants ayant contribue a la cible, meme s ils ferment la modal combat pour agir ailleurs.

## Proposition technique

Introduire un tracker backend par cible, ex:

- cle: `target_key`
- valeur:
  - `participants`: map `attacker_key -> stats`
  - `first_hit_at`, `last_hit_at`
  - `damage_to_hull`, `damage_to_shield`
  - `last_attack_at`
  - `combat_open` / `reset_reason` (optionnel)

### Donnees minimales par participant

- `damage_total`
- `damage_to_hull`
- `damage_to_shield`
- `last_contribution_at`
- `is_final_blow` (a evaluer au kill)
- `is_counter_only` (utile si on veut filtrer certains gains plus tard)

### Reset du tracker cible

Le tracker se reset quand:

- cible morte
- cible warp / remove sector
- reset explicite du combat (a definir cote gameplay si besoin)

## Evenements WS (v2 cible)

### Existants a conserver

- `combat_events`
- `entity_state_update` (`hp_update`, `ap_update`)

### A ajouter (Sprint 3+)

- `combat_death` (ou `entity_death`)
- `combat_participation_update` (optionnel debug/admin, pas necessaire client gameplay)
- `effect_applied` / `effect_removed` (buff/debuff)

## Contrat de mort (hook)

La mort ne doit pas etre traitee comme simple suppression immediate de la map.
Elle declenche une chaine de resolution:

- creation carcasse
- logs de mort
- attribution gains/pertes (XP/reputation, selon scope actif)
- traitement respawn (PC/NPC)

Le retrait visuel de l acteur vivant du rendu map doit rester coherent avec la creation de la carcasse (remplacement, pas disparition simple).

## Hotspots perf identifies (pre-analyse)

Dans `core/backend/combat_engine.py` et `core/consumers.py`:

- `get_skill_level_for_actor(...)`:
  - requetes repetees `Skill` + `PlayerSkill` / `NpcTemplateSkill`
  - appele plusieurs fois par attaque (precision, evasive, crit, etc.)
- `ActorAdapter.set_hp/set_shield/spend_ap`:
  - plusieurs `save(update_fields=...)` pendant une seule resolution
- `_get_weapons_for_target(...)` (consumer):
  - queries modules cibles repetees a chaque attaque

## Priorites implementation (backend)

1. Context cache skills/modules pour une resolution combat
2. Tracking participation multi-attaquants
3. Hook de mort (sans toute la reputation au debut)
4. Instrumentation timings + compte requetes

## Questions encore ouvertes (a trancher avant code de prod)

- Formule exacte du bonus/malus de taille sur esquive (table ou formule)
- Definition precise du `reset cible` (quand la participation est purgee hors mort/warp)
- Politique de riposte vs attribution XP/kill/assist (ex: counter compte-t-il comme participation complete ?)
