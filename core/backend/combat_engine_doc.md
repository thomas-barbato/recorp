# Architecture des Points d’Action (AP) – Système de Combat

## 🎯 Principe général

Dans le système de combat, la gestion des **Points d’Action (AP)** est assurée **exclusivement par la couche Consumer (WebSocket)**.

Le moteur de combat (`combat_engine.py`) est volontairement **totalement indépendant** de toute notion d’AP.

👉 Cette règle est **fondamentale** et ne doit jamais être contournée.

---

## 🧩 Répartition des responsabilités

### 🕸️ Couche Consumer (`consumers.py`)

Le consumer est l’**orchestrateur autoritaire** des actions de jeu.

Il est responsable de :

- Identifier le joueur émetteur de l’action
- Valider l’intention de l’action (attaque, scan, déplacement, etc.)
- Vérifier que le joueur dispose d’assez de Points d’Action
- Consommer les AP via `PlayerAction.consume_ap`
- Construire le contexte de combat (source, cible, module, distance, visibilité)
- Appeler le moteur de combat
- Diffuser les événements de combat via WebSocket
- Diffuser les mises à jour d’AP (`entity_state_update`)

❗ **Aucune logique de calcul de combat ne doit être implémentée dans le consumer.**

---

### ⚙️ Moteur de combat (`combat_engine.py`)

Le moteur de combat est une **boîte noire logique**, déterministe et autonome.

Il est responsable de :

- Résoudre les attaques (hit, miss, evade)
- Calculer les dégâts (shields → hull)
- Appliquer les effets de combat (riposte, buffs, debuffs, réparations)
- Générer une liste d’événements de combat (`CombatEvent`)

Le moteur de combat **ne doit jamais** :

- Vérifier les Points d’Action
- Consommer des AP
- Envoyer des messages WebSocket
- Accéder à l’utilisateur connecté
- Dépendre du contexte réseau ou de session

👉 Il doit pouvoir être exécuté :
- depuis un consumer
- depuis une IA NPC
- depuis un simulateur
- depuis des tests unitaires

---

## 🔄 Déroulement d’une action de combat

1. Le client envoie une intention d’action (ex: `action_attack`)
2. Le consumer reçoit le message WebSocket
3. Le consumer valide l’action et la cible
4. Le consumer vérifie les AP disponibles
5. Le consumer consomme les AP
6. Le consumer construit un objet `CombatAction`
7. Le consumer appelle `resolve_combat_action`
8. Le moteur retourne une liste de `CombatEvent`
9. Le consumer diffuse :
   - les événements de combat
   - la mise à jour des AP

---

## 🚫 Règles strictes (à ne jamais enfreindre)

- Le moteur de combat **ne doit jamais** consommer d’AP
- La logique AP **ne doit exister qu’à un seul endroit**
- Le client **ne doit jamais** envoyer ou modifier des AP
- Le moteur **ne doit jamais** faire confiance au client
- Le consumer reste l’unique autorité réseau

---

## ✅ Avantages de cette architecture

- Séparation claire des responsabilités
- Réduction des bugs liés à la synchronisation
- Facilité de maintenance et d’évolution
- Sécurité renforcée contre la triche
- Moteur de combat réutilisable et testable
- Meilleure lisibilité du code

---

## 🧠 Note de conception

Cette architecture a été choisie volontairement pour garantir :

- Un moteur de combat **pur et déterministe**
- Un contrôle strict des actions côté serveur
- Une intégration fluide avec le système WebSocket existant

Toute future évolution du système de combat **doit respecter cette séparation**.

---

## 🏁 Conclusion

👉 Les Points d’Action sont un **concept d’orchestration**, pas un concept de combat.  
👉 Le consumer décide **si** une action peut être faite.  
👉 Le moteur décide **ce que l’action produit**.

Cette règle est désormais **figée** dans l’architecture du projet.
