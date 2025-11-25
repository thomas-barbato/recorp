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

        const visible = sonar ? sonar.isVisible(obj) : true;

        // Highlight du joueur courant lorsque pathfinding actif
        const engine = window.canvasEngine;
        const pf = engine?.pathfinding;
        const showBorder = pf && (pf.current || pf.invalidPreview);

        if (visible) {
            const isAnimating = obj.renderX !== undefined;

            // Traînée SF : dessine l'ancienne position avec blur
            if (isAnimating && img) {
                const prevScr = this.camera.worldToScreen(obj.x, obj.y);
                this.ctx.save();
                this.ctx.globalAlpha = 0.15;
                this.ctx.filter = "blur(1px) brightness(1.12)";
                this.ctx.drawImage(img, prevScr.x, prevScr.y, pxW, pxH);
                this.ctx.restore();
            }

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
            if (
                showBorder &&
                String(obj.data?.user?.player) === String(window.current_player_id)
            ) {
                this.ctx.save();
                this.ctx.strokeStyle = "rgba(255,165,0,0.95)";
                this.ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                this.ctx.setLineDash([4, 4]);
                this.ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                this.ctx.restore();
            }

            // Reset filtre
            this.ctx.filter = "none";
            this.ctx.globalAlpha = 1;
            return;
        }

        // Non visible : silhouette "radar"
        if (img) {
            this._drawDottedSilhouetteFromSprite(img, scr.x, scr.y, pxW, pxH, obj);
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
    _drawDottedSilhouetteFromSprite(img, x, y, w, h, obj) {
        if (!img) {
            this._drawDottedFallback(x, y, w, h);
            return;
        }

        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);
        const density = Math.max(1, Math.round(tilePx / 8));

        const cacheKey = `${img.src}|${Math.round(w)}x${Math.round(h)}|d${density}|rev${Boolean(
            obj.data?.ship?.is_reversed
        )}`;

        let cached = this._dotCache.get(cacheKey);
        if (!cached) {
            const off = document.createElement("canvas");
            off.width = Math.max(1, Math.round(w));
            off.height = Math.max(1, Math.round(h));

            try {
                const octx = off.getContext("2d");
                octx.clearRect(0, 0, off.width, off.height);

                // flip si nécessaire dans l'offscreen
                const isShip = (obj.type === "player" || obj.type === "npc");
                const reversed = isShip && obj.data?.ship?.is_reversed;

                if (!reversed) {
                    octx.drawImage(img, 0, 0, off.width, off.height);
                } else {
                    octx.save();
                    octx.translate(off.width, 0);
                    octx.scale(-1, 1);
                    octx.drawImage(img, 0, 0, off.width, off.height);
                    octx.restore();
                }

                const imgd = octx.getImageData(0, 0, off.width, off.height);
                const data = imgd.data;
                const wOff = off.width;
                const hOff = off.height;

                const sampleStep = Math.max(
                    2,
                    Math.floor(Math.min(wOff, hOff) / (density * 2))
                );
                const alphaThreshold = 30;

                const points = [];
                for (let yy = 0; yy < hOff; yy += sampleStep) {
                    for (let xx = 0; xx < wOff; xx += sampleStep) {
                        const idx = (yy * wOff + xx) * 4;
                        const a = data[idx + 3];
                        if (a > alphaThreshold) {
                            const cx =
                                (xx +
                                    Math.min(sampleStep - 1, Math.floor(sampleStep / 2))) / wOff;
                            const cy =
                                (yy +
                                    Math.min(sampleStep - 1, Math.floor(sampleStep / 2))) / hOff;
                            points.push([cx, cy]);
                        }
                    }
                }

                cached = {
                    points,
                    imgW: off.width,
                    imgH: off.height,
                    step: sampleStep
                };
                this._dotCache.set(cacheKey, cached);
            } catch (e) {
                console.warn(
                    "ActorsRenderer: sampling sprite failed, fallback to dotted rectangle",
                    e
                );
                cached = { points: null };
                this._dotCache.set(cacheKey, cached);
            }
        }

        if (!cached || !cached.points || cached.points.length === 0) {
            this._drawDottedFallback(x, y, w, h);
            return;
        }

        this.ctx.save();

        const color = "rgba(44,255,190,0.7)";
        this.ctx.fillStyle = color;

        const dotBase = Math.max(1, Math.round(Math.min(w, h) * 0.06));
        const dot = Math.max(1, dotBase);

        const pts = cached.points;
        for (let i = 0; i < pts.length; i++) {
            const [nx, ny] = pts[i];
            const px = Math.round(x + nx * w);
            const py = Math.round(y + ny * h);

            const alpha =
                0.6 + 0.4 * Math.sin((i * 13 + this._time * 0.01) % Math.PI);
            this.ctx.globalAlpha = alpha;

            this.ctx.beginPath();
            this.ctx.arc(px, py, dot, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    }
}
