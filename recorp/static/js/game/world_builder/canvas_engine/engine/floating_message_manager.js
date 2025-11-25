export default class FloatingMessageManager {
    constructor() {
        this.messages = [];
        this.maxMessages = 8; // nombre max de messages simultanés
    }

    addMessage({ text, icon = "ship", worldX, worldY, color = "rgba(0,255,180,0.95)", duration = 1200 }) {
        const msg = {
            id: Date.now() + Math.random(),
            text: String(text),
            icon,
            worldX,
            worldY,
            color,
            duration,
            startTime: performance.now(),
        };

        this.messages.push(msg);

        // limite: on supprime les plus anciens
        if (this.messages.length > this.maxMessages) {
            this.messages.splice(0, this.messages.length - this.maxMessages);
        }
    }

    updateAndRender(ctx, camera) {
        if (!this.messages.length) return;

        const now = performance.now();
        const tile = camera.tileSize || 32;

        // on garde seulement les messages non expirés
        this.messages = this.messages.filter(msg => (now - msg.startTime) < msg.duration);

        this.messages.forEach((msg, index) => {
            const elapsed = now - msg.startTime;
            const { text, icon, worldX, worldY, color, duration } = msg;

            const fadeIn = 200;
            const fadeOut = 300;
            const visible = Math.max(0, duration - fadeIn - fadeOut);

            let alpha = 1;
            if (elapsed < fadeIn) {
                alpha = elapsed / fadeIn;
            } else if (elapsed > fadeIn + visible) {
                alpha = 1 - (elapsed - fadeIn - visible) / fadeOut;
            }

            // coordonnées écran du centre du vaisseau
            const screen = camera.worldToScreen(worldX, worldY);

            // stacking vertical: chaque message un peu plus haut
            const stackOffsetY = index * (tile * 0.4);
            const baseY = screen.y - tile * 0.5 - 6 - stackOffsetY;
            const baseX = screen.x;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = "18px Orbitron, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "black";
            ctx.fillStyle = color;

            // --- Icône (pour l'instant : emoji 🚀) ---
            const iconChar = (icon === "ship") ? "🚀" : "◆";
            const iconX = baseX - 20;
            const iconY = baseY;

            ctx.strokeText(iconChar, iconX, iconY);
            ctx.fillText(iconChar, iconX, iconY);

            // --- Texte numérique ---
            const textX = baseX + 4;
            const textY = baseY;

            ctx.strokeText(text, textX, textY);
            ctx.fillText(text, textX, textY);
            ctx.restore();
        });
    }
}