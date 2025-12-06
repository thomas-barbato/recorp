// dessine tous les objets foreground (planetes, stations...).
// chaque objet multi-tile est dessiné en une seule drawImage.

class ForegroundAnimationManager {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.animStates = new Map();
    }

    getFrameFor(obj) {
        const key = obj.spritePath;
        let state = this.animStates.get(key);

        if (!state) {
            state = {
                initialized: false,
                frames: [],
                durations: [],
                frameCount: 0,
                currentIndex: 0,
                lastTime: performance.now()
            };
            this.animStates.set(key, state);
            this._initAnimation(obj, state);
            return null;
        }

        if (!state.initialized || state.frameCount === 0 || state.frames.length === 0) {
            return null;
        }

        const now = performance.now();
        let elapsed = now - state.lastTime;

        while (elapsed > state.durations[state.currentIndex]) {
            elapsed -= state.durations[state.currentIndex];
            state.currentIndex = (state.currentIndex + 1) % state.frameCount;
            state.lastTime = now - elapsed;
        }

        return state.frames[state.currentIndex];
    }

    _initAnimation(obj, state) {

        if (!obj.spritePath.endsWith("0.gif")) {
            state.initialized = true;
            return;
        }

        // 🔥 FIX : basePath propre
        const basePath = obj.spritePath.replace(/\/?0\.gif$/, "");

        // 🔥 FIX : chemins corrects
        const jsonRel = `${basePath}/frames/animation.json`;
        const jsonUrl = this.spriteManager.makeUrl(jsonRel);

        console.log("[ANIM INIT jsonUrl]", jsonUrl);

        fetch(jsonUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(anim => {
                const frameCount = anim.frame_count || 0;
                const durations = anim.durations || [];

                if (!frameCount) throw new Error("animation.json vide");

                state.frameCount = frameCount;
                state.durations = durations;

                const promises = [];
                const frames = new Array(frameCount);

                for (let i = 0; i < frameCount; i++) {
                    const frameRel = `${basePath}/frames/frame-${i}.png`;
                    const frameUrl = this.spriteManager.makeUrl(frameRel);

                    promises.push(
                        this.spriteManager.ensure(frameUrl)
                            .then(() => frames[i] = this.spriteManager.get(frameUrl))
                    );
                }

                return Promise.all(promises).then(() => {
                    state.frames = frames;
                    state.initialized = true;
                    state.currentIndex = 0;
                    state.lastTime = performance.now();
                });
            })
            .catch(err => {
                console.error("[ANIM ERROR]", obj.spritePath, err);
                state.initialized = true;
                state.frameCount = 0;
            });
    }
}

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
            const src = this.spriteManager.makeUrl(obj.spritePath);
            const img = this.spriteManager.get(src);

            // 🔥 obtenir frame animée
            const animImg = this.animManager.getFrameFor(obj);
            const finalImg = animImg || img;

            if (finalImg) {
                this.ctx.drawImage(finalImg, scr.x, scr.y, pxW, pxH);
                const ctx = this.ctx;
                const sonar = this.map?.sonar || this.sonar;
                const sonarVisible = sonar ? sonar.isVisible(obj) : true;
                const hover = window.canvasEngine?.hoverTarget || null;
                if (hover && hover === obj) {
                    // Si tu veux la bordure uniquement quand c'est dans le sonar :
                    ctx.save();
                    ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                    ctx.setLineDash([4, 4]);
                    ctx.strokeStyle = "rgba(226, 232, 240, 0.8)"; // emerald-400
                    ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                    ctx.restore();
                }
                // Si tu la veux même hors sonar, enlève simplement le if(sonarVisible).
            } else {
                // placeholder semi-translucent if pas chargé
                this.ctx.fillStyle = 'rgba(180, 120, 255, 0.25)';
                this.ctx.fillRect(scr.x, scr.y, pxW, pxH);
                // demande preload
                this.spriteManager.ensure(src).catch(()=>{});
            }
        });
    }
}
