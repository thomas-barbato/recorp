// Configuration et variables globales
let gameSocket = null;
const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_player_id = JSON.parse(document.getElementById('script_current_player_id').textContent);
let currentPlayer = map_informations.pc.find(p => p.user.player === current_player_id);
let otherPlayers = map_informations.pc.filter(p => p.user.player !== current_player_id);
const npcs = map_informations.npc || [];
let observable_zone = [];
let observable_zone_id = [];
let mobile_radar_sweep_bool = true;

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
    RESIZE_DELAY: 300,
    MAX_RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 30000,
    CONNECTION_TIMEOUT: 10000
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
 * Applique un effet de fondu à un élément avant de le supprimer (version optimisée)
 * @param {HTMLElement} target - L'élément cible
 * @param {number} timer - Intervalle en millisecondes pour l'animation
 */
function fade_effect(target, timer) {
    if (!target || !target.parentNode) {
        console.warn('fade_effect: target element is null or not in DOM');
        return;
    }

    fadeObj.target = target;
    fadeObj.timer = timer;
    fadeObj.opacity = parseFloat(target.style.opacity || '1');

    fadeObj.intervalId = setInterval(() => {
        if (fadeObj.opacity > 0 && fadeObj.target.parentNode) {
            fadeObj.opacity = Math.max(0, fadeObj.opacity - 0.05);
            fadeObj.target.style.opacity = fadeObj.opacity.toString();
        } else {
            clearInterval(fadeObj.intervalId);
            if (fadeObj.target.parentNode) {
                fadeObj.target.remove();
            }
        }
    }, timer);
}

/**
 * Détermine la couleur et le statut basés sur le pourcentage de valeur (version optimisée)
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
    
    // Optimisation: utilisation d'un for...of plus rapide
    for (const [statusName, config] of Object.entries(HEALTH_STATUSES)) {
        if (current_percent >= config.threshold) {
            return { 
                status: statusName, 
                color: config.color
            };
        }
    }

    return { status: "LOW", color: HEALTH_STATUSES.LOW.color };
}

/**
 * Inverse l'affichage des vaisseaux des joueurs (version optimisée)
 * @returns {Promise} Promesse de la requête asynchrone
 */
function reverse_player_ship_display() {
    // Utilisation du cache DOM pour éviter les requêtes répétées
    const shipElements = document.querySelectorAll('.ship-pos');
    const ids = Array.from(shipElements).map(element => element.id);

    return async_reverse_ship({
        player: current_player_id,
        id_array: ids,
    });
}

/**
 * Crée une connexion WebSocket avec gestion améliorée
 * @param {string} room - ID de la salle
 * @returns {WebSocket} Instance WebSocket
 */
function create_websocket_connection(room) {
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${room}/`;
    
    const socket = new WebSocket(ws_url);
    
    // Configuration des timeouts
    socket.binaryType = 'arraybuffer';
    
    // Timeout de connexion
    const connectionTimeout = setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
            socket.close();
            console.error('WebSocket connection timeout');
        }
    }, WS_CONFIG.CONNECTION_TIMEOUT);
    
    socket.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
    });
    
    return socket;
}

/**
 * Configure les gestionnaires d'événements WebSocket avec reconnexion intelligente
 * @param {WebSocket} socket - Instance WebSocket
 * @param {string} room - ID de la salle
 */
function setup_websocket_handlers(socket, room) {
    let reconnectAttempts = 0;
    let heartbeatInterval = null;
    let isReconnecting = false;
    
    socket.onopen = () => {
        reconnectAttempts = 0;
        isReconnecting = false;
        
        // Heartbeat pour maintenir la connexion
        heartbeatInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, WS_CONFIG.HEARTBEAT_INTERVAL);
        
        // Notification de reconnexion réussie
        if (reconnectAttempts > 0) {
            console.log('Reconnexion réussie');
        }
    };

    socket.onclose = (event) => {
        console.log("WebSocket fermé:", event.code, event.reason);
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        
        // Reconnexion intelligente avec backoff exponentiel
        if (!isReconnecting && reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            isReconnecting = true;
            const delay = WS_CONFIG.RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
            
            console.log(`Tentative de reconnexion dans ${delay}ms (${reconnectAttempts + 1}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
            
            setTimeout(() => {
                reconnectAttempts++;
                gameSocket = create_websocket_connection(room);
                setup_websocket_handlers(gameSocket, room);
            }, delay);
        } else if (reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error('Nombre maximum de tentatives de reconnexion atteint');
            // Optionnel: afficher une notification à l'utilisateur
            showConnectionError();
        }
    };

    socket.onmessage = (e) => {
        try {

            const data = JSON.parse(e.data);
            
            // Ignorer les pings/pongs
            if (data.type === 'pong') return;
            handle_websocket_message(data);

        } catch (error) {
            console.error('Erreur lors du parsing du message WebSocket:', error);
        }
    };

    socket.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
    };
}

/**
 * Affiche une erreur de connexion à l'utilisateur
 */
function showConnectionError() {
    // Créer ou afficher une notification d'erreur de connexion
    //const errorNotification = document.querySelector('#connection-error') || createConnectionErrorNotification();
    if (errorNotification) {
        errorNotification.style.display = 'block';
    }
}

/**
 * Crée une notification d'erreur de connexion
 */
/*
function createConnectionErrorNotification() {
    const notification = ObjectPool.getElement('div');
    notification.id = 'connection-error';
    notification.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <span>Connexion perdue. Tentative de reconnexion...</span>
            <button onclick="location.reload()" class="ml-4 bg-red-800 px-2 py-1 rounded text-sm">
                Recharger
            </button>
        </div>
    `;
    notification.style.display = 'none';
    document.body.appendChild(notification);
    return notification;
}*/

/**
 * Gère les messages WebSocket entrants (version optimisée)
 * @param {Object} data - Données du message
 */
function handle_websocket_message(data) {
    // Map statique pour de meilleures performances
    const messageHandlers = new Map([
        ["player_move", () => update_player_coord(data.message)],
        ["async_reverse_ship", () => reverse_ship(data.message)],
        ["player_attack", () => update_ship_after_attack(data.message)],
        ["async_remove_ship", () => remove_ship_display(data.message)],
        ["user_join", () => add_pc([data.message])],
        ["send_message", () => console.log('Message reçu:', data.message)],
        ["user_leave", () => handleUserLeave(data.message)]
    ]);
    console.log(data)
    console.log(data.type)
    const handler = messageHandlers.get(data.type);
    if (handler) {
        try {
            handler();
        } catch (error) {
            console.error(`Erreur lors du traitement du message ${data.type}:`, error);
        }
    } else {
        console.warn(`Type de message inconnu: ${data.type}`);
    }
}

/**
 * Gère le départ d'un utilisateur
 * @param {Object} message - Message de départ
 */
function handleUserLeave(message) {
    // Ici, vous pourriez ajouter la logique pour supprimer le joueur de l'affichage
    // par exemple: removePlayerFromDisplay(message.player_id);
}

// Pool d'objets pour réduire les allocations (version améliorée)
const ObjectPool = {
    _fadeEffectPool: [],
    _eventHandlerPool: [],
    _elementPool: new Map(),
    
    getFadeEffect() {
        return this._fadeEffectPool.pop() || { 
            intervalId: null, 
            target: null, 
            timer: 0,
            opacity: 1
        };
    },
    
    returnFadeEffect(obj) {
        obj.intervalId = null;
        obj.target = null;
        obj.timer = 0;
        obj.opacity = 1;
        this._fadeEffectPool.push(obj);
    },
    
    getElement(tagName) {
        const poolKey = tagName.toLowerCase();
        if (!this._elementPool.has(poolKey)) {
            this._elementPool.set(poolKey, []);
        }
        
        const pool = this._elementPool.get(poolKey);
        return pool.pop() || document.createElement(tagName);
    },
    
    returnElement(element) {
        if (!element || !element.tagName) return;
        
        const poolKey = element.tagName.toLowerCase();
        if (!this._elementPool.has(poolKey)) {
            this._elementPool.set(poolKey, []);
        }
        
        // Nettoyer l'élément
        element.className = '';
        element.removeAttribute('style');
        element.innerHTML = '';
        
        // Supprimer tous les event listeners
        const newElement = element.cloneNode(false);
        if (element.parentNode) {
            element.parentNode.replaceChild(newElement, element);
        }
        
        this._elementPool.get(poolKey).push(newElement);
    }
};

/**
 * Applique un effet de fondu à un élément avant de le supprimer (version optimisée)
 * @param {HTMLElement} target - L'élément cible
 * @param {number} timer - Intervalle en millisecondes pour l'animation
 */
function fade_effect(target, timer) {
    if (!target || !target.parentNode) {
        console.warn('fade_effect: target element is null or not in DOM');
        return;
    }

    const fadeObj = ObjectPool.getFadeEffect();
    fadeObj.target = target;
    fadeObj.timer = timer;
    fadeObj.opacity = parseFloat(target.style.opacity || '1');

    fadeObj.intervalId = setInterval(() => {
        if (fadeObj.opacity > 0 && fadeObj.target.parentNode) {
            fadeObj.opacity = Math.max(0, fadeObj.opacity - 0.05);
            fadeObj.target.style.opacity = fadeObj.opacity.toString();
        } else {
            clearInterval(fadeObj.intervalId);
            if (fadeObj.target.parentNode) {
                fadeObj.target.remove();
            }
            ObjectPool.returnFadeEffect(fadeObj);
        }
    }, timer);
}

/**
 * Initialise la génération du secteur (version optimisée)
 */
function init_sector_generation() {
    // Précharger les éléments DOM critiques
    try {
        [observable_zone, observable_zone_id] = getObservableZone();

        generate_sector(
            map_informations.sector,
            map_informations.sector_element, 
            map_informations.npc, 
            map_informations.pc
        );

        // MODIFIÉ : Utiliser updatePlayerSonar avec les bonnes coordonnées
        const playerCoords = {
            y: currentPlayer.user.coordinates.y + 1,
            x: currentPlayer.user.coordinates.x + 1
        };
        updatePlayerSonar(playerCoords, currentPlayer.ship.view_range);
        
        // Vérifier que les fonctions existent avant de les appeler
        if (typeof initializeDetectionSystem === 'function') {
            initializeDetectionSystem(currentPlayer, otherPlayers, npcs);
        }
        
        if (typeof initializeEnhancedDetectionSystem === 'function') {
            initializeEnhancedDetectionSystem(currentPlayer, otherPlayers, npcs);
        }
    } catch (error) {
        console.error('Erreur lors de la génération du secteur:', error);
    }
}

/**
 * Configure le gestionnaire de redimensionnement de fenêtre avec debounce
 */
function setup_window_resize_handler() {
    let resizeTimeout = null;
    
    const handleResize = () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {

            const player_start_element = document.querySelector('.player-ship-start-pos');

            if (!player_start_element) {
                console.warn('Player start position element not found');
                return;
            }

            const user_id = player_start_element.id.split('_');
            try {
                hide_sector_overflow(user_id[1], user_id[0]);
                if (!user_is_on_mobile_bool && typeof set_pathfinding_event === 'function') {
                    set_pathfinding_event();
                }
            } catch (error) {
                console.error('Erreur lors du redimensionnement:', error);
            }

        }, WS_CONFIG.RESIZE_DELAY);
    };
}

/**
 * Initialise l'application principale (version optimisée)
 */
function init_game() {
    const room = map_informations.sector.id;
    
    try {
        // Vérifier les prérequis
        if (!room) {
            throw new Error('ID de salle manquant');
        }
        
        if (!current_player_id) {
            throw new Error('ID utilisateur manquant');
        }
        
        // Initialiser la connexion WebSocket
        gameSocket = create_websocket_connection(room);
        setup_websocket_handlers(gameSocket, room);
        setup_window_resize_handler();
        
        // Initialiser les composants du jeu de manière asynchrone
        init_sector_generation();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du jeu:', error);
        showConnectionError();
    }
}

// FONCTIONS UTILITAIRES POUR L'OPTIMISATION
/**
 * Débounce pour limiter les appels fréquents à une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Temps d'attente en ms
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* EXEMPLE UTILISATION : 
const debouncedMouseover = debounce(() => {
    generate_border(sizeY, sizeX, coordY, coordX);
}, 100);

border.addEventListener("mouseover", debouncedMouseover);
*/

/**
 * Fonction de nettoyage à appeler lors de la fermeture
 */
function cleanup_game() {
    
    // NOUVEAU : Nettoyer le sonar
    if (typeof cleanupSonar === 'function') {
        cleanupSonar();
    }
    
    // Fermer la connexion WebSocket
    if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
        gameSocket.close(1000, 'Page unloading');
    }
}

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
    
    // En cas d'erreur critique, essayer de redémarrer certains composants
    if (event.error.name === 'WebSocketError') {
        showConnectionError();
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée non gérée:', event.reason);
});

// Nettoyage lors de la fermeture de la page
window.addEventListener('beforeunload', cleanup_game);

// Nettoyage lors du changement de page (SPA)
window.addEventListener('pagehide', cleanup_game);

window.addEventListener('load', init_game);