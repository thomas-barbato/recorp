(function() {
// créer pattern canvas pour chaque couche afin d'avoir une répartition naturelle et performante
function createStarData(size, count, alphaRange) {
    const canvas = document.createElement('canvas');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = 800 * dpr, h = 800 * dpr;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = (Math.random() * 0.6 + 0.4) * size * dpr;
    const a = (Math.random() * (alphaRange[1] - alphaRange[0]) + alphaRange[0]);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    }
    return canvas.toDataURL();
}

// appliquer les images aux couches
const l1 = document.querySelector('.stars-layer.l1');
const l2 = document.querySelector('.stars-layer.l2');
const l3 = document.querySelector('.stars-layer.l3');

// couche lointaine: beaucoup de petites étoiles
l1.style.backgroundImage = 'url(' + createStarData(0.6, 700, [0.08, 0.22]) + ')';
l1.style.backgroundSize = '800px 800px';

// couche moyenne
l2.style.backgroundImage = 'url(' + createStarData(1.0, 350, [0.12, 0.35]) + ')';
l2.style.backgroundSize = '900px 900px';

// couche proche (quelques grosses étoiles)
l3.style.backgroundImage = 'url(' + createStarData(1.8, 120, [0.18, 0.6]) + ')';
l3.style.backgroundSize = '1100px 1100px';

// Générer quelques "twinkle points" DOM pour l'effet ponctuel (meilleur contrôle pour animation)
function makeTwinkles(count) {
    const container = document.querySelector('.space-canvas');
    for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = (Math.random() * 2.5 + 0.7);
    el.style.position = 'absolute';
    el.style.left = (Math.random() * 100) + '%';
    el.style.top = (Math.random() * 100) + '%';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.borderRadius = '50%';
    el.style.background = 'white';
    el.style.opacity = (Math.random() * 0.4 + 0.3);
    el.style.transform = 'translate3d(-50%,-50%,0)';
    el.style.pointerEvents = 'none';
    const dur = (Math.random() * 6 + 3).toFixed(2);
    el.style.animation = 'twinkle ' + dur + 's ease-in-out ' + (Math.random() * 4).toFixed(2) + 's infinite';
    el.style.filter = 'blur(0.2px)';
    container.appendChild(el);
    }
}

// adaption selon taille écran pour performance
const w = Math.max(window.innerWidth, 800);
if (w < 900) {
    makeTwinkles(24);
} else if (w < 1400) {
    makeTwinkles(38);
} else {
    makeTwinkles(60);
}

// optionnel: relancer génération au redimensionnement (débounce léger)
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
    // redessiner patterns pour DPR mis à jour
    l1.style.backgroundImage = 'url(' + createStarData(0.6, 700, [0.08, 0.22]) + ')';
    l2.style.backgroundImage = 'url(' + createStarData(1.0, 350, [0.12, 0.35]) + ')';
    l3.style.backgroundImage = 'url(' + createStarData(1.8, 120, [0.18, 0.6]) + ')';
    }, 220);
});
})();