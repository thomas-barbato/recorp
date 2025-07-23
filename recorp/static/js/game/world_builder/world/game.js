// Configuration et variables globales
let gameSocket = null;
const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);
let observable_zone = [];
let observable_zone_id = [];

const atlas = {
    col: 40,
    row: 40,
    tilesize: 32,
    map_width_size: 40 * 32,
    map_height_size: 40 * 32,
};

// Configuration des événements tactiles/souris
const user_is_on_mobile_bool = is_user_is_on_mobile_device();
const attribute_touch_mouseover = user_is_on_mobile_bool ? 'touchstart' : 'mouseover';
const attribute_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'onclick';
const action_listener_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'click';

// Configuration WebSocket
const WS_CONFIG = {
    RECONNECT_DELAY: 1000,
    RESIZE_DELAY: 300
};

// Constantes pour les statuts de santé
const HEALTH_STATUSES = {
    FULL: { threshold: 100, color: "text-emerald-400" },
    ALMOST_FULL: { threshold: 75, color: "text-lime-300" },
    AVERAGE: { threshold: 50, color: "text-yellow-400" },
    BELOW_AVERAGE: { threshold: 25, color: "text-orange-400" },
    LOW: { threshold: 0, color: "text-red-600" }
};

/**
 * Applique un effet de fondu à un élément avant de le supprimer
 * @param {HTMLElement} target - L'élément cible
 * @param {number} timer - Intervalle en millisecondes pour l'animation
 */
function fade_effect(target, timer) {
    if (!target) {
        console.warn('fade_effect: target element is null');
        return;
    }

    const fadeEffect = setInterval(() => {
        if (!target.style.opacity) {
            target.style.opacity = 1;
        }
        
        if (parseFloat(target.style.opacity) > 0) {
            target.style.opacity = (parseFloat(target.style.opacity) - 0.05).toString();
        } else {
            clearInterval(fadeEffect);
            target.remove();
        }
    }, timer);
}

/**
 * Détermine la couleur et le statut basés sur le pourcentage de valeur
 * @param {number} current_val - Valeur actuelle
 * @param {number} max_val - Valeur maximale
 * @returns {Object} Objet contenant le statut et la couleur
 */
function color_per_percent(current_val, max_val) {
    if (max_val <= 0) {
        console.warn('color_per_percent: max_val must be greater than 0');
        return { status: "LOW", color: HEALTH_STATUSES.LOW.color };
    }

    const current_percent = Math.round((current_val * 100) / max_val);
    
    let status = "LOW";
    for (const [statusName, config] of Object.entries(HEALTH_STATUSES)) {
        if (current_percent >= config.threshold) {
            status = statusName;
            break;
        }
    }

    return { 
        status: status, 
        color: HEALTH_STATUSES[status].color
    };
}

/**
 * Inverse l'affichage des vaisseaux des joueurs
 * @returns {Promise} Promesse de la requête asynchrone
 */
function reverse_player_ship_display() {
    const shipElements = document.querySelectorAll('.ship-pos');
    const ids = Array.from(shipElements).map(element => element.id);

    return async_reverse_ship({
        user: current_user_id,
        id_array: ids,
    });
}

/**
 * Initialise les événements de déconnexion
 */
function init_logout_events() {
    const logout_buttons = document.querySelectorAll('.logout');
    
    logout_buttons.forEach(button => {
        button.addEventListener(action_listener_touch_click, () => {
            const logout_submit_btn = button.querySelector('#logout-btn');
            if (logout_submit_btn) {
                logout_submit_btn.click();
            } else {
                console.warn('Logout submit button not found');
            }
        });
    });
}

/**
 * Crée une connexion WebSocket
 * @param {string} room - ID de la salle
 * @returns {WebSocket} Instance WebSocket
 */
function create_websocket_connection(room) {
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${room}/`;
    
    return new WebSocket(ws_url);
}

/**
 * Configure les gestionnaires d'événements WebSocket
 * @param {WebSocket} socket - Instance WebSocket
 * @param {string} room - ID de la salle
 */
function setup_websocket_handlers(socket, room) {
    socket.onopen = () => {
        console.log("You are now connected");
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed unexpectedly. Trying to reconnect in 1s...");
        setTimeout(() => {
            console.log("Reconnecting...");
            gameSocket = create_websocket_connection(room);
            setup_websocket_handlers(gameSocket, room);
        }, WS_CONFIG.RECONNECT_DELAY);
    };

    socket.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            handle_websocket_message(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
}

/**
 * Gère les messages WebSocket entrants
 * @param {Object} data - Données du message
 */
function handle_websocket_message(data) {
    const message_handlers = {
        "player_move": () => update_player_coord(data.message),
        "async_reverse_ship": () => reverse_ship(data.message),
        "player_attack": () => update_ship_after_attack(data.message),
        "async_remove_ship": () => remove_ship_display(data.message),
        "user_join": () => add_pc([data.message]),
        "send_message": () => {
            // TODO: Implémenter sendMessage(data)
            console.log('Message received:', data.message);
        },
        "user_leave": () => {
            console.log('User left:', data.message);
        }
    };

    const handler = message_handlers[data.type];
    if (handler) {
        handler();
    } else {
        console.warn(`Unknown message type: ${data.type}`);
    }
}

/**
 * Initialise la génération du secteur
 */
function init_sector_generation() {
    
    [observable_zone, observable_zone_id] = getObservableZone();

    generate_sector(
        map_informations.sector,
        map_informations.sector_element, 
        map_informations.npc, 
        map_informations.pc
    );
    /*
    document.querySelectorAll('.ship-pos').forEach(player => {
        player.addEventListener('mouseover', displayObservableZone);
        player.addEventListener('mouseout', HideObservableZone);
    })*/
    const p = document.querySelector('.player-ship-start-pos').id.split('_')
    console.log(p)
    coord = {y : p[0], x : p[1]};
    new Sonar(observable_zone, coord, 5);
}

/**
 * Configure le gestionnaire de redimensionnement de fenêtre
 */
function setup_window_resize_handler() {
    window.onresize = () => {
        const player_start_element = document.querySelector('.player-ship-start-pos');
        if (!player_start_element) {
            console.warn('Player start position element not found');
            return;
        }

        const user_id = player_start_element.id.split('_');
        
        setTimeout(() => {
            hide_sector_overflow(user_id[1], user_id[0]);
            if (!is_user_is_on_mobile_device()) {
                set_pathfinding_event();
            }
        }, WS_CONFIG.RESIZE_DELAY);
    };
}

/**
 * Initialise l'application principale
 */
function init_game() {
    const room = map_informations.sector.id;
    
    // Initialiser la connexion WebSocket
    gameSocket = create_websocket_connection(room);
    setup_websocket_handlers(gameSocket, room);
    setup_window_resize_handler();
    
    // Initialiser les composants du jeu
    init_sector_generation();
    init_logout_events();
}

// Initialisation au chargement de la page
window.addEventListener('load', init_game);