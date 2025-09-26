
// Configuration WebSocket améliorée
const WS_CONFIG = {
    RECONNECT_DELAY: 1000,
    RESIZE_DELAY: 300,
    MAX_RECONNECT_ATTEMPTS: 10,
    HEARTBEAT_INTERVAL: 25000, // 25 secondes
    CONNECTION_TIMEOUT: 10000,
    PING_TIMEOUT: 5000
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
        
        this.connect();
    }
    
    connect() {
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${this.room}/`;
        
        this.socket = new WebSocket(ws_url);
        this.setupEventHandlers();
        
        // Timeout de connexion
        const connectionTimeout = setTimeout(() => {
            if (this.socket.readyState === WebSocket.CONNECTING) {
                console.log('Connection timeout, closing socket');
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
        console.log('WebSocket connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
        // Traiter la queue des messages en attente
        this.processMessageQueue();
        
        // Démarrer le heartbeat
        this.startHeartbeat();
        
        // Masquer les notifications d'erreur
        this.hideConnectionError();
    }
    
    onClose(event) {
        console.log("WebSocket fermé:", event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        
        // Ne pas reconnecter si c'est une fermeture normale (code 1000)
        if (event.code === 1000) {
            return;
        }
        
        // Reconnexion intelligente avec backoff exponentiel
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
        this.isReconnecting = true;
        const delay = Math.min(
            WS_CONFIG.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
            30000 // Maximum 30 secondes
        );
        
        console.log(`Tentative de reconnexion dans ${delay}ms (${this.reconnectAttempts + 1}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }
    
    startHeartbeat() {
        this.stopHeartbeat(); // S'assurer qu'il n'y a qu'un seul interval
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
                this.sendPing();
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
            
            // Vérifier si on reçoit un pong dans les temps
            setTimeout(() => {
                if (Date.now() - this.lastPingTime > WS_CONFIG.PING_TIMEOUT) {
                    console.log('Ping timeout, fermeture de la connexion');
                    this.socket.close();
                }
            }, WS_CONFIG.PING_TIMEOUT);
        }
    }
    
    handlePong() {
        this.lastPingTime = 0; // Reset ping timer
    }
    
    send(data) {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            // Ajouter à la queue si pas connecté
            this.messageQueue.push(data);
            console.log('Message ajouté à la queue (connexion fermée)');
        }
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }
    
    close() {
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.close(1000, 'Page unloading');
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
                <button onclick="location.reload()" class="ml-4 bg-red-800 px-2 py-1 rounded text-sm">
                    Recharger
                </button>
            </div>
        `;
        notification.style.display = 'none';
        document.body.appendChild(notification);
        return notification;
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

// Event listeners
window.addEventListener('beforeunload', cleanup_game);
window.addEventListener('pagehide', cleanup_game);
window.addEventListener('load', init_game);