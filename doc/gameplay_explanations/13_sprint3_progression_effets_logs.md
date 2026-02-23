# 13 - Sprint 3: progression, buffs/debuffs, logs (spec)

## Objet

Ce document couvre les systemes transverses relies au combat et au gameplay runtime:

- XP / niveaux de competences
- scan conteste (Electronic Warfare vs Counter Electronic Warfare)
- buffs / debuffs temporises
- logs gameplay (joueur / cible / observateurs)
- reputation (feature reportee, regles de base fixees)

## XP / progression (regles validees)

### Principes

- XP gagnee a l action (active ou passive).
- Les gains d XP ne sont pas logges.
- Les gains de niveau le sont, uniquement pour le joueur concerne.
- Les groupes donneront un bonus XP plus tard (systeme de group pas encore finalise).

### Regle speciale validee

### Difficulte XP par couleur (type MMORPG)

Objectif: moduler le gain d XP selon la difference de puissance entre attaquant et cible.
La puissance est estimee par la moyenne des `tier` des modules equipes sur le vaisseau.

- `avgTierAttaquant` = moyenne des `tier` modules equipes attaquant
- `avgTierCible` = moyenne des `tier` modules equipes cible
- `deltaTier = avgTierCible - avgTierAttaquant`

Mapping couleur (exemple propose, a valider):

- `Rouge` (cible beaucoup plus forte): `deltaTier >= +3.0` => XP * `1.15`
- `Orange` (cible plus forte): `+1.5 <= deltaTier < +3.0` => XP * `1.05`
- `Jaune` (niveau equivalent): `-1.0 < deltaTier < +1.5` => XP * `1.00`
- `Vert` (cible plus faible): `-3.0 <= deltaTier <= -1.0` => XP * `0.60`
- `Gris` (cible sans chance): `deltaTier < -3.0` => XP * `0.00`

Notes:
- Les seuils sont exprimes en moyenne de `tier` et peuvent etre ajustes.
- Ce facteur s applique apres le calcul base d XP, avant bonus de groupe.

### Exemples d actions actives

- Attaque `THERMAL` -> XP competence `Thermal Weapon`
- Deplacement -> XP competence de pilotage (taxonomy de skill selon type/taille de vaisseau a definir)

### Exemples d actions passives

- Esquive reussie -> XP `Evasive Maneuver`
- Resistance a un effet `ELECTRONIC_WARFARE` / scan -> XP `Counter Electronic Warfare`

## Scan conteste (PC/NPC uniquement)

### Perimetre valide

- Concerne les scans `PC/NPC` uniquement
- Ne s applique pas aux scans foreground (`asteroid`, `star`, etc.)

### Intention de design

Un scan de joueur devient un test oppose:

- Attaquant/scanner: `Electronic Warfare`
- Cible: `Counter Electronic Warfare`

### Resultat attendu

- reussite scan -> `scan_result` normal
- echec scan -> event explicite (ex: `scan_failed`) + feedback UI + logs (scanner/cible)

## Buff / Debuff (modules, timers, logs)

## Regles validees

- Buffs/debuffs = effets temporises appliques via modules installes
- Positifs ou negatifs
- Doivent etre visibles dans les stats runtime (impact reel, pas seulement UI)
- Doivent etre logges pour lanceur et cible

### Exemples cibles

- Buff: `targeting system lv-2` -> bonus precision (self ou cible) pendant X minutes
- Debuff: `jammer lv-2` -> malus precision (ex: -5%)

### Proposition data model (modules)

Tu proposes un sous-type (ex: `BUFF`, `DEBUFF`).

Proposition minimale compatible existant:

- conserver `type` module principal
- ajouter dans `module.effect` des champs standardises, ex:
  - `effect_kind`: `BUFF` / `DEBUFF`
  - `effect_stat`: `precision` / `evasion` / ...
  - `effect_value`: `+5` / `-5`
  - `duration_sec`: `120`
  - `stacking`: `replace` / `refresh` / `stack`

Plus tard si besoin: vraie colonne DB `module_subtype`.

### Runtime effets (backend)

Besoin d un stockage d effets actifs (DB ou cache persistant) avec:

- `source_key`
- `target_key`
- `effect_type`
- `value`
- `expires_at`
- `module_id`
- `stacking_policy`

### WS / UI

- event application effet (buff/debuff)
- event expiration effet
- patch stats via `entity_state_update` ou event dedie
- logs cote joueur/cible

## Logs (proposition d evolution)

Tu as deja un modele role-based utile (`lanceur`, `receveur`, `observateur`).
C est une bonne base.

### Proposition d amelioration (sans casser l existant)

Standardiser les logs par type avec payload structure:

- `COMBAT_ATTACK`
- `COMBAT_EVADE`
- `COMBAT_DEATH`
- `SCAN_SUCCESS`
- `SCAN_FAIL`
- `EFFECT_APPLIED`
- `EFFECT_EXPIRED`
- `LEVEL_UP`
- `REPUTATION_CHANGE`

Payloads JSON simples, pour permettre:

- rendu UI localise
- audit/debug
- analytics plus tard

## Reputation (feature reportee, regles figees)

### Regles validees

Le calcul se fait a la mort (pas a chaque coup).

Si X (et participants) tue Y:

- meme faction: perte dans cette faction
- faction differente: gain dans faction de X, perte dans faction de Y

Chaque gain/perte est logge uniquement pour le joueur concerne.

### Dependances

- tracking de participation (assist/kill) stable
- attribution de kill stable
- systeme factions NPC disponible

## Ordre recommande d implementation (progression/effets)

1. XP active/passive + level up logs
2. Scan conteste `EWAR` vs `Counter EWAR` (PC/NPC)
3. Buff/debuff minimal (precision/evasion)
4. Reputation (apres tracking participation/mort stabilises)
