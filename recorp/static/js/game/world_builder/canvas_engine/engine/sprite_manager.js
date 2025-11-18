// engine/sprite_manager.js
// wrapper léger sur image_loader pour futur traitement d'atlas/tiles
import ImageLoader from './image_loader.js';

const SpriteManager = (function(){
    return {
        init: async function(opts = {}) {
            this.tileSize = opts.tileSize || 32;
            this.basePath = opts.basePath || '/static/img';
            // no heavy preload by default
            return Promise.resolve();
        },
        ensure(src) { return ImageLoader.ensure(src); },
        load(src) { return ImageLoader.load(src); },
        get(src) { return ImageLoader.get(src); },
        makeUrl(path) { return ImageLoader.makeUrl(path); }
    };
})();

export default SpriteManager;