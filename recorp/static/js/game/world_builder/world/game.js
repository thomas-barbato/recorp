
// Configuration et variables globales
const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_player_id = JSON.parse(document.getElementById('script_current_player_id').textContent);
let currentPlayer = map_informations.pc.find(p => p.user.player === current_player_id);
let otherPlayers = map_informations.pc.filter(p => p.user.player !== current_player_id);
let foregroundElement = map_informations.sector_element || [];
let npcs = map_informations.npc || [];
let observable_zone = [];
let observable_zone_id = [];
let mobile_radar_sweep_bool = true;
let pendingAction = null;
// Instance globale
const actionManager = new ActionManager();
const loadingScreen = new LoadingScreen({ minDisplayDuration: 2000 });
loadingScreen.show('Connexion au serveur');

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
    
    // CORRECTION: Attacher l'événement resize à la fenêtre
    window.addEventListener('resize', handleResize);
    
    // Optionnel: Retourner une fonction de nettoyage
    return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
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
    HEARTBEAT_INTERVAL: 25000,
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
            
            if (data.type === 'pong') {
                this.handlePong(data);
                return;
            }

            if (data.type === 'none'){
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
        this.lastPingTime = 0;
    }
    
    sendPing() {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.lastPingTime = Date.now();
            
            // Envoyer un hash des données critiques
            const dataHash = this.generateDataHash();
            
            this.socket.send(JSON.stringify({ 
                type: 'ping',
                client_data_hash: dataHash,
                player_id: current_player_id
            }));
            
            console.log('Ping envoyé avec hash:', dataHash);
            
            setTimeout(() => {
                if (this.lastPingTime > 0 && 
                    Date.now() - this.lastPingTime > WS_CONFIG.PING_TIMEOUT && 
                    this.socket.readyState === WebSocket.OPEN) {
                    console.log('Ping timeout détecté');
                    this.socket.close(1001, 'Ping timeout');
                }
            }, WS_CONFIG.PING_TIMEOUT + 1000);
        }
    }

    handlePong(data) {
        console.log('Pong reçu');
        this.lastPingTime = 0;
        
        // ⚠️ NOUVEAU : Vérifier si le serveur signale une désynchronisation
        if (data.sync_required) {
            console.warn('⚠️ Serveur détecte une désynchronisation, sync...');
            if (!window._syncInProgress) {
                requestDataSync();
            }
        }
    }

    // Générer un hash simple des données critiques
    generateDataHash() {
        try {
            const criticalData = {
                currentPlayer: currentPlayer?.user?.player || null,
                otherPlayersCount: otherPlayers?.length || 0,
                sectorId: map_informations?.sector?.id || null
            };
            
            // Hash simple basé sur JSON.stringify
            const str = JSON.stringify(criticalData);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString(36);
        } catch (e) {
            return 'error';
        }
    }

    verifyAuthentication() {
        // Faire une micro-requête pour vérifier la session
        fetch('session-check', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok || response.status === 401) {
                console.error('Session expirée, rechargement nécessaire');
                this.showSessionExpiredError();
            }
        })
        .catch(error => {
            console.warn('Impossible de vérifier la session:', error);
        });
    }

    showSessionExpiredError() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-orange-600 text-white p-4 rounded shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center">
                <span>Votre session a expiré. Veuillez recharger la page.</span>
                <button onclick="location.reload()" class="ml-2 bg-orange-800 px-2 py-1 rounded text-sm">
                    Recharger
                </button>
            </div>
        `;
        document.body.appendChild(notification);
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
            
            // Déclencher une reconnexion si nécessaire
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
        initializeActionSystem()
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du jeu:', error);
        if (wsManager) {
            wsManager.showConnectionError();
        }
    }
}

function handle_websocket_message(data) {
    console.log('Message recu:', data.type);
    
    try {
        // Extraire les données du message
        const messageData = data.message;
        
        // Exécuter l'action via le gestionnaire
        actionManager.execute(data.type, messageData);
        
    } catch (error) {
        console.error('Erreur traitement message:', error);
        
        // Gérer les erreurs critiques
        if (actionManager.isDataError(error) && !actionManager.syncInProgress) {
            actionManager.requestSync();
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

    // Timeout de sécurité
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

function executeUserAction(actionFunction) {
    // Vérifier les données avant l'action
    if (!validateCriticalData(true)) {
        console.warn('⚠️ Données invalides détectées avant action');
        
        // Stocker l'action pour exécution après sync
        pendingAction = {
            execute: actionFunction,
            timestamp: Date.now(),
            type: actionFunction.name || 'unknown'
        };
        
        // Demander la synchronisation
        if (!window._syncInProgress) {
            requestDataSync();
        }
        
        return false; // Action bloquée
    }
    
    // Exécuter l'action si données valides
    actionFunction();
    return true;
}   

// fonction pour traiter les actions en attente
function processPendingActions() {
    if (pendingAction && !window._syncInProgress) {
        console.log('🔄 Exécution de l\'action en attente:', pendingAction.type);
        
        if (validateCriticalData(true)) {
            try {
                pendingAction.execute();
                pendingAction = null;
            } catch (error) {
                console.error('❌ Erreur exécution action:', error);
                pendingAction = null;
            }
        } else {
            console.error('❌ Données toujours invalides après sync');
            pendingAction = null;
        }
    }
    
    // Traiter aussi les actions de la queue
    if (window._pendingActions && window._pendingActions.length > 0) {
        console.log(`🔄 Traitement de ${window._pendingActions.length} action(s) en queue...`);
        
        while (window._pendingActions.length > 0) {
            const action = window._pendingActions.shift();
            
            try {
                if (validateCriticalData(true)) {
                    action.execute();
                } else {
                    console.error('❌ Données invalides, action abandonnée');
                }
            } catch (error) {
                console.error('❌ Erreur action queue:', error);
            }
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
    console.log('📥 Synchronisation reçue');
    
    try {
        
        // Restaurer les données globales
        if (data.current_player != currentPlayer) {
            currentPlayer = data.current_player;
        }
        
        if ((data.other_players && Array.isArray(data.other_players)) && otherPlayers != data.other_players) {
            otherPlayers = data.other_players;
        }
        
        if (data.map_informations) {
            Object.assign(map_informations, data.map_informations);
        }
        
        if (data.npcs && Array.isArray(data.npcs)) {
            npcs.length = 0;
            npcs.push(...data.npcs);
        }
        
        /*
        // CRITIQUE : Nettoyer et redessiner TOUS les joueurs
        cleanAllPlayerPositions();
        
        // Redessiner le joueur actuel
        if (currentPlayer) {
            add_pc(currentPlayer);
            otherPlayers.forEach(player => {
                add_pc(player);
            });
        }
        
        // IMPORTANT: Restaurer les joueurs unknown qui étaient affichés
        restoreUnknownPlayers(unknownPlayersState);*/
        
        // Mettre à jour le sonar si disponible
        if (currentPlayer && typeof updatePlayerSonar === 'function') {
            const coords = {
                y: currentPlayer.user.coordinates.y + 1,
                x: currentPlayer.user.coordinates.x + 1
            };
            updatePlayerSonar(coords, currentPlayer.ship.view_range);
        }
        
        console.log('✅ Synchronisation terminée avec succès');
        
        // Marquer la fin de la sync
        actionManager.onSyncComplete();
        
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        actionManager.syncInProgress = false;
    }
}


function initializeActionSystem() {
    // Enregistrer toutes les actions
    registerAllActions();
    
    // Logger pour debug
    console.log(`Systeme d'actions initialise: ${ActionRegistry.handlers.size} actions`);
}

// Fonction de nettoyage mise à jour
function cleanup_game() {
    console.log("🧹 Nettoyage du jeu...");
    
    // Arrêter immédiatement le heartbeat
    if (wsManager) {
        wsManager.shouldReconnect = false; // Empêcher toute reconnexion
        wsManager.stopHeartbeat();
    }
    
    // Nettoyer le sonar
    if (typeof cleanupSonar === 'function') {
        try {
            cleanupSonar();
        } catch (e) {
            console.error('Erreur cleanup sonar:', e);
        }
    }
    
    // Vider la queue de messages
    if (wsManager) {
        wsManager.messageQueue = [];
    }
    
    // 4. Annuler les timeouts/intervals en cours
    if (wsManager && wsManager.reconnectTimeout) {
        clearTimeout(wsManager.reconnectTimeout);
        wsManager.reconnectTimeout = null;
    }
    
    // Fermer la connexion WebSocket (en dernier)
    if (wsManager && wsManager.socket) {
        try {
            // Forcer la fermeture immédiate sans attendre
            wsManager.socket.onclose = null; // Désactiver le handler pour éviter la reconnexion
            wsManager.socket.close(1000, 'Page unloading');
            wsManager.socket = null;
        } catch (e) {
            console.error('Erreur fermeture WebSocket:', e);
        }
    }
    
    wsManager = null;
    console.log("✅ Nettoyage terminé");
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

window.debugActions = () => {
    console.log('=== SYSTEME D\'ACTIONS ===');
    console.log('Etat:', actionManager.getState());
    console.log('Actions enregistrees:', Array.from(ActionRegistry.handlers.keys()));
    console.log('========================');
};

window.forceProcessActions = () => {
    actionManager.processPendingActions();
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
window.addEventListener('load', () => {
    init_game();
    loadingScreen.hide();
});