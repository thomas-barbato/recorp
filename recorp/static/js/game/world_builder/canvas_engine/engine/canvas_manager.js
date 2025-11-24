// engine/canvas_manager.js
// Gère la création et le resize des 4 canvas. Conserve la taille des tiles.
// IMPORTANT: les canvases doivent être présents dans le DOM (id = canvas-bg, canvas-fg, canvas-actors, canvas-ui)
import SpriteManager from "./sprite_manager.js";

const CanvasManager = (function(){
    let canvasMap = {};
    let width = 0, height = 0, dpr = window.devicePixelRatio || 1;

    function _get(id) { return document.getElementById(id); }

    function init(ids = ['canvas-bg','canvas-fg','canvas-actors','canvas-ui','canvas-floating']) {

        const wrapper = document.getElementById('canvas-wrapper') || document.body;

        ids.forEach(id => {
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('canvas');
                el.id = id;
                el.style.position = 'absolute';
                el.style.top = 0;
                el.style.left = 0;
                wrapper.appendChild(el);
            }
            const ctx = el.getContext('2d');

            canvasMap[id] = { el, ctx };

            // pointer events seulement sur le UI
            el.style.pointerEvents = id === 'canvas-ui' ? 'auto' : 'none';
            el.style.imageRendering = 'pixelated';
        });

        resizeAll();

        // construire l'objet retourné depuis canvasMap
        
        return {
            bg: canvasMap['canvas-bg'],
            fg: canvasMap['canvas-fg'],
            actors: canvasMap['canvas-actors'],
            ui: canvasMap['canvas-ui'],
            floating: canvasMap['canvas-floating'],
            canvasMap,
            get width(){ return width; },
            get height(){ return height; }
        };
    }

    function resizeAll() {
        const wrapper = document.getElementById('canvas-wrapper') || document.body;
        const rect = wrapper.getBoundingClientRect();
        width = Math.max(320, Math.floor(rect.width));
        height = Math.max(240, Math.floor(rect.height));
        dpr = window.devicePixelRatio || 1;

        Object.values(canvasMap).forEach(({el, ctx}) => {
        el.style.width = width + 'px';
        el.style.height = height + 'px';
        el.width = Math.round(width * dpr);
        el.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        });
    }

    return { init, resizeAll, get width(){ return width; }, get height(){ return height; } };
})();

export default CanvasManager;
