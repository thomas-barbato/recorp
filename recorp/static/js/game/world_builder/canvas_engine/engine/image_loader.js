const ImageLoader = (function() {
    const cache = new Map();

    // charge et met en cache une image. src peut être relatif (ex: '/static/img/...')
    function load(src) {
        if (!src) return Promise.reject(new Error('no src'));
        if (cache.has(src)) return Promise.resolve(cache.get(src));
        return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => { cache.set(src, img); res(img); };
        img.onerror = (e) => { rej(e); };
        img.src = src;
        });
    }

    function get(src) { return cache.get(src) || null; }
    function ensure(src) { return cache.has(src) ? Promise.resolve(cache.get(src)) : load(src); }

    function makeUrl(path) {
        if (!path) return '';
        // base path used in main_engine; keep as-is
        return `/static/img/${path}`;
    }

    return { load, get, ensure, makeUrl };
})();

export default ImageLoader;