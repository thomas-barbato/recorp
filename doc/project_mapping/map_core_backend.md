# Mapping: core_backend

- Nombre de fichiers: 13

| Fichier | Extension | Role |
|---|---|---|
| `core/backend/__init__.py` | `.py` | Module Python applicatif. |
| `core/backend/action_rules.py` | `.py` | Regles metier des actions autorisees/interdites selon contexte de jeu. |
| `core/backend/combat_engine.py` | `.py` | Moteur de combat backend: resolution des actions, degats, effets et etats. |
| `core/backend/combat_engine_doc.md` | `.md` | Documentation fonctionnelle/technique du moteur de combat. |
| `core/backend/get_data.py` | `.py` | Acces et assemblage des donnees backend pour le client. |
| `core/backend/inter_channel_groups.py` | `.py` | Gestion des groupes de diffusion inter-canaux (temps reel). |
| `core/backend/modal_builder.py` | `.py` | Construction/formatage des payloads de modales backend. |
| `core/backend/modal_data.py` | `.py` | Preparation des donnees injectees dans les modales UI. |
| `core/backend/player_actions.py` | `.py` | Execution backend des actions joueur (interactions gameplay). |
| `core/backend/player_logs.py` | `.py` | Centralisation et ecriture des logs d activite joueur. |
| `core/backend/store_in_cache.py` | `.py` | Cache applicatif de donnees frequentes pour reduire les acces DB. |
| `core/backend/user_avatar.py` | `.py` | Logique de gestion des avatars utilisateur (upload/traitement). |
| `core/backend/validators.py` | `.py` | Validations metier backend (integrite des actions/donnees). |
