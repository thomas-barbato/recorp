import { map_informations, current_player_id } from '../globals.js';

const WS_CONFIG = {
    RECONNECT_DELAY: 2000,
    RESIZE_DELAY: 300,
    MAX_RECONNECT_ATTEMPTS: 15,
    HEARTBEAT_INTERVAL: 25000,
    CONNECTION_TIMEOUT: 15000,
    PING_TIMEOUT: 15000
};

export default class WebSocketManager {
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

    connect(){
        if (!this.room) {
        console.error('WebSocketManager.connect: room is required');
        return;
        }

        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${this.room}/`;

        this.socket = new WebSocket(ws_url);
        this.setupEventHandlers();

        const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
            console.log('Connection timeout, closing socket');
            this.socket.close();
        }
        }, WS_CONFIG.CONNECTION_TIMEOUT);

        this.socket.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
        this.onOpen();
        });
    }

    setupEventHandlers(){
        this.socket.onopen = () => this.onOpen();
        this.socket.onclose = (e) => this.onClose(e);
        this.socket.onmessage = (e) => this.onMessage(e);
        this.socket.onerror = (err) => this.onError(err);
    }

    onOpen(){
        this.isConnected = true;
        const wasReconnecting = this.isReconnecting;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;

        if (this.hasConnectedBefore && wasReconnecting && !this.validateCriticalData(true)) {
        setTimeout(() => {
            if (!window._syncInProgress && typeof window.requestDataSync === 'function') {
            window.requestDataSync();
            }
        }, 1000);
        }

        this.hasConnectedBefore = true;
        this.processMessageQueue();
        this.startHeartbeat();
        if (typeof this.hideConnectionError === 'function') this.hideConnectionError();
    }

    onClose(e){
        console.log('WebSocket closed', e.code, e.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        if (!this.shouldReconnect || e.code === 1000) return;
        if (!this.isReconnecting && this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        this.attemptReconnection();
        } else {
        console.error('Max reconnect attempts reached');
        if (typeof this.showConnectionError === 'function') this.showConnectionError();
        }
    }

    onMessage(event){
        try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
            this.handlePong(data);
            return;
        }
        if (typeof window.handle_websocket_message === 'function') {
            window.handle_websocket_message(data);
        } else {
            console.warn('No global handle_websocket_message defined');
        }
        } catch (e) {
        console.error('Websocket message parse error', e);
        }
    }

    onError(err){
        console.error('WebSocket error', err);
        this.isConnected = false;
    }

    attemptReconnection(){
        this.isReconnecting = true;
        const delay = Math.min(WS_CONFIG.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
        }, delay);
    }

    startHeartbeat(){
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.sendPing();
        } else {
            this.stopHeartbeat();
        }
        }, WS_CONFIG.HEARTBEAT_INTERVAL);
    }

    stopHeartbeat(){
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.lastPingTime = 0;
    }

    sendPing(){
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.lastPingTime = Date.now();
        const dataHash = this.generateDataHash();
        this.send({ type: 'ping', client_data_hash: dataHash, player_id: current_player_id });
        setTimeout(() => {
        if (this.lastPingTime > 0 && Date.now() - this.lastPingTime > WS_CONFIG.PING_TIMEOUT && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close(1001, 'Ping timeout');
        }
        }, WS_CONFIG.PING_TIMEOUT + 1000);
    }

    handlePong(data){
        this.lastPingTime = 0;
        if (data.sync_required && typeof window.requestDataSync === 'function' && !window._syncInProgress) {
        window.requestDataSync();
        }
    }

    send(data){
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
            this.socket.send(JSON.stringify(data));
        } catch (e) {
            console.error('WebSocket send failed', e);
            this.messageQueue.push(data);
        }
        } else {
        this.messageQueue.push(data);
        if (!this.isConnected && !this.isReconnecting) this.attemptReconnection();
        }
    }

    processMessageQueue(){
        while (this.messageQueue.length && this.isConnected) {
        const m = this.messageQueue.shift();
        this.send(m);
        }
    }

    generateDataHash(){
        try {
        const critical = {
            currentPlayer: window.currentPlayer?.user?.player || null,
            otherPlayersCount: window.otherPlayers?.length || 0,
            sectorId: map_informations?.sector?.id || null
        };
        const str = JSON.stringify(critical);
        let hash = 0;
        for (let i=0;i<str.length;i++){ const c = str.charCodeAt(i); hash = ((hash<<5)-hash)+c; hash = hash & hash; }
        return hash.toString(36);
        } catch (e) { return 'err'; }
    }

    close(){
        this.shouldReconnect = false;
        this.stopHeartbeat();
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        if (this.socket) { try { this.socket.close(1000,'manual close'); } catch(e){} }
    }
}

// Expose for legacy usage
window.WebSocketManagerClass = WebSocketManager;
