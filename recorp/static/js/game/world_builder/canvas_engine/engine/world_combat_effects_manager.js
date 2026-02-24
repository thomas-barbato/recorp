// World combat effects manager
// Draws short projectile trajectories on the world floating canvas for observers/targets.

export default class WorldCombatEffectsManager {
    constructor() {
        this.effects = [];
        this.maxEffects = 24;
        this._imgCache = new Map();
        this._opaqueCenterCache = new Map();
    }

    addProjectile({
        sourceKey,
        targetKey,
        weaponType = "THERMAL",
        duration = 320,
    }) {
        if (!sourceKey || !targetKey) return;

        this.effects.push({
            id: `${Date.now()}-${Math.random()}`,
            kind: "projectile",
            sourceKey: String(sourceKey),
            targetKey: String(targetKey),
            weaponType: String(weaponType || "THERMAL").toUpperCase(),
            duration: Math.max(120, Number(duration) || 320),
            startTime: performance.now(),
        });

        if (this.effects.length > this.maxEffects) {
            this.effects.splice(0, this.effects.length - this.maxEffects);
        }
    }

    _getProjectileImageSrc(weaponType) {
        const weapon = String(weaponType || "THERMAL").toLowerCase();
        return `/static/img/ux/projectiles/${weapon}/red.png`;
    }

    _getCachedImage(src) {
        if (!src) return null;
        if (this._imgCache.has(src)) return this._imgCache.get(src);
        const img = new Image();
        img.src = src;
        this._imgCache.set(src, img);
        return img;
    }

    _computeOpaqueCenterNormalized(img) {
        if (!img) return null;
        const cacheKey = img.src || `${img.width}x${img.height}`;
        if (this._opaqueCenterCache.has(cacheKey)) {
            return this._opaqueCenterCache.get(cacheKey);
        }

        try {
            const w = img.naturalWidth || img.width || 0;
            const h = img.naturalHeight || img.height || 0;
            if (!w || !h) {
                const fallback = { x: 0.5, y: 0.5 };
                this._opaqueCenterCache.set(cacheKey, fallback);
                return fallback;
            }

            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            const cctx = c.getContext("2d", { willReadFrequently: true });
            cctx.drawImage(img, 0, 0, w, h);
            const data = cctx.getImageData(0, 0, w, h).data;

            let minX = w, minY = h, maxX = -1, maxY = -1;
            // Step 1 is acceptable here because this is cached once per sprite.
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const a = data[(y * w + x) * 4 + 3];
                    if (a > 8) {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < 0 || maxY < 0) {
                const fallback = { x: 0.5, y: 0.5 };
                this._opaqueCenterCache.set(cacheKey, fallback);
                return fallback;
            }

            const center = {
                x: ((minX + maxX) / 2) / w,
                y: ((minY + maxY) / 2) / h,
            };
            this._opaqueCenterCache.set(cacheKey, center);
            return center;
        } catch (_e) {
            const fallback = { x: 0.5, y: 0.5 };
            this._opaqueCenterCache.set(cacheKey, fallback);
            return fallback;
        }
    }

    _drawRotatedImage(ctx, img, x, y, angleRad, desiredPx = 18) {
        if (!ctx || !img) return;

        const w0 = img.naturalWidth || img.width || desiredPx;
        const h0 = img.naturalHeight || img.height || desiredPx;
        const scale = desiredPx / Math.max(w0, h0);
        const w = w0 * scale;
        const h = h0 * scale;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    }

    _resolveActorScreenRect(map, camera, actorKey) {
        const actor = map?.findActorByKey?.(actorKey);
        if (!actor || !camera) return null;

        const sizeX = Number(actor.sizeX || 1);
        const sizeY = Number(actor.sizeY || 1);
        const worldX = Number(actor.renderX ?? actor.x ?? 0);
        const worldY = Number(actor.renderY ?? actor.y ?? 0);

        const screen = camera.worldToScreen(worldX, worldY);
        if (!screen) return null;
        const tile = Number(camera.tileSize || 32);
        return {
            x: screen.x,
            y: screen.y,
            w: sizeX * tile,
            h: sizeY * tile,
        };
    }

    _resolveActorVisibleCenter(rect, actor, spriteManager) {
        if (!rect) return null;
        let cx = 0.5;
        let cy = 0.5;

        const spritePath = actor?.spritePath || null;
        if (spritePath && spriteManager) {
            const srcUrl = spriteManager.makeUrl ? spriteManager.makeUrl(spritePath) : spritePath;
            const img = spriteManager.get ? spriteManager.get(srcUrl) : null;
            if (img && img.complete && (img.naturalWidth || img.width)) {
                const opaqueCenter = this._computeOpaqueCenterNormalized(img);
                if (opaqueCenter) {
                    cx = Number(opaqueCenter.x ?? 0.5);
                    cy = Number(opaqueCenter.y ?? 0.5);

                    // Mirror the visual anchor if the ship sprite is drawn flipped.
                    const reversed = Boolean(
                        (actor?.type === "player" || actor?.type === "npc") &&
                        actor?.data?.ship?.is_reversed
                    );
                    if (reversed) {
                        cx = 1 - cx;
                    }
                }
            }
        }

        return {
            x: rect.x + rect.w * cx,
            y: rect.y + rect.h * cy,
        };
    }

    _drawTracer(ctx, from, to, alpha, weaponType) {
        const COLORS = {
            MISSILE: "rgba(34,197,94,1)",
            THERMAL: "rgba(239,68,68,1)",
            BALLISTIC: "rgba(59,130,246,1)",
        };
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = COLORS[String(weaponType || "").toUpperCase()] || "rgba(255,255,255,1)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
    }

    updateAndRender(ctx, camera, map, spriteManager = null) {
        if (!ctx || !camera || !map || !this.effects.length) return;

        const now = performance.now();
        this.effects = this.effects.filter(e => (now - e.startTime) < e.duration);

        for (const e of this.effects) {
            if (e.kind !== "projectile") continue;

            const sourceRect = this._resolveActorScreenRect(map, camera, e.sourceKey);
            const targetRect = this._resolveActorScreenRect(map, camera, e.targetKey);
            if (!sourceRect || !targetRect) continue; // best effort: offscreen or actor not found => skip draw

            const sourceActor = map?.findActorByKey?.(e.sourceKey) || null;
            const targetActor = map?.findActorByKey?.(e.targetKey) || null;
            const from = this._resolveActorVisibleCenter(sourceRect, sourceActor, spriteManager);
            const to = this._resolveActorVisibleCenter(targetRect, targetActor, spriteManager);
            if (!from || !to) continue;

            const t = Math.min((now - e.startTime) / e.duration, 1);
            const x = from.x + (to.x - from.x) * t;
            const y = from.y + (to.y - from.y) * t;
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            const alpha = 1 - (t * 0.08);
            const headSize = Math.max(22, Math.min(34, (camera.tileSize || 32) * 0.9));

            const imgSrc = this._getProjectileImageSrc(e.weaponType);
            const img = this._getCachedImage(imgSrc);

            // Toujours dessiner une trajectoire visible pour les observateurs, même si le sprite
            // est petit/rapide ou pas encore chargé.
            this._drawTracer(ctx, from, { x, y }, Math.max(0.25, alpha * 0.9), e.weaponType);

            ctx.save();
            ctx.globalAlpha = alpha;

            if (img && img.complete && img.naturalWidth > 0) {
                this._drawRotatedImage(ctx, img, x, y, angle, headSize);
            } else {
                // Le tracer a déjà été dessiné juste au-dessus.
            }

            ctx.restore();
        }
    }
}
