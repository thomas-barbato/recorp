const ActionRegistry = {
    handlers: new Map(),
    
    /**
     * Enregistre un gestionnaire d'action
     * @param {string} type - Type d'action (ex: 'player_move')
     * @param {Function} handler - Fonction qui traite l'action
     * @param {Object} options - Options (requiresValidation, enrichData, etc.)
     */
    register(type, handler, options = {}) {
        this.handlers.set(type, {
            handler,
            requiresValidation: options.requiresValidation !== false, // true par défaut
            enrichData: options.enrichData || null, // fonction d'enrichissement optionnelle
            canRetry: options.canRetry !== false // true par défaut
        });
    },
    
    /**
     * Récupère un gestionnaire d'action
     */
    get(type) {
        return this.handlers.get(type);
    },
    
    /**
     * Vérifie si une action existe
     */
    has(type) {
        return this.handlers.has(type);
    }
};