export function resizeCanvasWrapper() {
    const TILE = 32;
    const w = window.innerWidth;

    let maxX, maxY;

    if (w < 640) {                 
    // 📱 MOBILE
    maxX = 11; 
    maxY = 11;

    } else if (w < 820) {         
        // PETITE TABLETTE (ex: iPad mini / tablettes compactes)
        maxX = 16; 
        maxY = 16;

    } else if (w < 1024) {        
        // TABLETTE CLASSIQUE
        maxX = 20; 
        maxY = 20;

    } else if (w < 1280) {        
        // PETIT ÉCRAN PC / Laptop 13"
        maxX = 26; 
        maxY = 18;

    } else if (w < 1536) {        
        // ÉCRANS PC standards 1080p / 24"
        maxX = 32; 
        maxY = 20;

    } else if (w < 1920) {        
        // LARGE ÉCRAN 1080p / 1440p
        maxX = 36; 
        maxY = 22;

    } else {                      
        // MAXIMUM ABSOLU (GRANDS ÉCRANS)
        maxX = 39; 
        maxY = 23;
    }

    const wrapper = document.getElementById('canvas-wrapper');

    const widthPx  = maxX * TILE;
    const heightPx = maxY * TILE;

    wrapper.style.width  = widthPx + "px";
    wrapper.style.height = heightPx + "px";

    wrapper.style.maxWidth  = widthPx + "px";
    wrapper.style.maxHeight = heightPx + "px";

    wrapper.style.marginLeft  = "auto";
    wrapper.style.marginRight = "auto";
}