
// Configuration et variables globales
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

// Constantes pour les statuts de santé
const HEALTH_STATUSES = {
    FULL: { threshold: 100, color: "text-emerald-400" },
    ALMOST_FULL: { threshold: 75, color: "text-lime-300" },
    AVERAGE: { threshold: 50, color: "text-yellow-400" },
    BELOW_AVERAGE: { threshold: 25, color: "text-orange-400" },
    LOW: { threshold: 0, color: "text-red-600" }
};

// Configuration des événements tactiles/souris
const user_is_on_mobile_bool = is_user_is_on_mobile_device();
const attribute_touch_mouseover = user_is_on_mobile_bool ? 'touchstart' : 'mouseover';
const attribute_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'onclick';
const action_listener_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'click';

/**
 * Applique un effet de fondu à un élément avant de le supprimer (version optimisée)
 * @param {HTMLElement} target - L'élément cible
 * @param {number} timer - Intervalle en millisecondes pour l'animation
 */
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
 * Initialise la génération du secteur (version optimisée)
 */
function init_sector_generation() {
    try {
        [observable_zone, observable_zone_id] = getObservableZone();

        generate_sector(
            map_informations.sector,
            map_informations.sector_element, 
            map_informations.npc, 
            map_informations.pc
        );

        const playerCoords = {
            y: currentPlayer.user.coordinates.y + 1,
            x: currentPlayer.user.coordinates.x + 1
        };
        updatePlayerSonar(playerCoords, currentPlayer.ship.view_range);
        
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


// Configuration WebSocket améliorée
const WS_CONFIG = {
    RECONNECT_DELAY: 2000,
    RESIZE_DELAY: 300,
    MAX_RECONNECT_ATTEMPTS: 15,
    HEARTBEAT_INTERVAL: 30000,
    CONNECTION_TIMEOUT: 15000,
    PING_TIMEOUT: 15000
};

class WebSocketManager {
    constructor(room) {
        this.room = room;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.heartbeatInterval = null;
        this.isReconnecting = false;
        this.lastPingTime = 0;
        this.isConnected = false;
        this.messageQueue = [];
        this.reconnectTimeout = null;
        this.shouldReconnect = true;
        this.hasConnectedBefore = false;
        
        this.connect();
    }
    
    connect() {

        // Nettoyer les anciens timeouts
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${this.room}/`;
        
        this.socket = new WebSocket(ws_url);
        this.setupEventHandlers();
        
        // Timeout de connexion
        const connectionTimeout = setTimeout(() => {
            if (this.socket.readyState === WebSocket.CONNECTING) {
                console.log('Connection timeout, fermeture du socket');
                this.socket.close();
            }
        }, WS_CONFIG.CONNECTION_TIMEOUT);
        
        this.socket.addEventListener('open', () => {
            clearTimeout(connectionTimeout);
            this.onOpen();
        });
    }
    
    setupEventHandlers() {
        this.socket.onopen = () => this.onOpen();
        this.socket.onclose = (event) => this.onClose(event);
        this.socket.onmessage = (event) => this.onMessage(event);
        this.socket.onerror = (error) => this.onError(error);
    }
    
    onOpen() {
        console.log('✅ WebSocket connecté');
        this.isConnected = true;
        const wasReconnecting = this.isReconnecting;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
    
        // CORRECTION : Sync uniquement si reconnexion ET données invalides
        if (this.hasConnectedBefore && wasReconnecting && !validateCriticalData(true)) {
            console.log('🔄 Reconnexion avec données invalides, sync...');
            setTimeout(() => {
                if (!window._syncInProgress) {
                    requestDataSync();
                }
            }, 1000);
        }
        
        this.hasConnectedBefore = true;
        this.processMessageQueue();
        this.startHeartbeat();
        this.hideConnectionError();
    }
    
    onClose(event) {
        console.log("WebSocket fermé:", event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        
        // CORRECTION : Ne pas reconnecter seulement si c'est une fermeture normale OU si on a désactivé la reconnexion
        if (event.code === 1000 || !this.shouldReconnect) {
            console.log('Arrêt définitif de la reconnexion');
            return;
        }
        
        // CORRECTION : Reconnexion même en cas de ping timeout (code 1001)
        if (!this.isReconnecting && this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            this.attemptReconnection();
        } else if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error('Nombre maximum de tentatives de reconnexion atteint');
            this.showConnectionError();
        }
    }
    
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Gestion des pongs
            if (data.type === 'pong') {
                this.handlePong();
                return;
            }
            
            handle_websocket_message(data);
            
        } catch (error) {
            console.error('Erreur lors du parsing du message WebSocket:', error);
        }
    }
    
    onError(error) {
        console.error('Erreur WebSocket:', error);
        this.isConnected = false;
    }
    
    attemptReconnection() {

        if (!this.shouldReconnect) {
            console.log('Reconnexion désactivée');
            return;
        }
        
        this.isReconnecting = true;
        const delay = Math.min(
            WS_CONFIG.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
            30000 // Maximum 30 secondes
        );
        
        console.log(`Tentative de reconnexion dans ${delay}ms (${this.reconnectAttempts + 1}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
        
        // CORRECTION : Stocker le timeout pour pouvoir l'annuler si nécessaire
        this.reconnectTimeout = setTimeout(() => {
            if (this.shouldReconnect) {
                this.reconnectAttempts++;
                this.connect();
            }
        }, delay);

    }
    
    startHeartbeat() {
        this.stopHeartbeat(); // S'assurer qu'il n'y a qu'un seul interval
        
        // CORRECTION : Vérifier que shouldReconnect est true avant de démarrer
        if (!this.shouldReconnect) {
            return;
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
                this.sendPing();
            } else {
                console.log('Arrêt du heartbeat - connexion fermée');
                this.stopHeartbeat();
            }
        }, WS_CONFIG.HEARTBEAT_INTERVAL);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    sendPing() {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.lastPingTime = Date.now();
            this.socket.send(JSON.stringify({ type: 'ping' }));
            console.log('Ping envoyé');
            
            // CORRECTION : Timeout plus long et vérification plus robuste
            setTimeout(() => {
                // Vérifier si on attend encore une réponse ET que la connexion est toujours ouverte
                if (this.lastPingTime > 0 && 
                    Date.now() - this.lastPingTime > WS_CONFIG.PING_TIMEOUT && 
                    this.socket.readyState === WebSocket.OPEN) {
                    console.log('Ping timeout détecté, fermeture de la connexion');
                    this.socket.close(1001, 'Ping timeout');
                }
            }, WS_CONFIG.PING_TIMEOUT + 1000); // +1s de marge
        }
    }
    
    handlePong() {
        console.log('Pong reçu');
        this.lastPingTime = 0; // Reset ping timer
    }
    
    send(data) {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(data));
                console.log('Message envoyé:', data.type);
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
                this.messageQueue.push(data);
            }
        } else {
            this.messageQueue.push(data);
            console.log('Message ajouté à la queue (connexion fermée)');
            
            // CORRECTION : Déclencher une reconnexion si nécessaire
            if (!this.isConnected && !this.isReconnecting && this.shouldReconnect) {
                console.log('Déclenchement d\'une reconnexion suite à tentative d\'envoi');
                this.attemptReconnection();
            }
        }
    }
    
    processMessageQueue() {
        console.log(`Traitement de la queue: ${this.messageQueue.length} messages`);
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }
    
    close() {
        console.log('Fermeture manuelle du WebSocket');
        this.shouldReconnect = false; // CORRECTION : Désactiver la reconnexion
        this.stopHeartbeat();
        
        // Nettoyer les timeouts
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.socket) {
            this.socket.close(1000, 'Page unloading');
        }
    }
    
    // NOUVELLE MÉTHODE : Forcer une reconnexion manuelle
    forceReconnect() {
        console.log('Reconnexion forcée');
        this.reconnectAttempts = 0;
        this.shouldReconnect = true;
        
        if (this.socket) {
            this.socket.close(1000, 'Force reconnect');
        } else {
            this.connect();
        }
    }
    
    showConnectionError() {
        let errorNotification = document.querySelector('#connection-error');
        if (!errorNotification) {
            errorNotification = this.createConnectionErrorNotification();
        }
        errorNotification.style.display = 'block';
    }
    
    hideConnectionError() {
        const errorNotification = document.querySelector('#connection-error');
        if (errorNotification) {
            errorNotification.style.display = 'none';
        }
    }
    
    createConnectionErrorNotification() {
        const notification = document.createElement('div');
        notification.id = 'connection-error';
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center">
                <span>Connexion perdue. Tentative de reconnexion...</span>
                <button onclick="wsManager.forceReconnect()" class="ml-2 bg-red-800 px-2 py-1 rounded text-sm">
                    Reconnecter
                </button>
                <button onclick="location.reload()" class="ml-2 bg-red-800 px-2 py-1 rounded text-sm">
                    Recharger
                </button>
            </div>
        `;
        notification.style.display = 'none';
        document.body.appendChild(notification);
        return notification;
    }
}

// FONCTION DE DEBUG AMÉLIORÉE
function debugWebSocketState() {
    if (wsManager) {
        console.log('État WebSocket détaillé:', {
            readyState: wsManager.socket?.readyState,
            readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][wsManager.socket?.readyState] || 'UNKNOWN',
            isConnected: wsManager.isConnected,
            isReconnecting: wsManager.isReconnecting,
            shouldReconnect: wsManager.shouldReconnect,
            reconnectAttempts: wsManager.reconnectAttempts,
            messageQueueLength: wsManager.messageQueue.length,
            hasHeartbeat: !!wsManager.heartbeatInterval,
            lastPingTime: wsManager.lastPingTime
        });
    } else {
        console.log('wsManager n\'existe pas');
    }
}

// Remplacer votre logique WebSocket existante
let wsManager = null;

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
        
        // Initialiser le gestionnaire WebSocket
        wsManager = new WebSocketManager(room);
        
        setup_window_resize_handler();
        init_sector_generation();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du jeu:', error);
        if (wsManager) {
            wsManager.showConnectionError();
        }
    }
}

// Modifier les fonctions qui utilisent gameSocket
function async_reverse_ship(data) {
    if (wsManager) {
        wsManager.send({
            type: "async_reverse_ship",
            message: JSON.stringify(data)
        });
    }
}

function handle_websocket_message(data) {
    console.log('📨 Message WebSocket reçu:', data.type);
    
    try {
        if (data.type !== 'data_sync_response') {
            if (!validateCriticalData(true)) {
                console.warn('⚠️ Données invalides pour', data.type);
                
                // NOUVEAU : Créer une action en attente
                const pendingAction = {
                    type: data.type,
                    data: data,
                    execute: () => {
                        const handler = messageHandlers[data.type];
                        if (handler) handler();
                    }
                };
                
                if (!window._syncInProgress) {
                    console.log('🔄 Déclenchement sync avec action en attente');
                    requestDataSync(pendingAction);
                } else {
                    // Ajouter à la queue si sync déjà en cours
                    window._pendingActions = window._pendingActions || [];
                    window._pendingActions.push(pendingAction);
                }
                return; // Important : ne pas traiter maintenant
            }
        }
        
        // Gestionnaire de messages
        const messageHandlers = setup_message_handlers(data);
        
        const handler = messageHandlers[data.type];
        if (handler) {
            handler();
        } else {
            console.log('❓ Type de message non géré:', data.type);
        }

    } catch (error) {
        console.error('❌ Erreur traitement message:', error);
        
        if (!window._syncInProgress && 
            (error.message.includes('undefined') || error.message.includes('null'))) {
            console.warn('🔄 Tentative de sync suite à erreur...');
            requestDataSync();
        }
    }
}

function requestDataSync() {

    if (window._syncInProgress) {
        console.log('⏸️ Synchronisation déjà en cours, skip...');
        // Si une action est en attente, l'ajouter à la queue
        if (pendingAction) {
            window._pendingActions = window._pendingActions || [];
            window._pendingActions.push(pendingAction);
        }
        return;
    }
    
    console.log('📡 Demande de synchronisation des données...');
    window._syncInProgress = true;
    
    // Stocker l'action en attente
    if (pendingAction) {
        window._pendingActions = [pendingAction];
    }
    
    setTimeout(() => {
        if (window._syncInProgress) {
            console.warn('⚠️ Timeout de synchronisation, reset...');
            window._syncInProgress = false;
            processPendingActions();
        }
    }, 5000);
    
    if (wsManager && wsManager.isConnected) {
        wsManager.send({
            type: "request_data_sync",
            message: JSON.stringify({
                player_id: current_player_id,
                sector_id: map_informations?.sector?.id
            })
        });
    } else {
        console.warn('❌ WebSocket non connecté, impossible de demander la synchronisation');
        window._syncInProgress = false;
    }
}

// fonction pour traiter les actions en attente
function processPendingActions() {
    if (!window._pendingActions || window._pendingActions.length === 0) {
        return;
    }
    
    console.log(`🔄 Traitement de ${window._pendingActions.length} action(s) en attente...`);
    
    // Traiter chaque action en attente
    while (window._pendingActions.length > 0) {
        const action = window._pendingActions.shift();
        
        try {
            if (validateCriticalData(true)) {
                console.log('✅ Exécution de l\'action en attente:', action.type);
                action.execute();
            } else {
                console.error('❌ Impossible d\'exécuter l\'action, données toujours invalides');
                // Remettre l'action dans la queue
                window._pendingActions.unshift(action);
                break;
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'exécution de l\'action en attente:', error);
        }
    }
}

function forceSyncReset() {
    console.log('🔧 Force reset de la synchronisation');
    window._syncInProgress = false;
    
    // Vérifier l'état actuel
    debugDataState();
    
    // Si toujours invalide, proposer un reload
    if (!validateCriticalData()) {
        console.error('⚠️ Données toujours invalides après reset. Reload recommandé.');
        if (confirm('Les données du jeu semblent corrompues. Recharger la page ?')) {
            location.reload();
        }
    }
}

function validateCriticalData(skipLogging = false) {
    const checks = {
        currentPlayerExists: !!currentPlayer,
        currentPlayerHasUser: !!(currentPlayer && currentPlayer.user),
        currentPlayerHasShip: !!(currentPlayer && currentPlayer.ship),
        playerIdValid: current_player_id !== null && current_player_id !== undefined,
        mapInfoExists: !!map_informations,
        mapInfoHasSector: !!(map_informations && map_informations.sector),
        otherPlayersArray: Array.isArray(otherPlayers)
    };
    
    const criticalChecks = [
        checks.currentPlayerExists,
        checks.currentPlayerHasUser,
        checks.currentPlayerHasShip,
        checks.playerIdValid,
        checks.mapInfoExists,
        checks.mapInfoHasSector,
        checks.otherPlayersArray
    ];
    
    const isValid = criticalChecks.every(check => Boolean(check));
    
    if (!isValid && !skipLogging) {
        console.error('❌ Validation échouée:', {
            currentPlayer: !!currentPlayer,
            currentPlayer_user: !!(currentPlayer && currentPlayer.user),
            currentPlayer_ship: !!(currentPlayer && currentPlayer.ship),
            current_player_id: current_player_id,
            map_informations: !!map_informations
        });
        
        const failedChecks = [];
        if (!checks.currentPlayerExists) failedChecks.push('currentPlayer manquant');
        if (!checks.currentPlayerHasUser) failedChecks.push('currentPlayer.user manquant');
        if (!checks.currentPlayerHasShip) failedChecks.push('currentPlayer.ship manquant');
        if (!checks.playerIdValid) failedChecks.push('current_player_id invalide');
        if (!checks.mapInfoExists) failedChecks.push('map_informations manquant');
        if (!checks.mapInfoHasSector) failedChecks.push('map_informations.sector manquant');
        if (!checks.otherPlayersArray) failedChecks.push('otherPlayers pas un tableau');
        
        console.error('Checks échoués:', failedChecks);
    }
    
    return isValid;
}

// traiter les actions après sync
function handleDataSyncResponse(data) {
    console.log('📥 Réponse de synchronisation reçue');
    
    try {
        const syncData = data;
        
        // Restauration des données
        if (syncData.current_player) {
            currentPlayer = syncData.current_player;
            console.log('✅ currentPlayer restauré');
        } else {
            console.warn('⚠️ current_player manquant');
        }
        
        if (syncData.other_players && Array.isArray(syncData.other_players)) {
            otherPlayers = syncData.other_players;
            console.log('✅ otherPlayers restauré:', otherPlayers.length);
        } else {
            otherPlayers = [];
        }
        
        if (syncData.map_informations) {
            map_informations = {
                ...map_informations,
                ...syncData.map_informations,
                pc: syncData.map_informations.pc || [],
                npc: syncData.map_informations.npc || [],
                sector: syncData.map_informations.sector,
                sector_element: syncData.map_informations.sector_element || []
            };
            console.log('✅ map_informations mis à jour');
        }
        
        if (syncData.npcs && Array.isArray(syncData.npcs)) {
            npcs.length = 0;
            npcs.push(...syncData.npcs);
            console.log('✅ NPCs mis à jour:', npcs.length);
        }
        
        // Redémarrer les systèmes
        if (typeof initializeDetectionSystem === 'function' && currentPlayer) {
            initializeDetectionSystem(currentPlayer, otherPlayers, npcs);
        }
        
        console.log('✅ Synchronisation terminée');
        
        // CRITIQUE : Marquer la fin et traiter les actions en attente
        window._syncInProgress = false;
        processPendingActions();
        
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        window._syncInProgress = false;
    }
}

// Fonction de nettoyage mise à jour
function cleanup_game() {
    console.log("Nettoyage du jeu...");
    
    // NOUVEAU : Nettoyer le sonar
    if (typeof cleanupSonar === 'function') {
        cleanupSonar();
    }
    
    // Fermer la connexion WebSocket
    if (wsManager) {
        wsManager.close();
        wsManager = null;
    }
}


function debugDataState() {
    console.log('=== ÉTAT DES DONNÉES ===');
    console.log('currentPlayer:', currentPlayer);
    console.log('current_player_id:', current_player_id);
    console.log('otherPlayers:', otherPlayers?.length || 'undefined');
    console.log('Sync en cours:', window._syncInProgress);
    console.log('Actions en attente:', window._pendingActions?.length || 0);
    console.log('Données valides:', validateCriticalData(true));
    console.log('========================');
}

window.debugData = debugDataState;
window.syncData = () => {
    if (!window._syncInProgress) {
        requestDataSync();
    } else {
        console.warn('Sync déjà en cours');
    }
};
window._syncInProgress = false;
window._pendingActions = [];
window.debugData = debugDataState;

window.validateData = () => validateCriticalData(false);
window.forceSyncReset = forceSyncReset;
window._syncInProgress = false;


// Event listeners
window.addEventListener('beforeunload', cleanup_game);
window.addEventListener('pagehide', cleanup_game);
window.addEventListener('load', init_game);