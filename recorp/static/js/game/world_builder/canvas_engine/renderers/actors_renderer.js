export default class ActorsRenderer {
    constructor(ctx, camera, spriteManager, map, sonar = null) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
        this.sonar = sonar || null;
        this._time = 0;

        // cache : key = `${src}|${w}x${h}|density` -> { canvas, imgW, imgH, step }
        this._dotCache = new Map();
    }

    render(delta = 0) {
        this._time += delta;
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        // players
        (this.map.players || []).forEach(p => {
            this._drawObject(p, tilePx);
        });

        // npc (we stored some as worldObjects)
        (this.map.worldObjects || []).filter(o => o.type === 'npc').forEach(npc => {
            this._drawObject(npc, tilePx);
        });
    }

    _drawObject(obj, tilePx) {
        const scr = this.camera.worldToScreen(obj.x, obj.y);
        const pxW = obj.sizeX * tilePx;
        const pxH = obj.sizeY * tilePx;

        const srcPath = obj.spritePath;
        const srcUrl = this.spriteManager.makeUrl ? this.spriteManager.makeUrl(srcPath) : srcPath;
        const img = this.spriteManager.get ? this.spriteManager.get(srcUrl) : null;

        const sonar = this.sonar || (window.canvasEngine && window.canvasEngine.renderer && window.canvasEngine.renderer.sonar) || null;
        const visible = sonar ? sonar.isVisible(obj) : true;

        // If visible -> normal draw (with flip handling)
        if (visible) {
            this._drawFullSprite(img, scr.x, scr.y, pxW, pxH, obj);
            // highlight current player
            if (String(obj.data?.user?.player) === String(window.current_player_id)) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(255,165,0,0.95)';
                this.ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                this.ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                this.ctx.restore();
            }
            return;
        }

        // If not visible -> draw dotted silhouette that preserves shape
        if (img) {
            this._drawDottedSilhouetteFromSprite(img, scr.x, scr.y, pxW, pxH, obj);
        } else {
            // fallback: draw dotted rectangle
            this._drawDottedFallback(scr.x, scr.y, pxW, pxH);
            // also kick preload
            if (this.spriteManager && srcUrl) {
                this.spriteManager.ensure?.(srcUrl).catch(()=>{});
            }
        }
    }

    _drawFullSprite(img, x, y, w, h, obj) {
        if (!img) {
            // placeholder
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.fillRect(x, y, w, h);
            return;
        }

        const isShip = (obj.type === 'player' || obj.type === 'npc');
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
        ctx.fillStyle = 'rgba(150,200,170,0.9)';
        const step = Math.max(4, Math.floor(Math.min(w, h) / 6));
        const r = Math.max(1, Math.round(step * 0.35));
        for (let yy = y; yy < y + h; yy += step) {
            for (let xx = x; xx < x + w; xx += step) {
                ctx.beginPath();
                ctx.arc(xx + Math.floor(step/2), yy + Math.floor(step/2), r, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    /**
     * Draw "points silhouette" by sampling the sprite image.
     * We use an offscreen canvas per (src + target size + density) cached in _dotCache.
     *
     * Strategy:
     *  - draw sprite into offscreen canvas sized to tilePx*object size (matching final drawing size)
     *  - read ImageData
     *  - step over pixels by sampleStep; if alpha > threshold -> draw a small dot at corresponding position
     *
     * Caching: we store an offscreen canvas that already contains sampled positions (array of coords)
     */
    _drawDottedSilhouetteFromSprite(img, x, y, w, h, obj) {
        if (!img) {
            this._drawDottedFallback(x,y,w,h);
            return;
        }

        // choose density: smaller tilePx -> fewer points; larger objects -> more points but keep performant
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);
        // density factor: roughly points per 8px
        const density = Math.max(1, Math.round(tilePx / 8));

        const cacheKey = `${img.src}|${Math.round(w)}x${Math.round(h)}|d${density}|rev${Boolean(obj.data?.ship?.is_reversed)}`;

        let cached = this._dotCache.get(cacheKey);
        if (!cached) {
            // create offscreen canvas at target render size to ensure sampling matches final scale
            const off = document.createElement('canvas');
            off.width = Math.max(1, Math.round(w));
            off.height = Math.max(1, Math.round(h));
            const octx = off.getContext('2d', { willReadFrequently: true });

            // draw sprite to offscreen scaled to target size (respecting flip)
            try {
                // Clear and draw
                octx.clearRect(0,0,off.width, off.height);

                // If the object's sprite should be flipped, draw flipped on the offscreen so sampling matches
                const reversed = Boolean(obj.data?.ship?.is_reversed);
                if (!reversed) {
                    octx.drawImage(img, 0, 0, off.width, off.height);
                } else {
                    octx.save();
                    octx.translate(off.width, 0);
                    octx.scale(-1, 1);
                    octx.drawImage(img, 0, 0, off.width, off.height);
                    octx.restore();
                }

                // sample
                const imgd = octx.getImageData(0,0,off.width, off.height);
                const data = imgd.data;
                const wOff = off.width;
                const hOff = off.height;

                // sample step tuned to density
                const sampleStep = Math.max(2, Math.floor(Math.min(wOff, hOff) / (density * 2)));
                const alphaThreshold = 30; // pixel alpha threshold (0-255)

                // collect sample positions (normalized 0..1)
                const points = [];
                for (let yy = 0; yy < hOff; yy += sampleStep) {
                    for (let xx = 0; xx < wOff; xx += sampleStep) {
                        const idx = (yy * wOff + xx) * 4;
                        const a = data[idx + 3];
                        if (a > alphaThreshold) {
                            // center within cell to create nicer distribution
                            const cx = (xx + Math.min(sampleStep-1, Math.floor(sampleStep/2))) / wOff;
                            const cy = (yy + Math.min(sampleStep-1, Math.floor(sampleStep/2))) / hOff;
                            points.push([cx, cy]);
                        }
                    }
                }

                // reduce points if too many for very large objects (cap)
                const maxPoints = 1200;
                let finalPoints = points;
                if (points.length > maxPoints) {
                    // sample down uniformly
                    const step = Math.ceil(points.length / maxPoints);
                    finalPoints = points.filter((_, i) => i % step === 0);
                }

                cached = {
                    points: finalPoints,
                    imgW: off.width,
                    imgH: off.height,
                    step: sampleStep
                };
                this._dotCache.set(cacheKey, cached);
            } catch (e) {
                // fallback: if cross-origin issue or other, store empty and bail to fallback rectangle
                console.warn('ActorsRenderer: sampling sprite failed, fallback to dotted rectangle', e);
                cached = { points: null };
                this._dotCache.set(cacheKey, cached);
            }
        }

        // draw points
        if (!cached || !cached.points || cached.points.length === 0) {
            this._drawDottedFallback(x,y,w,h);
            return;
        }

        this.ctx.save();

        // visual style: radar greenish, dimmer for unknown, slightly smaller for tiny tiles
        const baseAlpha = 0.95;
        const color = 'rgba(44,255,190,' + (0.7) + ')';
        this.ctx.fillStyle = color;

        // size of each dot relative to object size
        const dotBase = Math.max(1, Math.round(Math.min(w,h) * 0.06)); // 6% of min dim
        const dot = Math.max(1, dotBase);

        // draw each cached normalized point at scaled position
        const pts = cached.points;
        for (let i = 0; i < pts.length; i++) {
            const [nx, ny] = pts[i];
            const px = Math.round(x + nx * w);
            const py = Math.round(y + ny * h);

            // Slight alpha variation for a 'twinkling' radar feel
            const alpha = 0.6 + 0.4 * Math.sin((i * 13 + (this._time * 0.01)) % Math.PI);
            this.ctx.globalAlpha = alpha;

            this.ctx.beginPath();
            this.ctx.arc(px, py, dot, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    }
}