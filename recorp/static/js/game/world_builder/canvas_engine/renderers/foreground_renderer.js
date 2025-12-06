
class ForegroundAnimationManager {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.animCache = new Map(); // cache global par clé (ex: "planet:planet_3")
        this.instanceState = new WeakMap(); // état individuel (frame courante)
    }

    // Déduit une clé unique basée sur le spritePath
    _makeKey(obj) {
        // Ex: foreground/planet/planet_3/0.gif → planet:planet_3
        const parts = obj.spritePath.split("/");
        return `${parts[1]}:${parts[2]}`;
    }

    // Animation globale = frames + durations (chargée une seule fois)
    // État par instance = currentIndex + lastTime
    getFrameFor(obj) {
        const key = this._makeKey(obj);

        // Si pas encore dans le cache → init immédiat
        if (!this.animCache.has(key)) {
            this.animCache.set(key, {
                initialized: false,
                frames: [],
                durations: [],
                frameCount: 0
            });
            this._initAnimation(obj, key);
            return null; // on retourne la frame statique
        }

        const anim = this.animCache.get(key);

        // Si animation pas prête → afficher statique
        if (!anim.initialized || anim.frameCount === 0) return null;

        // Récupérer l’état *de cette instance*
        let state = this.instanceState.get(obj);
        if (!state) {
            state = {
                currentIndex: 0,
                lastTime: performance.now()
            };
            this.instanceState.set(obj, state);
        }

        // Jouer l’animation
        const now = performance.now();
        let elapsed = now - state.lastTime;

        while (elapsed > anim.durations[state.currentIndex]) {
            elapsed -= anim.durations[state.currentIndex];
            state.currentIndex = (state.currentIndex + 1) % anim.frameCount;
            state.lastTime = now - elapsed;
        }

        return anim.frames[state.currentIndex];
    }

    // Chargement unique de l’animation
    _initAnimation(obj, key) {
        if (!obj.spritePath.endsWith("0.gif")) {
            this.animCache.get(key).initialized = true;
            return;
        }

        // Path fixe, fiable
        const basePath = obj.spritePath.replace(/\/?0\.gif$/, "");
        const jsonRel = `${basePath}/frames/animation.json`;
        const jsonUrl = this.spriteManager.makeUrl(jsonRel);

        fetch(jsonUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(animData => {
                const anim = this.animCache.get(key);

                anim.frameCount = animData.frame_count || 0;
                anim.durations = animData.durations || [];

                if (anim.frameCount === 0) throw new Error("Animation vide");

                const promises = [];
                const frames = new Array(anim.frameCount);

                for (let i = 0; i < anim.frameCount; i++) {
                    const frameRel = `${basePath}/frames/frame-${i}.png`;
                    const frameUrl = this.spriteManager.makeUrl(frameRel);

                    promises.push(
                        this.spriteManager.ensure(frameUrl).then(() => {
                            frames[i] = this.spriteManager.get(frameUrl);
                        })
                    );
                }

                return Promise.all(promises).then(() => {
                    anim.frames = frames;
                    anim.initialized = true;
                });
            })
            .catch(err => {
                const anim = this.animCache.get(key);
                anim.initialized = true;
                anim.frameCount = 0;
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
            const animImg = this.animManager.getFrameFor(obj);
            const finalImg = animImg || img;

            if (finalImg) {
                this.ctx.drawImage(finalImg, scr.x, scr.y, pxW, pxH);

                // Hover highlight
                const hover = window.canvasEngine?.hoverTarget || null;
                if (hover && hover === obj) {
                    this.ctx.save();
                    this.ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
                    this.ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                    this.ctx.restore();
                }
            } else {
                // placeholder
                this.ctx.fillStyle = 'rgba(180, 120, 255, 0.25)';
                this.ctx.fillRect(scr.x, scr.y, pxW, pxH);
                this.spriteManager.ensure(imgUrl).catch(() => {});
            }
        });
    }
}