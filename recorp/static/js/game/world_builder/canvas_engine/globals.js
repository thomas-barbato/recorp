// globals.js
// Initialise et expose les variables globales (compatibilité avec les anciens scripts).
// Appeller initGlobals() avant d'initialiser le moteur canvas.

export let map_informations = null;
export let current_player_id = null;

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

        map_informations = mapScript ? JSON.parse(mapScript.textContent) : null;
        current_player_id = playerScript ? JSON.parse(playerScript.textContent) : null;

        if (map_informations && Array.isArray(map_informations.pc)) {
        currentPlayer = map_informations.pc.find(p => String(p.user.player) === String(current_player_id)) || null;
        otherPlayers = map_informations.pc.filter(p => String(p.user.player) !== String(current_player_id));
        } else {
        currentPlayer = null;
        otherPlayers = [];
        }

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

        return true;
    } catch (e) {
        console.error('initGlobals failed', e);
        return false;
    }
}
