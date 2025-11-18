// engine/update_loop.js
// boucle principale, dessine à chaque frame (60fps par défaut).

export default class UpdateLoop {
    constructor({fps=60, map, renderer, camera, input}) {
        this.fps = fps;
        this.map = map;
        this.renderer = renderer;
        this.camera = camera;
        this.input = input;
        this._running = false;
        this._last = performance.now();
        this._acc = 0;
        this._interval = 1000 / fps;
        this._bind = this._tick.bind(this);
    }

    start() {
        if (this._running) return;
        this._running = true;
        requestAnimationFrame(this._bind);
    }

    stop() {
        this._running = false;
    }

    _tick(ts) {
        if (!this._running) return;
        const delta = ts - this._last;
        this._last = ts;
        this._acc += delta;

        // simple: render every frame (we could throttle if needed)
        this.renderer.render(delta);

        requestAnimationFrame(this._bind);
    }
}
