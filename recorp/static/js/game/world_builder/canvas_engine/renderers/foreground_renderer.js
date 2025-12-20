
class ForegroundAnimationManager {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;

        // cache global par type (planet:planet_3)
        this.animCache = new Map();

        // état par instance (index + time)
        this.instanceState = new WeakMap();

        // stock les vitesses d'animation FG.
        this.instanceSpeedFactor = new WeakMap();
    }

    _makeKey(obj) {
        const parts = obj.spritePath.split("/");
        return `${parts[1]}:${parts[2]}`;
    }

    getFrameFor(obj) {
        const key = this._makeKey(obj);

        if (!this.animCache.has(key)) {
            this.animCache.set(key, { initialized: false });
            this._initAnimation(obj, key);
            return null;
        }

        const anim = this.animCache.get(key);
        if (!anim.initialized || anim.frameCount === 0) return null;

        let state = this.instanceState.get(obj);
        if (!state) {
            state = { index: 0, lastTime: performance.now() };
            this.instanceState.set(obj, state);
        }

        const now = performance.now();
        let elapsed = now - state.lastTime;

        // ANIMATION SPEED + random value
        const SPEED_BY_TYPE = {
            planet:   { base: 6.0, variance: 0.6 },
            star:     { base: 4.0, variance: 0.5 },
            asteroid: { base: 1.8, variance: 0.4 },
            station:  { base: 2.0, variance: 0.8 },
            warp:     { base: 0.6, variance: 0.2 },
            warpzone: { base: 0.6, variance: 0.2 },
        };

        const subtype = String(obj.subtype || "").toLowerCase();
        const cfg = SPEED_BY_TYPE[subtype] ?? { base: 2.5, variance: 0.3 };

        let factor = this.instanceSpeedFactor.get(obj);
        if (factor === undefined) {
            const seed = this._hash01(obj.id);
            const rand = (seed * 2 - 1) * cfg.variance;
            factor = Math.max(0.1, cfg.base + rand);
            this.instanceSpeedFactor.set(obj, factor);
        }

        while (elapsed > anim.durations[state.index] * factor) {
            elapsed -= anim.durations[state.index] * factor;
            state.index = (state.index + 1) % anim.frameCount;
            state.lastTime = now - elapsed;
        }

        return {
            img: anim.image,
            sx: state.index * anim.frameWidth,
            sy: 0,
            sw: anim.frameWidth,
            sh: anim.frameHeight,
        };
    }
    
    _hash01(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (h << 5) - h + str.charCodeAt(i);
            h |= 0; // int32
        }
        return (Math.abs(h) % 1000) / 1000; // [0..1)
    }

    _initAnimation(obj, key) {
        const basePath = obj.spritePath.replace(/\/?0\.gif$/, "");
        const sheetUrl = this.spriteManager.makeUrl(`${basePath}/spritesheet.png`);
        const jsonUrl = this.spriteManager.makeUrl(`${basePath}/animation.json`);

        fetch(jsonUrl)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) throw new Error("no spritesheet");

                const anim = {
                    initialized: false,
                    image: null,
                    frameCount: data.frame_count,
                    frameWidth: data.frame_width,
                    frameHeight: data.frame_height,
                    durations: data.durations,
                };

                this.animCache.set(key, anim);

                return this.spriteManager.ensure(sheetUrl).then(() => {
                    anim.image = this.spriteManager.get(sheetUrl);
                    anim.initialized = true;
                });
            })
            .catch(() => {
                // ❌ spritesheet absent → fallback frames
                this._initFrameFallback(obj, key);
            });
    }

    _initFrameFallback(obj, key) {
        // 👉 on garde ton ancien système tel quel
        const basePath = obj.spritePath.replace(/\/?0\.gif$/, "");
        const jsonUrl = this.spriteManager.makeUrl(`${basePath}/frames/animation.json`);

        fetch(jsonUrl)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) throw new Error("no frames");

                const anim = {
                    initialized: false,
                    frames: [],
                    durations: data.durations,
                    frameCount: data.frame_count
                };

                this.animCache.set(key, anim);

                const promises = [];
                for (let i = 0; i < anim.frameCount; i++) {
                    const url = this.spriteManager.makeUrl(`${basePath}/frames/frame-${i}.png`);
                    promises.push(
                        this.spriteManager.ensure(url).then(() => {
                            anim.frames[i] = this.spriteManager.get(url);
                        })
                    );
                }

                return Promise.all(promises).then(() => {
                    anim.initialized = true;
                });
            })
            .catch(() => {
                this.animCache.set(key, { initialized: true, frameCount: 0 });
            });
    }
}
// ============================================================================
// Foreground Renderer
// ============================================================================
// - Dessine foreground (planètes, astéroïdes, stations…)
// - Utilise animation si disponible
// ============================================================================

export default class ForegroundRenderer {
    constructor(ctx, camera, spriteManager, map) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;

        this.animManager = new ForegroundAnimationManager(spriteManager);
    }

    render() {
        const tilePx = this.camera.tileSize * this.camera.zoom;

        this.map.foregrounds.forEach(obj => {
            const scr = this.camera.worldToScreen(obj.x, obj.y);
            const pxW = obj.sizeX * tilePx;
            const pxH = obj.sizeY * tilePx;

            // Static image
            const imgUrl = this.spriteManager.makeUrl(obj.spritePath);
            const img = this.spriteManager.get(imgUrl);

            // Animated frame
            const anim = this.animManager.getFrameFor(obj);
            if (anim) {
                this.ctx.drawImage(
                    anim.img,
                    anim.sx, anim.sy, anim.sw, anim.sh,
                    scr.x, scr.y, pxW, pxH
                );
            } else if (img) {
                this.ctx.drawImage(img, scr.x, scr.y, pxW, pxH);
            }
        });
    }
}