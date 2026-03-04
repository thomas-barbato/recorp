// engine/canvas_manager.js
// Gère la création et le resize des canvas de rendu.
// IMPORTANT: les canvases doivent être présents dans le DOM (id = canvas-bg, canvas-fg, canvas-actors, canvas-ui, canvas-floating)

const CanvasManager = (function () {
    let canvasMap = {};
    let width = 0, height = 0, dpr = window.devicePixelRatio || 1;
    
    function getCanvasHost() {
        // Les canvases de jeu (actors/floating/etc.) vivent dans #canvas-zone
        // (décalé de 32px pour laisser la place aux coordonnées).
        // Si on mesure #canvas-wrapper à la place, on introduit un repère faux
        // d'environ 1 case.
        return document.getElementById('canvas-zone')
            || document.getElementById('canvas-wrapper')
            || document.body;
    }

    function init(ids = ['canvas-bg', 'canvas-fg', 'canvas-actors', 'canvas-ui', 'canvas-floating']) {
        const host = getCanvasHost();

        ids.forEach(id => {
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('canvas');
                el.id = id;
                el.style.position = 'absolute';
                el.style.top = 0;
                el.style.left = 0;
                host.appendChild(el);
            }

            // S'assurer que canvas-floating est bien au-dessus de tout
            if (id === 'canvas-floating') {
                host.appendChild(el); // le remet en dernier dans le DOM
            }

            const ctx = el.getContext('2d');

            canvasMap[id] = { el, ctx };

            // pointer events seulement sur le UI
            el.style.pointerEvents = (id === 'canvas-ui') ? 'auto' : 'none';
            el.style.imageRendering = 'pixelated';
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
        });

        resizeAll();

        return {
            bg: canvasMap['canvas-bg'],
            fg: canvasMap['canvas-fg'],
            actors: canvasMap['canvas-actors'],
            ui: canvasMap['canvas-ui'],
            floating: canvasMap['canvas-floating'],
            canvasMap,
            get width() { return width; },
            get height() { return height; }
        };
    }

    function resizeAll() {
        const host = getCanvasHost();
        const rect = host.getBoundingClientRect();
        const cssWidth = Math.max(320, Number(rect.width) || 0);
        const cssHeight = Math.max(240, Number(rect.height) || 0);

        width = cssWidth;
        height = cssHeight;
        dpr = window.devicePixelRatio || 1;

        Object.values(canvasMap).forEach(({ el, ctx }) => {
            const bufferWidth = Math.max(1, Math.ceil(cssWidth * dpr));
            const bufferHeight = Math.max(1, Math.ceil(cssHeight * dpr));

            el.style.width = cssWidth + 'px';
            el.style.height = cssHeight + 'px';
            el.width = bufferWidth;
            el.height = bufferHeight;

            const scaleX = bufferWidth / cssWidth;
            const scaleY = bufferHeight / cssHeight;
            ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        });
    }

    return {
        init,
        resizeAll,
        get width() { return width; },
        get height() { return height; }
    };
})();

export default CanvasManager;
