// World combat effects manager
// Draws short projectile trajectories on the world floating canvas for observers/targets.

export default class WorldCombatEffectsManager {
    constructor() {
        this.effects = [];
        this.maxEffects = 24;
    }

    addProjectile({
        sourceKey,
        targetKey,
        weaponType = "THERMAL",
        duration = 320,
        damageToShield = 0,
        damageToHull = 0,
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
            damageToShield: Number(damageToShield || 0),
            damageToHull: Number(damageToHull || 0),
            impactSpawned: false,
        });

        if (this.effects.length > this.maxEffects) {
            this.effects.splice(0, this.effects.length - this.maxEffects);
        }
    }

    _addImpactEffect({ x, y, weaponType, kind = "hull" }) {
        return {
            id: `${Date.now()}-${Math.random()}`,
            kind: kind === "shield" ? "impact_shield" : "impact_hull",
            x: Number(x),
            y: Number(y),
            weaponType: String(weaponType || "THERMAL").toUpperCase(),
            duration: kind === "shield" ? 280 : 190,
            startTime: performance.now(),
        };
    }

    _getWeaponPalette(weaponType) {
        const t = String(weaponType || "").toUpperCase();
        if (t === "THERMAL") {
            return {
                core: "rgba(255,185,140,1)",
                glow: "rgba(255,90,40,1)",
                beam: "rgba(255,155,95,0.98)",
                accent: "rgba(255,240,210,1)",
            };
        }
        if (t === "MISSILE") {
            return {
                core: "rgba(220,255,235,1)",
                glow: "rgba(52,211,153,1)",
                beam: "rgba(34,197,94,0.95)",
                accent: "rgba(245,255,250,1)",
            };
        }
        return {
            core: "rgba(235,245,255,1)",
            glow: "rgba(59,130,246,1)",
            beam: "rgba(147,197,253,0.95)",
            accent: "rgba(255,255,255,1)",
        };
    }

    _drawWhiteHeadDot(ctx, x, y, sizePx, weaponType, alpha = 1) {
        const palette = this._getWeaponPalette(weaponType);
        const type = String(weaponType || "").toUpperCase();
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = Math.max(8, sizePx * (type === "THERMAL" ? 1.0 : 0.75));
        // Halo coloré léger sous le point blanc (reste conforme à ta demande de "point blanc")
        ctx.fillStyle = palette.beam.replace(/,\s*0?\.?\d+\)$/, ", 0.55)");
        ctx.beginPath();
        ctx.arc(x, y, Math.max(3.5, sizePx * 0.52), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2.4, sizePx * 0.30), 0, Math.PI * 2);
        ctx.fill();

        if (type === "BALLISTIC") {
            // Petit "slash" blanc pour un rendu plus sec/tracer
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(x - sizePx * 0.45, y);
            ctx.lineTo(x + sizePx * 0.45, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawTrail(ctx, from, head, weaponType, alpha, pulse = 1, t = 0) {
        const palette = this._getWeaponPalette(weaponType);
        const dx = head.x - from.x;
        const dy = head.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const type = String(weaponType || "").toUpperCase();

        // Main gradient trail
        const grad = ctx.createLinearGradient(from.x, from.y, head.x, head.y);
        grad.addColorStop(0, "rgba(255,255,255,0.03)");
        grad.addColorStop(0.4, palette.glow.replace(/,\s*1\)$/, `, ${Math.max(0.12, alpha * 0.45)})`));
        grad.addColorStop(1, palette.beam.replace(/,\s*0?\.?\d+\)$/, `, ${Math.max(0.45, alpha)})`));

        ctx.save();
        ctx.globalAlpha = Math.max(0.18, alpha);
        ctx.strokeStyle = grad;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (type === "THERMAL") {
            // Beam chaud: double trait (coeur + halo)
            ctx.shadowColor = palette.glow;
            ctx.shadowBlur = 10;
            ctx.lineWidth = (2.6 + 1.8 * pulse);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(head.x, head.y);
            ctx.stroke();

            ctx.globalAlpha = Math.max(0.22, alpha * 0.95);
            ctx.strokeStyle = palette.accent.replace(/,\s*1\)$/, `, ${Math.max(0.35, alpha * 0.85)})`);
            ctx.shadowBlur = 4;
            ctx.lineWidth = Math.max(1.2, 1.0 + 0.6 * pulse);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(head.x, head.y);
            ctx.stroke();
        } else if (type === "MISSILE") {
            // green vapor-like trail
            ctx.shadowColor = palette.glow;
            ctx.shadowBlur = 8;
            ctx.lineWidth = (2.2 + 1.2 * pulse);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(head.x, head.y);
            ctx.stroke();

            // smoke puffs (lightweight dots) behind the head
            const puffCount = Math.max(3, Math.min(7, Math.floor(len / 18)));
            for (let i = 1; i <= puffCount; i++) {
                const p = Math.max(0, t - i * 0.07);
                const px = from.x + dx * p;
                const py = from.y + dy * p;
                const r = 1.4 + i * 0.8;
                ctx.fillStyle = `rgba(210,255,235,${Math.max(0.07, 0.24 - i * 0.028)})`;
                ctx.beginPath();
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
            }
            // occasional hot exhaust spark close to head
            if ((Math.floor(performance.now() / 40) % 2) === 0) {
                ctx.fillStyle = "rgba(255,240,210,0.85)";
                ctx.beginPath();
                ctx.arc(head.x - (dx / len) * 4, head.y - (dy / len) * 4, 1.4 + pulse * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // BALLISTIC: discontinu tracer + faint secondary line
            ctx.setLineDash([Math.max(4, 8 - pulse * 2), 5]);
            ctx.lineDashOffset = -performance.now() * 0.06;
            ctx.shadowColor = palette.glow;
            ctx.shadowBlur = 6;
            ctx.lineWidth = (1.9 + 1.0 * pulse);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(head.x, head.y);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = Math.max(0.10, alpha * 0.35);
            ctx.strokeStyle = palette.accent.replace(/,\s*1\)$/, `, ${Math.max(0.18, alpha * 0.4)})`);
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(head.x, head.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawImpactShield(ctx, fx, alpha) {
        const t = Math.min((performance.now() - fx.startTime) / fx.duration, 1);
        const r = 8 + t * 20;
        ctx.save();
        ctx.globalAlpha = Math.max(0.18, alpha);
        ctx.fillStyle = "rgba(125,211,252,0.28)";
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r * 0.82, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(224,242,254,1)";
        ctx.shadowColor = "rgba(56,189,248,1)";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(125,211,252,0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Arc segment to evoke a shield "slice"
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r + 1.5, -0.9, 0.45);
        ctx.stroke();
        ctx.restore();
    }

    _drawImpactHull(ctx, fx, alpha) {
        const t = Math.min((performance.now() - fx.startTime) / fx.duration, 1);
        const palette = this._getWeaponPalette(fx.weaponType);
        const r = 4 + t * 9;
        ctx.save();
        ctx.globalAlpha = alpha * (1 - t * 0.7);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, Math.max(2, 5 - t * 2.5), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = palette.core;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // short spark cross
        const spark = 5 + t * 6;
        ctx.strokeStyle = "rgba(255,210,170,0.9)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(fx.x - spark, fx.y);
        ctx.lineTo(fx.x + spark, fx.y);
        ctx.moveTo(fx.x, fx.y - spark);
        ctx.lineTo(fx.x, fx.y + spark);
        ctx.stroke();
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

    _resolveRectEdgeAnchor(rect, towardPoint) {
        if (!rect) return null;
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        if (!towardPoint || !Number.isFinite(towardPoint.x) || !Number.isFinite(towardPoint.y)) {
            return { x: cx, y: cy };
        }

        const dx = towardPoint.x - cx;
        const dy = towardPoint.y - cy;
        const eps = 1e-6;
        if (Math.abs(dx) < eps && Math.abs(dy) < eps) {
            return { x: cx, y: cy };
        }

        const halfW = rect.w / 2;
        const halfH = rect.h / 2;
        const tx = Math.abs(dx) > eps ? halfW / Math.abs(dx) : Infinity;
        const ty = Math.abs(dy) > eps ? halfH / Math.abs(dy) : Infinity;
        const t = Math.min(tx, ty);

        return {
            x: cx + dx * t,
            y: cy + dy * t,
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

    updateAndRender(ctx, camera, map) {
        if (!ctx || !camera || !map || !this.effects.length) return;

        const now = performance.now();
        const nextEffects = [];
        const spawnedEffects = [];

        for (const e of this.effects) {
            const elapsed = now - e.startTime;

            if (e.kind === "impact_shield" || e.kind === "impact_hull") {
                if (elapsed < e.duration) {
                    const alpha = 1 - (elapsed / e.duration);
                    if (e.kind === "impact_shield") this._drawImpactShield(ctx, e, alpha);
                    else this._drawImpactHull(ctx, e, alpha);
                    nextEffects.push(e);
                }
                continue;
            }

            if (e.kind !== "projectile") {
                if (elapsed < e.duration) nextEffects.push(e);
                continue;
            }

            const sourceRect = this._resolveActorScreenRect(map, camera, e.sourceKey);
            const targetRect = this._resolveActorScreenRect(map, camera, e.targetKey);
            if (!sourceRect || !targetRect) {
                // Even if offscreen, keep the projectile until expiration for consistency.
                if (elapsed < e.duration) nextEffects.push(e);
                continue;
            }

            const sourceCenter = { x: sourceRect.x + sourceRect.w / 2, y: sourceRect.y + sourceRect.h / 2 };
            const targetCenter = { x: targetRect.x + targetRect.w / 2, y: targetRect.y + targetRect.h / 2 };
            // Ancrage strict sur les cases occupées par les protagonistes (rectangles de map),
            // pour éviter tout décalage optique lié au sprite/padding transparent.
            const from = this._resolveRectEdgeAnchor(sourceRect, targetCenter);
            const to = this._resolveRectEdgeAnchor(targetRect, sourceCenter);
            if (!from || !to) {
                if (elapsed < e.duration) nextEffects.push(e);
                continue;
            }

            const t = Math.min(elapsed / e.duration, 1);
            const dx = (to.x - from.x);
            const dy = (to.y - from.y);
            const alpha = 1 - (t * 0.08);
            const pulse = 0.9 + 0.25 * (0.5 + 0.5 * Math.sin((now * 0.02) + (e.id.length * 0.3)));
            const headSize = Math.max(10, Math.min(16, (camera.tileSize || 32) * 0.40));
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            // Inset visuel : la "tête" du projectile ne doit pas dépasser hors des vaisseaux
            // au départ/à l'impact. On garde néanmoins la trajectoire tracée depuis le bord.
            const inset = Math.min(headSize * 0.7, Math.max(2, len * 0.18));
            const travelFrom = { x: from.x + ux * inset, y: from.y + uy * inset };
            const travelTo = { x: to.x - ux * inset, y: to.y - uy * inset };
            const x = travelFrom.x + (travelTo.x - travelFrom.x) * t;
            const y = travelFrom.y + (travelTo.y - travelFrom.y) * t;

            // Style par type: trail dégradé + pulse, avec un tracer simple en renfort
            this._drawTrail(ctx, from, { x, y }, e.weaponType, Math.max(0.25, alpha * 0.95), pulse, t);
            this._drawTracer(ctx, from, { x, y }, Math.max(0.16, alpha * 0.55), e.weaponType);
            this._drawWhiteHeadDot(ctx, x, y, headSize, e.weaponType, alpha);

            // Déclenche l'impact juste avant la fin du trajet pour qu'il soit lisible même
            // quand les événements s'enchaînent vite (attaque -> riposte).
            if (!e.impactSpawned && t >= 0.90) {
                e.impactSpawned = true;
                if (e.damageToShield > 0) {
                    spawnedEffects.push(
                        // Un impact de bouclier doit être centré sur la cible (comme dans le modal combat),
                        // pas sur le point de contact du rayon au bord de la coque.
                        this._addImpactEffect({
                            x: targetCenter.x,
                            y: targetCenter.y,
                            weaponType: e.weaponType,
                            kind: "shield"
                        })
                    );
                }
                if (e.damageToHull > 0) {
                    spawnedEffects.push(
                        this._addImpactEffect({ x: to.x, y: to.y, weaponType: e.weaponType, kind: "hull" })
                    );
                }
            }

            if (elapsed < e.duration) {
                nextEffects.push(e);
            }
        }

        this.effects = nextEffects.concat(spawnedEffects);
    }
}
