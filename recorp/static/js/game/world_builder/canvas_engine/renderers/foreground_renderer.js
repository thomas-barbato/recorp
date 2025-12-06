// dessine tous les objets foreground (planetes, stations...).
// chaque objet multi-tile est dessiné en une seule drawImage.

class ForegroundAnimationManager {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.animStates = new Map(); // key -> { frames, durations, frameCount, currentIndex, lastTime }
    }

    /**
     * Retourne l'image de frame à dessiner pour cet objet
     * ou null si on doit fallback sur le sprite statique.
     */
    getFrameFor(obj) {
        const key = obj.spritePath; // peut être adapté (ex: obj.id)
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
            return null; // première fois : on laisse le statique
        }

        if (!state.initialized || state.frameCount === 0 || state.frames.length === 0) {
            // pas prêt, on dessine encore le GIF
            return null;
        }

        const now = performance.now();
        let elapsed = now - state.lastTime;

        if (elapsed <= 0) {
            return state.frames[state.currentIndex] || null;
        }

        // avance dans les frames en tenant compte des durations
        while (elapsed > state.durations[state.currentIndex]) {
            elapsed -= state.durations[state.currentIndex];
            state.currentIndex = (state.currentIndex + 1) % state.frameCount;
            state.lastTime = now - elapsed;
        }

        return state.frames[state.currentIndex] || null;
    }

    _initAnimation(obj, state) {
        // On suppose obj.spritePath se termine par "0.gif"
        // Exemple : "img/foreground/planet/planet_5/0.gif"
        if (!obj.spritePath || !obj.spritePath.endsWith("0.gif")) {
            // pas une anim gérée → on marque comme initialisé vide
            state.initialized = true;
            state.frameCount = 0;
            return;
        }

        const basePath = obj.spritePath.replace(/0\.gif$/, "");
        const jsonRelPath = basePath + "frames/animation.json";      // relatif côté spriteManager
        const jsonUrl = this.spriteManager.makeUrl(jsonRelPath);

        fetch(jsonUrl)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(animData => {
                const frameCount = animData.frame_count || 0;
                const durations = animData.durations || [];

                if (!frameCount || frameCount <= 0) {
                    throw new Error("animation.json invalide ou vide");
                }

                state.frameCount = frameCount;
                state.durations = durations.length === frameCount
                    ? durations
                    : Array(frameCount).fill(100); // fallback si mismatch

                const framePromises = [];
                const frameImages = new Array(frameCount);

                for (let i = 0; i < frameCount; i++) {
                    const frameRel = `${basePath}frames/frame-${i}.png`;
                    const frameUrl = this.spriteManager.makeUrl(frameRel);

                    // ensure() charge l'image via spriteManager (comme tu le fais déjà)
                    const p = this.spriteManager.ensure(frameUrl)
                        .then(() => {
                            frameImages[i] = this.spriteManager.get(frameUrl);
                        })
                        .catch(err => {
                            console.error("[ForegroundAnim] Erreur chargement frame", frameRel, err);
                        });

                    framePromises.push(p);
                }

                return Promise.all(framePromises).then(() => {
                    state.frames = frameImages.filter(Boolean);
                    state.initialized = true;
                    state.currentIndex = 0;
                    state.lastTime = performance.now();
                    if (state.frames.length === 0) {
                        console.warn("[ForegroundAnim] Aucune frame valide pour", obj.spritePath);
                    }
                });
            })
            .catch(err => {
                console.error("[ForegroundAnim] Erreur init animation pour", obj.spritePath, err);
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
    }

    render() {
        const tilePx = this.camera.tileSize * this.camera.zoom;
        this.map.foregrounds.forEach(obj => {
            const scr = this.camera.worldToScreen(obj.x, obj.y);
            const pxW = obj.sizeX * tilePx;
            const pxH = obj.sizeY * tilePx;
            const src = this.spriteManager.makeUrl(obj.spritePath);
            const img = this.spriteManager.get(src);
            if (img) {
                this.ctx.drawImage(img, scr.x, scr.y, pxW, pxH);
                const ctx = this.ctx;
                const sonar = this.map?.sonar || this.sonar; // selon ta structure
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
