class ActionManager {
    constructor() {
        this.pendingActions = [];
        this.syncInProgress = false;
    }
    
    /**
     * Exécute une action immédiatement ou la met en attente
     */
    execute(actionType, actionData) {
        const actionConfig = ActionRegistry.get(actionType);
        
        if (!actionConfig) {
            console.log('Type d\'action inconnu:', actionType);
            return false;
        }
        
        // Vérifier si validation nécessaire
        if (actionConfig.requiresValidation && !validateCriticalData(true)) {
            console.warn('Données invalides pour', actionType);
            this.queueAction(actionType, actionData);
            
            if (!this.syncInProgress) {
                this.requestSync();
            }
            return false;
        }
        
        try {
            // Enrichir les données si nécessaire
            const enrichedData = actionConfig.enrichData 
                ? actionConfig.enrichData(actionData)
                : actionData;
            
            // Exécuter l'action
            actionConfig.handler(enrichedData);
            return true;
            
        } catch (error) {
            console.error('Erreur lors de l\'exécution de', actionType, ':', error);
            
            // Retry si l'erreur semble liée aux données
            if (actionConfig.canRetry && this.isDataError(error)) {
                this.queueAction(actionType, actionData);
                if (!this.syncInProgress) {
                    this.requestSync();
                }
            }
            return false;
        }
    }
    
    /**
     * Met une action en file d'attente
     */
    queueAction(actionType, actionData) {
        const action = {
            type: actionType,
            data: JSON.parse(JSON.stringify(actionData)), // Clone profond
            timestamp: Date.now()
        };
        
        this.pendingActions.push(action);
        console.log(`Action en attente: ${actionType} (${this.pendingActions.length} total)`);
    }
    
    /**
     * Traite toutes les actions en attente
     */
    processPendingActions() {
        if (this.pendingActions.length === 0) return;
        
        console.log(`Traitement de ${this.pendingActions.length} action(s)...`);
        
        const actionsToProcess = [...this.pendingActions];
        this.pendingActions = [];
        
        for (const action of actionsToProcess) {
            const success = this.execute(action.type, action.data);
            
            if (!success) {
                // Si échec, remettre en queue (évite boucle infinie avec compteur)
                if (!action.retryCount) action.retryCount = 0;
                action.retryCount++;
                
                if (action.retryCount < 3) {
                    this.pendingActions.push(action);
                } else {
                    console.error('Action abandonnée après 3 tentatives:', action.type);
                }
            }
        }
    }
    
    /**
     * Demande une synchronisation des données
     */
    requestSync() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        console.log('Demande de synchronisation...');
        
        // Timeout de sécurité
        setTimeout(() => {
            if (this.syncInProgress) {
                console.warn('Timeout de sync, reset');
                this.syncInProgress = false;
                this.processPendingActions();
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
            console.warn('WebSocket non connecté');
            this.syncInProgress = false;
        }
    }
    
    /**
     * Callback après sync réussie
     */
    onSyncComplete() {
        this.syncInProgress = false;
        this.processPendingActions();
    }
    
    /**
     * Détecte si une erreur est liée aux données manquantes
     */
    isDataError(error) {
        return error.message && (
            error.message.includes('undefined') ||
            error.message.includes('null') ||
            error.message.includes('Cannot read')
        );
    }
    
    /**
     * Debug: affiche l'état
     */
    getState() {
        return {
            syncInProgress: this.syncInProgress,
            pendingActions: this.pendingActions.length,
            registeredActions: ActionRegistry.handlers.size
        };
    }
}
