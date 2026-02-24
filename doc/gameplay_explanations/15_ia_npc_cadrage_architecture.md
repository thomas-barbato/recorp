# IA NPC - Cadrage, architecture et plan incremental

## Objectif

Conserver un cadrage clair pour l'implementation future de l'IA des NPCs sans bloquer les autres chantiers Sprint 3/4.

Ce document sert de reference de design et de priorisation:
- ce qui est souhaite (vision gameplay)
- ce qui est recommande techniquement (perf / simplicite)
- ce qui peut attendre (dependances non bloquantes)
- dans quel ordre implementer

## Contexte deja en place (utile pour l'IA)

- `NpcTemplate.behavior` existe (profil de comportement, incomplet mais utile comme point d'entree)
- `Npc.current_ap` / `Npc.max_ap` existent
- Respawn NPC minimal fonctionne (Celery + fallback lazy)
- `Npc.spawn_coordinates` existe (respawn fixe + recherche case libre proche)
- Carcasses (`ShipWreck`) + expiration + purge DB en place
- Combat backend evolue (mort, tracking participants, `combat_death`, etc.)

## Principe general recommande

### 1. IA "rule-based" + machine a etats (pas IA complexe)

Utiliser une IA deterministe, lisible et debuggable:
- `behavior` = profil global (ce que le NPC sait faire)
- `ai_state` = action courante (ce qu'il fait maintenant)

Exemples de `ai_state`:
- `IDLE`
- `PATROL`
- `ENGAGE`
- `ASSIST_ALLY`
- `FLEE`
- `GATHER`
- `RETURN_TO_MARKET`
- `SECURITY_INTERVENTION`

### 2. Actions espacees dans le temps (important perf)

Ne pas faire "reflechir" tous les NPCs a chaque tick.

Chaque NPC doit avoir un moment de prochaine action / prochaine decision:
- `next_action_at` (ou `next_think_at`)

Le tick IA ne traite que les NPCs "dus" (`next_action_at <= now`).

Resultat:
- moins de CPU
- moins de requetes DB
- moins de spam WS
- comportement plus naturel (patrouille / gather / commerce par etapes)

### 3. Execution serveur via scheduler (Celery)

Les comportements temporels ne doivent pas dependre d'une action joueur.

Utiliser Celery (deja installe) pour:
- `game_world_tick` (timers globaux: wreck expiry, respawn)
- futur `npc_ai_tick` (decisions IA)

Le "lazy" du consumer peut rester en fallback de secours, mais la source normale doit etre le scheduler.

## Exigences gameplay validees (rappel)

### AP des NPCs

Avant IA avancée:
- les NPCs doivent consommer / afficher des AP
- visible au scanner
- visible en combat (comme HP/MP/shields)

### Differencier combattants / non combattants

Le `behavior` du template doit servir a distinguer les grandes familles:
- combattants
- non combattants
- plus tard profils specialises (gatherer, trader, security, support...)

## NPC combattants - vision gameplay (cible)

Comportements souhaites (a etaler sur plusieurs phases):
- patrouiller dans leur secteur (deplacements espaces)
- attaquer a vue selon faction (au debut: attaquer seulement les PCs)
- ne pas poursuivre les joueurs (V1 simplifiee)
- prendre en compte la portee des armes (NPC + PC)
- utiliser modules scan / buff / debuff / repair
- choisir une cible si plusieurs a portee (priorite cible "forte")
- appeler a l'aide des NPCs de meme faction

### Recommandation d'implementation (MVP)

Commencer par:
- patrouille simple
- attaque a vue des PCs
- pas de poursuite
- respect portee
- appel a l'aide tres simple (optionnel V1.5)

Reporter pour V2:
- scan auto
- repair
- buffs/debuffs
- priorisation cible "avancee"

## Intervention de securite (Security / anti-PvP)

### Idee gameplay (validee)

Si un joueur attaque un autre joueur dans un secteur avec securite:
- chance d'intervention (`Security.chance_to_intervene`)
- spawn de NPCs de securite (`Security.ship_quantity`)
- spawn pres de l'agresseur (si cases libres)
- ils attaquent uniquement les agresseurs
- ils persistent jusqu'a:
  - leur mort (=> carcasse), ou
  - expiration (TTL de presence)

### Recommandation technique

Ne pas les melanger aux patrouilles "classiques".

Creer un profil/comportement dedie:
- `SECURITY_INTERVENTION`

Simplifications conseillees:
- pas de patrouille
- acquisition d'une cible parmi les agresseurs
- pas de logique economique
- despawn si plus de cible valide

## NPC non combattants - vision long terme

Exemples souhaites:
- non combattants (se defendent / fuient mais n'attaquent pas)
- gatherers (minerais sur `asteroid`/`satellite`)
- crafters (plus tard)
- transporteurs / traders inter-secteurs

### Recommandation perf (importante)

Simulation discrete par etapes (pas temps reel fin):
- `GATHER` -> cooldown
- `MOVE_TO_MARKET` -> pas espaces
- `SELL` -> cooldown
- `RETURN` -> cooldown

Chaque etape planifie la suivante (`next_action_at`).

## Protection des PCs au spawn/respawn (a prevoir)

Pour eviter les attaques injustes immediates:
- ajouter une protection temporaire apres spawn/respawn/arrivee secteur
- ex: `Player.pvp_protected_until`

Regles recommandees:
- les NPC hostiles ignorent les PCs proteges
- la protection tombe si le joueur attaque

## Choix de cible (combattants) - recommendation progressive

### V1 (simple)

Choisir la cible la plus "resistante" parmi celles a portee, avec un score simple:
- `score = hp + shields_total (+ bonus menace optionnel)`

### V2 (avance)

Ajouter:
- portee des armes de la cible
- estimation du danger / DPS
- priorite faction/groupe
- contexte scan/visibilite

## Appel a l'aide faction (recommendation)

Version simple:
- quand un NPC entre en `ENGAGE`, il emet une requete d'aide serveur (rayon limite)
- les allies proches en `IDLE/PATROL` passent `ASSIST_ALLY`
- cooldown pour eviter le spam

## Donnees a ajouter (proposees) - phase IA

### Sur `Npc` (runtime, prioritaire)

Propose pour l'IA (plus tard):
- `ai_state` (CharField)
- `next_action_at` (DateTimeField)
- `ai_context` (JSONField, optionnel)
- `last_help_call_at` (DateTimeField, optionnel)
- `last_combat_at` (DateTimeField, optionnel)

### Sur `NpcTemplate` (profil, optionnel au debut)

Deja present:
- `behavior`
- `respawn_delay_seconds`

Possibles plus tard:
- `patrol_interval_seconds`
- `aggro_range`
- `assist_radius`
- `despawn_delay_seconds` (pour security/interventions)
- flags d'usage modules (`can_scan`, `can_repair`, etc.)

## Architecture des ticks (recommandee)

### Tick monde global (deja present)

`game_world_tick`
- wreck expiry
- respawns NPC
- futurs timers gameplay simples

### Tick IA NPC (a ajouter plus tard)

`npc_ai_tick`
- traite uniquement les NPCs dus (`next_action_at <= now`)
- batch limite par tick si necessaire (ex: 50/100)
- log resumee (combien traites / deplaces / combats)

Important:
- eviter de scanner tous les NPCs a chaque tick
- separer "timers globaux" et "decisions IA"

## Plan d'implementation recommande (incremental)

### IA-1 (socle combattants)

- AP des NPC visibles (scan + modal combat)
- champs runtime IA minimum (`ai_state`, `next_action_at`) [si on les ajoute maintenant]
- patrouille simple (pas espaces)
- attaque a vue des PCs (sans poursuite)
- respect portee
- protection respawn PC (ignore cible protegee)

### IA-2 (coordination / securite)

- appel a l'aide faction (simple)
- intervention securite (`SECURITY_INTERVENTION`)
- TTL/disparition des forces de securite si plus de cible

### IA-3 (modules et priorites)

- scan auto
- repair
- buffs/debuffs
- choix de cible plus intelligent

### IA-4 (economie NPC)

- gatherers
- transporteurs
- crafters (apres systeme de craft)

## Ce qui n'est PAS bloquant pour commencer l'IA

On peut commencer IA-1 sans attendre:
- craft
- economie complete
- reputation
- buffs/debuffs complets
- assurance

Le but est d'eviter la situation:
"on ne peut pas faire X tant que Y n'existe pas"

=> On avance par versions fonctionnelles, avec degradations volontaires simples.

## Notes d'implementation pour Codex (memo orienté execution)

Quand on reprendra ce chantier:
- privilegier une implementation "MVP + instrumentation"
- verifier la charge DB par tick (nombre de queries)
- toujours garder l'autorite serveur (le front n'est qu'un miroir)
- reutiliser les flux WS existants quand possible (`npc_added`, `player_move`, `combat_events`, `entity_state_update`)
- documenter chaque nouveau comportement (`behavior` -> effet concret)

## Questions ouvertes (a trancher plus tard)

- format exact de `behavior` (enum simple vs combinaison de flags)
- IA state en DB ou en cache (ou mixte)
- strategie de batch par tick (global vs par secteur actif)
- spawn/protection PvP: duree exacte
- TTL exact des NPCs de securite
- niveau de simulation economique reel vs abstrait

