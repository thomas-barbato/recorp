// globals.js
// Initialise et expose les variables globales (compatibilité avec les anciens scripts).
// Appeller initGlobals() avant d'initialiser le moteur canvas.

export let map_informations = null;
export let current_player_id = null;
export let current_player_data = null

export let currentPlayer = null;
export let otherPlayers = [];
export let foregroundElement = [];
export let npcs = [];
export let observable_zone = [];
export let observable_zone_id = [];
export let mobile_radar_sweep_bool = true;
export let pendingAction = null;

// Atlas : taille de la map et tilesize
export const atlas = {
    col: 40,
    row: 40,
    tilesize: 32,
    map_width_size: 40 * 32,
    map_height_size: 40 * 32,
};

// Initialise les globals depuis les json_script injectés par Django.
// Expose aussi les variables sur window pour compatibilité ascendante.
export function initGlobals() {
    try {
        const mapScript = document.getElementById('script_map_informations');
        const playerScript = document.getElementById('script_current_player_id');
        const currentPlayerData = document.getElementById('script_current_player_state');

        map_informations = mapScript ? JSON.parse(mapScript.textContent) : null;
        current_player_id = playerScript ? JSON.parse(playerScript.textContent) : null;
        currentPlayer = currentPlayerData ? JSON.parse(currentPlayerData.textContent) : null;
        
        foregroundElement = map_informations?.sector_element || [];
        npcs = map_informations?.npc || [];

        // Expose legacy globals on window for older scripts (chat, modals...)
        window.map_informations = map_informations;
        window.current_player_id = current_player_id;
        window.currentPlayer = currentPlayer;
        window.otherPlayers = otherPlayers;
        window.foregroundElement = foregroundElement;
        window.npcs = npcs;
        window.observable_zone = observable_zone;
        window.observable_zone_id = observable_zone_id;
        window.mobile_radar_sweep_bool = mobile_radar_sweep_bool;
        window.pendingAction = pendingAction;
        window.atlas = atlas;
        window.scannedTargets = new Set();
        window.sharedTargets  = new Set();
        window.scannedTargetData = {};
        window.scannedMeta = {};
        window.startCountdownTimer = startCountdownTimer;

        return true;
    } catch (e) {
        console.error('initGlobals failed', e);
        return false;
    }
}

/**
 * Démarre un timer de compte à rebours dans un élément DOM.
 *
 * @param {HTMLElement} container - élément porteur du dataset.expiresAt
 * @param {Object} options
 * @param {Function} options.onExpire - callback optionnel à l'expiration
 * @param {Boolean} options.showExpired - afficher "Expiré"
 */
export function startCountdownTimer(container, options = {}) {
    if (!container?.dataset?.expiresAt) return;

    const {
        onExpire = null,
        showExpired = true
    } = options;

    const label = container.querySelector(".countdown-label");
    if (!label) return;

    const expiresAt = new Date(container.dataset.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) return;

    function update() {
        const now = Date.now();
        const diff = Math.max(0, expiresAt - now);
        // if timer goes to 0.
        if (diff <= 0) {
            const targetKey = container.closest("[data-target-key]")?.dataset?.targetKey;
            if (targetKey) {
                window.scannedTargets?.delete(targetKey);
                delete window.scannedMeta?.[targetKey];
                if (typeof refreshModalAfterScan === "function") {
                    refreshModalAfterScan(targetKey);
                }
            }

            clearInterval(timer);
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        label.textContent =
            `${String(h).padStart(2, "0")}:` +
            `${String(m).padStart(2, "0")}:` +
            `${String(s).padStart(2, "0")}`;
    }

    update();
    const timer = setInterval(update, 1000);

    // sécurité : cleanup si le node disparaît
    const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
            clearInterval(timer);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

