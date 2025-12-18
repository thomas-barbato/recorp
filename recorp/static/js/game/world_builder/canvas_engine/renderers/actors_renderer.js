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

        // Players
        Object.values(this.map.players || {}).forEach(p => {
            this._drawObject(p, tilePx);
        });

        // NPCs
        (this.map.worldObjects || [])
            .filter(o => o.type === "npc")
            .forEach(npc => {
                this._drawObject(npc, tilePx);
            });
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
                actor.x = path[0].x;
                actor.y = path[0].y;
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
                    actor.x = seg.endX;
                    actor.y = seg.endY;
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

        // Sonar / visibilité
        const sonar =
            this.sonar ||
            (window.canvasEngine && window.canvasEngine.renderer && window.canvasEngine.renderer.sonar) ||
            null;

        const forcedVisible =
            window.scannedTargets?.has(obj.id) ||
            window.sharedTargets?.has(obj.id);

        const visible = forcedVisible || (sonar ? sonar.isVisible(obj) : true);

        // Highlight du joueur courant lorsque pathfinding actif
        const engine = window.canvasEngine;
        const pf = engine?.pathfinding;
        const showBorder = pf && (pf.current || pf.invalidPreview);
        const hover = window.canvasEngine?.hoverTarget || null;

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
            if (String(obj.data?.user?.player) === String(window.current_player_id)) {
                this.ctx.save();
                this.ctx.shadowColor = "rgba(52, 211, 153, 0.8)";   // emerald 400 glow
                this.ctx.shadowBlur = 18;
                this.ctx.strokeStyle = "rgba(52, 211, 153, 0.9)";
                this.ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                this.ctx.setLineDash([4, 4]);
                this.ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                this.ctx.restore();
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
            if (hover && hover === obj) {
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

    _drawDottedFallback(x, y, w, h) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "rgba(150,200,170,0.9)";
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
    _drawSolidSilhouetteFromSprite(img, x, y, w, h, obj) {
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
        ctx.fillStyle = "rgba(255, 230, 60, 1)";
        ctx.fillRect(x, y, w, h);

        ctx.restore();
    }
}
