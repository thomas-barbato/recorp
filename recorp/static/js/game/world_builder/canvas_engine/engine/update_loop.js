// engine/update_loop.js
// boucle principale, dessine uniquement si une couche est dirty ou animée.

export default class UpdateLoop {
    constructor({ fps = 60, map, renderer, camera, input }) {
        this.fps = fps;
        this.map = map;
        this.renderer = renderer;
        this.camera = camera;
        this.input = input;
        this._running = false;
        this._last = performance.now();
        this._bind = this._tick.bind(this);
    }

    start() {
        if (this._running) return;
        this._running = true;
        this._last = performance.now();
        requestAnimationFrame(this._bind);
    }

    stop() {
        this._running = false;
    }

    _tick(ts) {
        if (!this._running) return;

        const delta = ts - this._last;
        this._last = ts;

        if (!this.renderer?.shouldRender || this.renderer.shouldRender(delta)) {
            this.renderer.render(delta);
        }

        requestAnimationFrame(this._bind);
    }
}