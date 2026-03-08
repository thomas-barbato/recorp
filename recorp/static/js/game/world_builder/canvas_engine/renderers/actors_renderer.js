export default class ActorsRenderer {
    constructor(ctx, camera, spriteManager, map, sonar = null) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
        this.sonar = sonar || null;
        this._time = 0;

        // Animations en cours : Map<playerId, { segments, current, startTime }>
        this.activeAnimations = new Map();

        // Cache silhouettes (clé -> { points, imgW, imgH, step })
        this._dotCache = new Map();
    }

    render(delta = 0) {
        this._time += delta;

        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        // Met à jour les animations en cours (case par case)
        this._updateActorAnimations();

        this._getVisibleActors().forEach((actor) => {
            this._drawObject(actor, tilePx);
        });
    }

    hasActiveAnimations() {
        if (this.activeAnimations.size > 0) {
            return true;
        }

        const sonar = this.sonar || window.canvasEngine?.renderer?.sonar || null;
        return this._getVisibleActors().some((actor) => {
            if (!actor) return false;
            if (actor.type === "wreck") return true;
            if (window.isGroupMemberTarget?.(actor.id) === true) return true;

            const forcedVisible = window.isScanned?.(actor.id) === true;
            if (forcedVisible) return false;
            if (!sonar?.isVisible) return false;
            return sonar.isVisible(actor) === false;
        });
    }

    _intersectsViewport(worldX, worldY, sizeX = 1, sizeY = 1, paddingTiles = 0) {
        if (typeof this.camera?.intersectsWorldRect === "function") {
            return this.camera.intersectsWorldRect(worldX, worldY, sizeX, sizeY, paddingTiles);
        }

        const bounds = typeof this.camera?.getWorldBounds === "function"
            ? this.camera.getWorldBounds(paddingTiles)
            : {
                minX: Number(this.camera?.worldX || 0),
                minY: Number(this.camera?.worldY || 0),
                maxX: Number(this.camera?.worldX || 0) + Number(this.camera?.visibleTilesX || 0),
                maxY: Number(this.camera?.worldY || 0) + Number(this.camera?.visibleTilesY || 0)
            };

        return (
            worldX < bounds.maxX &&
            worldY < bounds.maxY &&
            (worldX + sizeX) > bounds.minX &&
            (worldY + sizeY) > bounds.minY
        );
    }

    _getVisibleActors() {
        const visibleActors = this.map?.getObjectsInViewport
            ? this.map.getObjectsInViewport(this.camera, {
                types: ["player", "npc", "wreck"],
                paddingTiles: 0
            })
            : (this.map.worldObjects || []).filter((obj) => {
                if (obj.type !== "player" && obj.type !== "npc" && obj.type !== "wreck") {
                    return false;
                }
                return this._intersectsViewport(obj.x, obj.y, obj.sizeX || 1, obj.sizeY || 1);
            });

        const seen = new Set(visibleActors);
        for (const playerId of this.activeAnimations.keys()) {
            const actor = this.map.findPlayerById?.(playerId);
            if (!actor) continue;

            const worldX = actor.renderX !== undefined ? actor.renderX : actor.x;
            const worldY = actor.renderY !== undefined ? actor.renderY : actor.y;
            const sizeX = actor.sizeX || 1;
            const sizeY = actor.sizeY || 1;
            if (!this._intersectsViewport(worldX, worldY, sizeX, sizeY)) continue;
            if (seen.has(actor)) continue;

            seen.add(actor);
            visibleActors.push(actor);
        }

        return visibleActors.sort((a, b) => (a?._renderOrder ?? 0) - (b?._renderOrder ?? 0));
    }

    /**
     * Animation simple (start -> end). Gardée pour compat mais non utilisée
     */
    addMovementAnimation(playerId, startX, startY, endX, endY) {
        const segments = [
            {
                startX,
                startY,
                endX,
                endY,
                duration: 350
            }
        ];

        this.activeAnimations.set(playerId, {
            segments,
            current: 0,
            startTime: performance.now()
        });
    }

    /**
     * Animation multi-segments : suit le path A* case par case.
     * path = [ {x,y}, {x,y}, ... ]
     */
    addMovementAnimationPath(playerId, path, options = {}) {
        if (!path || path.length === 0) return;

        // callback optionnel
        const onComplete =
            typeof options.onComplete === "function" ? options.onComplete : null;

        if (path.length === 1) {
            const actor = this.map.findPlayerById(playerId);
            if (actor) {
                this.map.setActorPosition?.(actor, path[0].x, path[0].y);
                delete actor.renderX;
                delete actor.renderY;
            }
            if (onComplete) {
                try {
                    onComplete();
                } catch (e) {
                    console.warn("ActorsRenderer: onComplete (single step) error:", e);
                }
            }
            return;
        }

        // ---- Animation multi-segments ----
        const segments = [];
        for (let i = 0; i < path.length - 1; i++) {
            segments.push({
                startX: path[i].x,
                startY: path[i].y,
                endX: path[i + 1].x,
                endY: path[i + 1].y,
                duration: 120
            });
        }

        this.activeAnimations.set(playerId, {
            segments,
            current: 0,
            startTime: performance.now(),
            onComplete  // 🔥 stocké ici
        });
    }

    /**
     * Met à jour toutes les animations de vaisseaux.
     * Utilise renderX / renderY pour l'affichage interpolé,
     * et met à jour actor.x / actor.y seulement à la fin.
     */
    _updateActorAnimations() {
        const now = performance.now();

        for (const [playerId, anim] of this.activeAnimations.entries()) {
            const actor = this.map.findPlayerById(playerId);
            if (!actor) {
                this.activeAnimations.delete(playerId);
                continue;
            }

            const seg = anim.segments[anim.current];
            if (!seg) {
                // Sécurité : plus de segments => nettoyage
                delete actor.renderX;
                delete actor.renderY;
                this.activeAnimations.delete(playerId);
                continue;
            }

            const t = (now - anim.startTime) / seg.duration;

            if (t >= 1) {
                // Fin de ce segment
                actor.renderX = seg.endX;
                actor.renderY = seg.endY;

                anim.current++;
                anim.startTime = now;

                // Si on vient de terminer le DERNIER segment
                if (anim.current >= anim.segments.length) {
                    this.map.setActorPosition?.(actor, seg.endX, seg.endY);
                    delete actor.renderX;
                    delete actor.renderY;
                    const cb = anim.onComplete;
                    this.activeAnimations.delete(playerId);

                    if (typeof cb === "function") {
                        try {
                            cb();
                        } catch (e) {
                            console.warn("ActorsRenderer: onComplete error:", e);
                        }
                    }
                    continue;
                }
                continue;
            }

            // interpolation ease-in-out
            const eased = t * t * (3 - 2 * t);
            actor.renderX = seg.startX + (seg.endX - seg.startX) * eased;
            actor.renderY = seg.startY + (seg.endY - seg.startY) * eased;
        }
    }

    _drawObject(obj, tilePx) {
        // Coordonnées monde : animées (renderX/Y) si présentes, sinon x/y
        const worldX = (obj.renderX !== undefined) ? obj.renderX : obj.x;
        const worldY = (obj.renderY !== undefined) ? obj.renderY : obj.y;

        const scr = this.camera.worldToScreen(worldX, worldY);
        const pxW = obj.sizeX * tilePx;
        const pxH = obj.sizeY * tilePx;

        const srcPath = obj.spritePath;
        const srcUrl = this.spriteManager.makeUrl ? this.spriteManager.makeUrl(srcPath) : srcPath;
        const img = this.spriteManager.get ? this.spriteManager.get(srcUrl) : null;

        if (obj.type === "wreck") {
            if (img) {
                this._drawSolidSilhouetteFromSprite(
                    img,
                    scr.x,
                    scr.y,
                    pxW,
                    pxH,
                    obj,
                    "rgba(239, 68, 68, 1)"
                );
            } else {
                this._drawDottedFallback(scr.x, scr.y, pxW, pxH, "rgba(239, 68, 68, 0.9)");
            }
            return;
        }

        // Sonar / visibilité
        const sonar =
            this.sonar ||
            (window.canvasEngine && window.canvasEngine.renderer && window.canvasEngine.renderer.sonar) ||
            null;

        const forcedVisible = window.isScanned(obj.id);

        const visible = forcedVisible || (sonar ? sonar.isVisible(obj) : true);

        // Highlight du joueur courant lorsque pathfinding actif
        const engine = window.canvasEngine;
        const pf = engine?.pathfinding;
        const showBorder = pf && (pf.current || pf.invalidPreview);
        const hover = window.canvasEngine?.hoverTarget || null;
        const isPcActor = (obj.type === "player") || (typeof obj.id === "string" && obj.id.startsWith("pc_"));
        const isCurrentPlayerActor =
            isPcActor &&
            String(obj.data?.user?.player) === String(window.current_player_id);
        const isGroupMemberActor =
            isPcActor &&
            !isCurrentPlayerActor &&
            window.isGroupMemberTarget?.(obj.id) === true;

        if (visible) {
            const isAnimating = obj.renderX !== undefined;

            // Blur léger sur le sprite animé
            if (isAnimating) {
                this.ctx.filter = "brightness(1.12) blur(0.45px)";
                this.ctx.globalAlpha = 0.9;
            } else {
                this.ctx.filter = "none";
                this.ctx.globalAlpha = 1;
            }

            // Dessin du sprite (flip géré dans _drawFullSprite)
            this._drawFullSprite(img, scr.x, scr.y, pxW, pxH, obj);

            // Bordure du joueur courant
            if (isCurrentPlayerActor) {
                this.ctx.save();
                this.ctx.shadowColor = "rgba(52, 211, 153, 0.8)";   // emerald 400 glow
                this.ctx.shadowBlur = 18;
                this.ctx.strokeStyle = "rgba(52, 211, 153, 0.9)";
                this.ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                this.ctx.setLineDash([4, 4]);
                this.ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                this.ctx.restore();
            }

            if (isGroupMemberActor) {
                const isReversedShip = Boolean(obj.data?.ship?.is_reversed);
                this._drawGroupMemberMarker(scr.x, scr.y, pxW, pxH, tilePx, isReversedShip);
            }

            // si pas survolé → pas de bordure
            if (hover && hover === obj) {
                const ctx = this.ctx;
                const sonarVisible = forcedVisible || (this.sonar ? this.sonar.isVisible(obj) : true);

                // On détermine le type via obj.id : "pc_23", "npc_25", etc.
                let isPc = false;
                let isNpc = false;
                let isCurrentPlayer = false;

                if (typeof obj.id === "string") {
                    if (obj.id.startsWith("pc_")) {
                        isPc = true;
                        const idNum = parseInt(obj.id.slice(3), 10);
                        const currentPlayer = window.currentPlayer;
                        const currentId = currentPlayer?.user?.player;
                        if (!Number.isNaN(idNum) && String(idNum) === String(currentId)) {
                            isCurrentPlayer = true;
                        }
                    } else if (obj.id.startsWith("npc_")) {
                        isNpc = true;
                    }else{
                    }
                }

                // Ton propre vaisseau : on NE TOUCHE PAS à la logique existante
                // (border orange pendant le pathfinding)
                if (isCurrentPlayer) {
                    // on laisse la bordure gérée plus haut (pathfinding)
                    // donc on n'ajoute rien ici
                } else {
                    ctx.save();
                    ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                    ctx.setLineDash([4, 4]);
                    // 🟡 Vaisseau hors sonar → jaune
                    if (!sonarVisible) {
                        ctx.strokeStyle = "rgba(250, 204, 21, 1)"; // yellow-400
                    } else {
                        // 🟥 NPC visible
                        if (isNpc) {
                            ctx.strokeStyle = "rgba(220, 38, 38, 1)"; // red-600
                        }
                        // 🟦 PC visible (autre que toi)
                        else if (isPc) {
                            ctx.strokeStyle = "rgba(34, 211, 238, 1)"; // cyan-400
                        }
                    }

                    ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                    ctx.restore();
                }
            }

            // Reset filtre
            this.ctx.filter = "none";
            this.ctx.globalAlpha = 1;
            return;
        }else{
            const isGroupMemberHidden = window.isGroupMemberTarget?.(obj.id) === true;
            if (hover && hover === obj && !isGroupMemberHidden) {
                const ctx = this.ctx;
                ctx.save();
                ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = "rgba(250, 204, 21, 1)"; // yellow-400
                ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                ctx.restore();
            }
        }

        // Non visible : silhouette "radar"
        if (img) {
            this._drawSolidSilhouetteFromSprite(img, scr.x, scr.y, pxW, pxH, obj);
        } else {
            this._drawDottedFallback(scr.x, scr.y, pxW, pxH);
            if (this.spriteManager && srcUrl) {
                this.spriteManager.ensure?.(srcUrl).catch(() => {});
            }
        }
    }

    _drawGroupMemberMarker(x, y, w, h, tilePx, isReversed = false) {
        const ctx = this.ctx;
        const minSide = Math.max(1, Math.min(w, h));
        const size = Math.max(8, Math.min(18, Math.round(minSide * 0.24)));
        const baseOffset = Math.max(2, Math.round(tilePx * 0.05));
        const maxSide = Math.max(w, h);
        const largeShipRatio = Math.max(0, Math.min(1, (maxSide - tilePx * 2) / (tilePx * 4)));
        const edgeOffset = baseOffset + Math.round(largeShipRatio * Math.max(2, baseOffset));
        const r = Math.round(size * 0.5);

        const rawCx = isReversed
            ? Math.round(x + w - edgeOffset - size * 0.5)
            : Math.round(x + edgeOffset + size * 0.5);
        const rawCy = Math.round(y + edgeOffset + size * 0.5);
        const cx = Math.max(Math.round(x + r + 1), Math.min(Math.round(x + w - r - 1), rawCx));
        const cy = Math.max(Math.round(y + r + 1), Math.min(Math.round(y + h - r - 1), rawCy));
        const pulse = 0.75 + 0.25 * Math.sin(this._time * 0.007);

        ctx.save();

        // Soft glow under the marker.
        ctx.globalAlpha = 0.75;
        ctx.shadowColor = `rgba(16, 185, 129, ${Math.max(0.55, pulse)})`;
        ctx.shadowBlur = Math.max(8, Math.round(size * 1.1));
        ctx.fillStyle = "rgba(16, 185, 129, 0.36)";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(5, Math.round(size * 0.58)), 0, Math.PI * 2);
        ctx.fill();

        // Main diamond marker.
        ctx.globalAlpha = 1;
        ctx.shadowBlur = Math.max(4, Math.round(size * 0.5));
        ctx.fillStyle = "rgba(16, 185, 129, 0.95)";
        ctx.strokeStyle = "rgba(167, 243, 208, 0.96)";
        ctx.lineWidth = 1.25;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner highlight dot for readability on bright sprites.
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(236, 253, 245, 0.95)";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.5, size * 0.17), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawFullSprite(img, x, y, w, h, obj) {
        if (!img) {
            this.ctx.fillStyle = "#f59e0b";
            this.ctx.fillRect(x, y, w, h);
            return;
        }

        const isShip = (obj.type === "player" || obj.type === "npc");
        const reversed = isShip && obj.data?.ship?.is_reversed;

        if (!reversed) {
            this.ctx.drawImage(img, x, y, w, h);
        } else {
            this.ctx.save();
            this.ctx.translate(x + w, y);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(img, 0, 0, w, h);
            this.ctx.restore();
        }
    }
    _drawSolidPingSilhouette(x, y, w, h) {
    const ctx = this.ctx;

    // Pulsation douce entre 0.55 et 0.95
    const t = this._time * 0.006;
    const alpha = 0.55 + 0.40 * Math.sin(t);

    ctx.save();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 230, 80, 1)";

    // Rectangle plein exactement à la taille du vaisseau
    ctx.fillRect(x, y, w, h);

    ctx.restore();
}

    _drawDottedFallback(x, y, w, h, fillStyle = "rgba(150,200,170,0.9)") {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = fillStyle;
        const step = Math.max(4, Math.floor(Math.min(w, h) / 6));
        const r = Math.max(1, Math.round(step * 0.35));
        for (let yy = y; yy < y + h; yy += step) {
            for (let xx = x; xx < x + w; xx += step) {
                ctx.beginPath();
                ctx.arc(xx + Math.floor(step / 2), yy + Math.floor(step / 2), r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    /**
     * Silhouette "points radar" dérivée du sprite original.
     * On échantillonne l'alpha dans un canvas offscreen et on dessine des points.
     */
    _drawSolidSilhouetteFromSprite(img, x, y, w, h, obj, fillColor = "rgba(255, 230, 60, 1)") {
        const ctx = this.ctx;

        // --- cache key identique à la version dotted, mais "solid" ---
        const cacheKey = `solidSilhouette|${img.src}|${w}x${h}|rev${Boolean(
            obj.data?.ship?.is_reversed
        )}`;

        let off = this._dotCache.get(cacheKey);
        if (!off) {
            // canvas offscreen pour créer le masque
            off = document.createElement("canvas");
            off.width = w;
            off.height = h;
            const octx = off.getContext("2d");

            octx.clearRect(0, 0, w, h);

            const isShip = (obj.type === "player" || obj.type === "npc");
            const reversed = isShip && obj.data?.ship?.is_reversed;

            // 1) dessine le sprite dans offscreen (pour récupérer son alpha)
            if (!reversed) {
                octx.drawImage(img, 0, 0, w, h);
            } else {
                octx.save();
                octx.translate(w, 0);
                octx.scale(-1, 1);
                octx.drawImage(img, 0, 0, w, h);
                octx.restore();
            }

            // 2) transforme le sprite en silhouette pleine
            octx.globalCompositeOperation = "source-in";
            octx.fillStyle = "black";  // on ne garde que l'alpha du sprite
            octx.fillRect(0, 0, w, h);

            this._dotCache.set(cacheKey, off);
        }

        // --- Animation sonar (opacité interne uniquement) ---
        const t = this._time * 0.004;
        const pulsate = 0.55 + 0.35 * Math.sin(t);  // range 0.55 → 0.9

        ctx.save();

        // dessine la silhouette noire
        ctx.globalAlpha = pulsate;
        ctx.drawImage(off, x, y);

        // recoloriage en jaune (toujours contenu dans la silhouette)
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        ctx.restore();
    }
}
