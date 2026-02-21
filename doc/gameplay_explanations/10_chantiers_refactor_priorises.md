# 10 - Chantiers refactor priorises

## P0 - Stabilite / coherence runtime

- Unifier les formats WS (`payload` vs `message`) pour reduire la logique de compatibilite dans `websocket_manager.js`.
- Supprimer les doubles bindings/listeners detectes (ex: appels repetes dans `action_scene_manager.js`).
- Encapsuler les globals `window.*` critiques (`canvasEngine`, `currentPlayer`, scan state) derriere un state container unique.

## P1 - Lisibilite et separation des responsabilites

- Decouper `core/consumers.py` en handlers par domaine (move, scan, combat, chat, sync).
- Isoler les side-effects DOM des handlers WS dans une couche UI adapter (moins de logique dans handlers).
- Introduire un contrat d evenement typé (schema JSON par `type`).

## P1 - Perf front/back

- Cote backend combat: limiter les hits DB repetes sur skills (`get_skill_level_for_actor`) via prefetch/cache contexte combat.
- Cote front: batch des redraws canvas suite a rafales WS (coalescing frame).
- Cote modales: eviter refresh complet quand un patch partiel suffit (HP/AP/coords deja dispo).

## P2 - Robustesse gameplay

- Formaliser les transitions d etat combat (idle -> engaged -> resolved) avec garde-fous serveur.
- Durcir les validations d actions (range, AP, ownership) avec erreurs normalisees et codes.
- Ajouter tests integration WS par scenario (scan expire, warp en combat, actor removed, reconnexion).

## P2 - Dette technique UX

- Harmoniser naming FR/EN des types/actions pour limiter ambiguite (`async_recieve_mp` typo, labels mixtes).
- Centraliser la gestion des notifications (chat/mp/combat/log) pour eviter duplication.
- Standardiser composants modales (open/close lifecycle, register/unregister live updates).

## Proposition de roadmap courte

1. Sprint 1: normalisation WS + split consumer + bugfix listeners.
2. Sprint 2: state container front + patching modal/hud unifie.
3. Sprint 3: optimisation combat DB + test suite WS scenario.
