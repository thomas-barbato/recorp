# 12 - Sprint 3: mort, carcasses, respawn (PC/NPC)

## Objet

Spec fonctionnelle/technique pour la gestion de la mort et de l apres-combat:

- mort joueur (PC)
- mort NPC
- carcasses temporaires
- loot/scavenge
- respawn PC/NPC

## Regles validees

### Mort PC

- Fermer les modals ouverts du joueur mort.
- Afficher un overlay rouge sombre + modal central de mort (clic pour revivre).
- Afficher: coordonnees, heure de mort, destination de resurrection, tueur.
- Retirer tous les buffs/debuffs actifs.
- Respawn: HP / shields / movement au max, AP conserve tel quel (pas reset max).
- Retour au point de bind (bind via WS `action_respawn`).
- Le joueur perd son vaisseau actuel (hors assurance, feature reportee).
- Le joueur reapparait avec un vaisseau gratuit (temporaire: `Ship.id = 1`).
- Le joueur ne recupere pas ses modules (sauf future assurance, hors scope).

### Mort NPC

- Meme logique carcasse (restera en jeu pendant TTL).
- Respawn apres delai configurable.
- Respawn a la position de depart (ou position libre proche).
- Stats remises au max + soute regeneree depuis `NpcTemplateResource`.

### Carcasse (PC et NPC)

- Le vaisseau detruit reste sur la carte pendant un TTL (test: 60 secondes).
- La carcasse n appartient a personne.
- Fouille de soute possible (loot ressources de soute).
- Les modules installes sont lootables avec une chance par module.
- Action `scavenge` possible si module `GATHERING` nomme `scavenging module`.
- `scavenge` restituera plus tard des ressources de craft du vaisseau (mapping craft a definir plus tard).

## Proposition de modele de donnees

### Decision de modelisation (retenue)

- `Player.status` porte l etat de vie du joueur (`ALIVE` / `DEAD`)
- `PlayerShip` reste un objet possede (le joueur peut en avoir plusieurs, `is_current_ship` indique lequel est actif)
- La carcasse est un objet monde distinct -> table `ShipWreck` (ownerless)

Pourquoi:

- le joueur peut etre mort (en attente de `revive`) alors que son ancien vaisseau est deja devenu une carcasse
- `PlayerShip` ne doit pas etre detourne en objet monde sans proprietaire
- le systeme d assurance futur sera plus simple a brancher (source = vaisseau detruit, restitution separee)

### 1. Bind joueur (valide)

Choix retenu: table dediee `PlayerBind` (plus extensible qu une simple colonne `Player`).

Proposition minimale:

- `id`
- `player_id` (FK Player, unique)
- `sector_id` (FK Sector)
- `x`
- `y`
- `bound_at`
- `bound_on_type` (planet/station)
- `bound_on_id`

Avantages:

- extensible (historique/cooldowns/types de bind plus tard)
- evite de surcharger `Player`

### 2. Carcasses (nouvelle table retenue)

Proposition `ShipWreck`:

- `id`
- `origin_type` (`PC` / `NPC`)
- `origin_player_id` (nullable)
- `origin_npc_id` (nullable)
- `sector_id`
- `x`, `y`
- `ship_id` (type du vaisseau detruit)
- `created_at`
- `expires_at`
- `status` (`ACTIVE`, `LOOTED`, `SALVAGED`, `EXPIRED`)
- `killer_player_id` (nullable)
- `metadata` JSON (optionnel)

Version minimale implementee (Sprint 3 en cours):

- `origin_type`
- `origin_player_id` / `origin_npc_id`
- `killer_player_id`
- `sector_id`
- `ship_id`
- `coordinates` (JSON)
- `status`
- `expires_at`
- `metadata`

### 3. Modules lootables de carcasse

Option simple (recommandee): snapshot modules au moment de la mort dans une table associee `WreckModuleDrop`:

- `wreck_id`
- `module_id`
- `drop_chance`
- `is_available`

### 4. Ressources de carcasse / soute

Reutiliser le concept de ressources via une table associee `WreckResource` (analogue a `PlayerShipResource` mais cible = carcasse).

### 5. Respawn NPC

Tu proposes `starting_pos` JSON dans `Npc`. C est acceptable pour demarrer vite.

Format propose:

```json
{"sector_id": 12, "x": 45, "y": 17}
```

Alternative plus normalisee (plus tard): table de spawn points NPC.

## Flux serveur: mort -> carcasse -> respawn

### PC (version cible Sprint 3)

1. Detecter mort pendant resolution combat
2. Persister event de mort + logs
3. Construire carcasse (snapshot ship/resources/modules lootables)
4. Retirer buffs/debuffs actifs du joueur
5. Remplacer visuellement acteur vivant par carcasse (WS)
6. Ouvrir etat `dead` cote client (overlay de mort)
7. Au clic revivre (WS `action_respawn`):
   - lire `PlayerBind`
   - creer/attribuer vaisseau gratuit (`Ship.id=1`)
   - reset stats (HP/shields/movement max, AP conserve)
   - spawn au bind (ou position libre proche)
   - notifier secteur(s)

### NPC

1. Detecter mort
2. Creer carcasse
3. Retirer NPC vivant de la map
4. Planifier respawn (deadline)
5. Au respawn:
   - trouver position `starting_pos` ou case libre proche
   - restaurer stats max
   - reconstruire soute depuis `NpcTemplateResource`
   - notifier `npc_added`

## WS / UI cibles (a ajouter)

### Pour la mort PC (joueur concerne)

- `player_death`
  - `killer_key`
  - `death_at`
  - `death_position`
  - `respawn_bind`

### Pour le secteur (observateurs)

- `entity_death` (ou `combat_death`)
- `wreck_created`
- plus tard: `wreck_expired`, `wreck_looted`, `wreck_salvaged`, `npc_respawned`

## Logs (mort)

Les logs de mort doivent etre differencies selon role:

- victime
- tueur (et participants)
- observateur secteur

Le moteur de logs existant (roles `TRANSMITTER` / `RECEIVER` / `OBSERVER`) peut etre reutilise avec un `log_type` dedie (`DEATH`, `WRECK_CREATED`, etc.).

## Decoupage implementation recommande

1. Hook de mort + event WS `entity_death`
2. Overlay mort PC (UI) + `action_respawn` WS
3. `PlayerBind` + bind/resurrect basique
4. Carcasse DB + rendu map simple
5. Loot soute
6. Loot modules avec chance
7. Respawn NPC
8. `scavenge` (ressources de craft)
