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
        window.scannedModalData = {};
        window.scanExpiredLocal = new Set();
        // ===============================
        // Timed effects (foundation)
        // ===============================
        window.startCountdownTimer = startCountdownTimer;
        window.activeEffects = {
            scan: new Map(),
            share_scan: new Map(),
            buff: new Map(),
            debuff: new Map(),
            craft: new Map(),
            gather: new Map(),
            research: new Map(),
        };

        window.registerEffect = function (effectType, key, payload) {
            if (!window.activeEffects?.[effectType]) return;
            window.activeEffects[effectType].set(key, payload);
        };

        window.unregisterEffect = function (effectType, key) {
            if (!window.activeEffects?.[effectType]) return;
            window.activeEffects[effectType].delete(key);
        };

        window.hasEffect = function (effectType, key) {
            return window.activeEffects?.[effectType]?.has(key) === true;
        };

        window.getEffect = function (effectType, key) {
            return window.activeEffects?.[effectType]?.get(key) || null;
        };

        window.isScanned = function (targetKey) {
            if (window.scanExpiredLocal?.has(targetKey)) { return false; }
            return (
                window.activeEffects?.scan?.has(targetKey) === true ||
                window.activeEffects?.share_scan?.has(targetKey) === true ||
                window.sharedTargets?.has(targetKey) === true   // legacy
            );
        };

        window.hasDirectScan = function (targetKey) {
            return window.activeEffects?.scan?.has(targetKey) === true;
        };

        window.hasSharedScan = function (targetKey) {
            return window.activeEffects?.share_scan?.has(targetKey) === true;
        };

        /**
         * Retourne les métadonnées de scan (priorité à activeEffects)
         * { expires_at, data? } | null
         */
        window.getScanMeta = function (targetKey) {
            if (window.activeEffects?.scan?.has(targetKey)) {
                return window.activeEffects.scan.get(targetKey);
            }
            // fallback legacy
            if (window.scannedMeta?.[targetKey]) {
                return window.scannedMeta[targetKey];
            }
            return null;
        };

        /**
         * Helper de purge scan (appelé UNIQUEMENT depuis WS effects_invalidated)
         */
        window.clearScan = function (targetKey) {
            
            // canonique
            window.activeEffects?.scan?.delete(targetKey);

            // legacy (temporaire)
            window.scannedTargets?.delete(targetKey);

            delete window.scannedMeta?.[targetKey];
            delete window.scannedModalData?.[targetKey];
        };

        window.effectVisualTimers ??= new Map();
        window.scheduleEffectVisualExpire = function (effect, targetKey, expiresAt) {
            const key = `${effect}:${targetKey}`;

            // Nettoyer un ancien timer si présent
            if (window.effectVisualTimers.has(key)) {
                clearTimeout(window.effectVisualTimers.get(key));
            }

            const delay = Math.max(0, new Date(expiresAt).getTime() - Date.now());

            const timeoutId = setTimeout(() => {
                // VISUEL UNIQUEMENT
                if (effect === "scan") {
                    window.scanExpiredLocal.add(targetKey);
                    window.canvasEngine?.renderer?.requestRedraw();
                    // affiche message de suppression de scan.
                    window.renderScanTextAboveTarget(targetKey, "- scan", "rgba(231, 0, 11, 0.95)", "scan");
                }

                window.effectVisualTimers.delete(key);
            }, delay);

            window.effectVisualTimers.set(key, timeoutId);
        };

        window.renderScanTextAboveTarget = function(targetKey, text, color = "rgba(0,255,180,0.95)", icon = "ship") {
            const engine = window.canvasEngine;
            if (!engine || !engine.map || !engine.renderer) return;

            const actor = engine.map.findActorByKey(targetKey);
            if (!actor) return;

            const sizeX = actor.sizeX || actor.data?.ship?.sizeX || 1;
            const sizeY = actor.sizeY || actor.data?.ship?.sizeY || 1;

            const worldX = (actor.renderX ?? actor.x) + (sizeX - 1) / 2;
            const worldY = (actor.renderY ?? actor.y) + (sizeY - 1) / 2;

            engine.renderer.addFloatingMessage({
                text,
                icon: icon,
                worldX,
                worldY,
                duration: 2000,
                color: color
            });
        }

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

    let timer = null

    function update() {
        const now = Date.now();
        const diff = Math.max(0, expiresAt - now);
        // if timer goes to 0.
        if (diff <= 0) {
            // Affichage UI uniquement
            label.textContent = "00:00:00";

            // Empêcher tout re-trigger
            clearInterval(timer);

            // Signal purement visuel (optionnel)
            if (typeof onExpire === "function") {
                onExpire();
            }
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
    timer = setInterval(update, 1000);

    // sécurité : cleanup si le node disparaît
    const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
            clearInterval(timer);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}


