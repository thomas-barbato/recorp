// floating_message_manager.js
// Gestion des messages flottants (texte + icônes réelles dessinées dans le canvas)

class FloatingMessageManager {
    constructor() {
        this.messages = [];
        this.maxMessages = 8; // nombre max de messages simultanés

        // Chemin de base vers les icônes (servies par Django sous /static/floating_icon/...)
        this.iconBaseUrl = "/static/floating_icon/";

        // Registre logique -> fichier
        this.iconMap = {
            // Actions
            ship: "spaceship.svg",
            invisible: "invisible.svg",

            // Attaques envoyées
            missile: "missile.svg",
            thermal: "thermal.svg",
            ballistic: "ballistic.svg",

            // Dégâts subits
            missile_shield: "missile_shield.svg",
            thermal_shield: "thermal_shield.svg",
            ballistic_shield: "ballistic_shield.svg",
            hull: "hull.svg",
        };

        // Images préchargées
        this.icons = {};
        this._loaded = false;
        this._loading = false;
    }

    _ensureIconsLoaded() {
        if (this._loaded || this._loading) return;
        this._loading = true;

        const entries = Object.entries(this.iconMap);
        let remaining = entries.length;

        entries.forEach(([key, filename]) => {
            const img = new Image();
            img.onload = () => {
                this.icons[key] = img;
                remaining -= 1;
                if (remaining <= 0) {
                    this._loaded = true;
                    this._loading = false;
                }
            };
            img.onerror = () => {
                console.warn("[FloatingMessageManager] failed to load icon", key, filename);
                remaining -= 1;
                if (remaining <= 0) {
                    this._loaded = true;
                    this._loading = false;
                }
            };
            img.src = this.iconBaseUrl + filename;
        });
    }

    addMessage({ text, icon = "ship", worldX, worldY, color = "rgb(255,255,255)", duration = 2000 }) {
        this._ensureIconsLoaded();

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

    _drawIcon(ctx, iconKey, x, y, size) {
        const img = this.icons[iconKey];
        if (img) {
            const half = size / 2;
            ctx.drawImage(img, x - half, y - half, size, size);
        } else {
            // fallback: petit symbole unicode
            const fallbackChar = iconKey === "ship" ? "🚀" : "◆";
            ctx.font = "18px Orbitron, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.strokeText(fallbackChar, x, y);
            ctx.fillText(fallbackChar, x, y);
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
            const player_size = window.currentPlayer.ship.size

            let centerX = screen.x + (player_size.x * tile) / 2;
            let centerY = screen.y + (player_size.y * tile) / 2;

            ctx.save();
            ctx.globalAlpha = alpha;

            // --- Icône réelle ---
            const iconSize = 20;
            const iconX = ( centerX + tile ); // à gauche du texte
            const iconY = centerY;
            this._drawIcon(ctx, icon, iconX, iconY, iconSize);

            // --- Texte numérique ---
            ctx.font = "18px Orbitron, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "black";
            ctx.fillStyle = color;

            const textX = ( centerX + tile ) + iconSize;
            const textY =  centerY;

            ctx.strokeText(text, textX, textY);
            ctx.fillText(text, textX,  centerY);

            ctx.restore();
        });
    }
}

export default FloatingMessageManager;
