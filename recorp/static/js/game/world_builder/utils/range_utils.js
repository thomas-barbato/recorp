// UX ONLY 
(function () {
    function computeModuleRange({
        module,
        transmitterActor,
        receiverActor
    }) {
        // Pas de portée définie → illimitée
        if (module?.effect?.range == null) {
            return {
                allowed: true,
                reason: "no_range_limit",
                distance: null,
                maxRange: null,
                moduleRange: null,
                sizeBonus: null
            };
        }

        // Impossible de calculer la distance → ne pas bloquer
        if (!transmitterActor || !receiverActor) {
            return {
                allowed: true,
                reason: "actor_not_available",
                distance: null,
                maxRange: null,
                moduleRange: module.effect.range,
                sizeBonus: null
            };
            
        }

        const toInt = (v, fallback = 1) => {
            const n = Number.parseInt(v, 10);
            return Number.isFinite(n) && n > 0 ? n : fallback;
        };

        // ---- helpers taille ----
        const getSize = (actor) => {
            if (!actor) return { x: 1, y: 1 };

            // 1) MapData / worldObjects (PC, NPC, FOREGROUND)
            if (actor.sizeX != null || actor.sizeY != null) {
                return { x: toInt(actor.sizeX), y: toInt(actor.sizeY) };
            }

            // 2) Modal/back style: actor.data.ship.size
            const s1 = actor.data?.ship?.size;
            if (s1 && (s1.x != null || s1.y != null)) {
                return { x: toInt(s1.x), y: toInt(s1.y) };
            }

            // 3) Foreground legacy style: actor.size.x/y
            const s2 = actor.size;
            if (s2 && (s2.x != null || s2.y != null)) {
                return { x: toInt(s2.x), y: toInt(s2.y) };
            }

            // 4) Autres structures possibles
            const s3 = actor.ship?.size;
            if (s3 && (s3.x != null || s3.y != null)) {
                return { x: toInt(s3.x), y: toInt(s3.y) };
            }

            return { x: 1, y: 1 };
        };

        const getCenter = (actor, size) => {
            if (!actor) return null;

            // priorité à la position rendue (animation)
            const ax = (typeof actor.renderX === "number") ? actor.renderX : actor.x;
            const ay = (typeof actor.renderY === "number") ? actor.renderY : actor.y;

            if (typeof ax === "number" && typeof ay === "number") {
                return {
                    x: ax + (size.x - 1) / 2,
                    y: ay + (size.y - 1) / 2
                };
            }

            // fallback coordonnées "data"
            const c = actor.coordinates || actor.data?.coordinates || actor.data?.user?.coordinates || actor.data?.npc?.coordinates;
            if (c && typeof c.x === "number" && typeof c.y === "number") {
                return {
                    x: c.x + (size.x - 1) / 2,
                    y: c.y + (size.y - 1) / 2
                };
            }

            return null;
        };

        const transmitterSize = getSize(transmitterActor);
        const receiverSize   = getSize(receiverActor);

        const transmitterCenter = getCenter(transmitterActor, transmitterSize);
        const receiverCenter   = getCenter(receiverActor, receiverSize);

        if (!transmitterCenter || !receiverCenter) {
            return {
                allowed: true, // UX fail-open
                reason: "invalid_actor_position",
                distance: null,
                maxRange: null,
                moduleRange: module.effect.range,
                sizeBonus: null
            };
        }

        // Distance Chebyshev (grille carrée)
        const dx = Math.abs(transmitterCenter.x - receiverCenter.x);
        const dy = Math.abs(transmitterCenter.y - receiverCenter.y);
        const distance = Math.max(dx, dy);

        // Bonus taille
        const sizeBonus =
            (Math.max(transmitterSize.x, transmitterSize.y) - 1) / 2 +
            (Math.max(receiverSize.x, receiverSize.y) - 1) / 2;
        const maxRange = module.effect.range + sizeBonus;

        return {
            allowed: distance <= maxRange,
            reason: distance <= maxRange ? null : "out_of_range",
            distance,
            maxRange,
            moduleRange: module.effect.range,
            sizeBonus
        };
    }

    // exposition globale
    window.computeModuleRange = computeModuleRange;
})();