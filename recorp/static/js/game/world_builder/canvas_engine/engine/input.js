// engine/input.js
// gestion des clics et du hover (UI canvas reçoit les events).
// onObjectClick(obj) et onTileClick({x,y}) sont des hooks fournis par le bootstrap.

export default class Input {
    constructor({uiCanvas, camera, map, onObjectClick, onTileClick}) {
        this.canvas = uiCanvas.el;
        this.ctx = uiCanvas.ctx;
        this.camera = camera;
        this.map = map;
        this.onObjectClick = onObjectClick;
        this.onTileClick = onTileClick;

        this._attach();
    }

    _attach() {
        this.canvas.style.cursor = 'default';
        this.canvas.addEventListener('click', this._handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this._handleMove.bind(this));
        this.canvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        this._handleClick({clientX: t.clientX, clientY: t.clientY});
        e.preventDefault();
        }, {passive: false});
    }

    _getLocalPos(ev) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left);
        const y = (ev.clientY - rect.top);
        return {x, y};
    }

    _handleClick(ev) {
        const pos = this._getLocalPos(ev);
        const world = this.camera.screenToWorld(pos.x, pos.y);
        const objs = this.map.getObjectsAtTile(world.x, world.y);
        const top = objs.length ? objs[0] : null;
        if (top && this.onObjectClick) this.onObjectClick(top);
        else if (this.onTileClick) this.onTileClick({x: world.x, y: world.y});
    }

    _handleMove(ev) {
        const pos = this._getLocalPos(ev);
        const world = this.camera.screenToWorld(pos.x, pos.y);
        const top = this.map.getTopObjectAt(world.x, world.y);
        if (top) {
        if (top.type === 'foreground' || top.type === 'player') this.canvas.style.cursor = 'pointer';
        else this.canvas.style.cursor = 'default';
        } else {
        this.canvas.style.cursor = 'default';
        }
    }
}
