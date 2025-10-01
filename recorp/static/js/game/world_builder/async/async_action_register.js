

function registerAllActions(){

    // Action de sync - ne nécessite pas de validation
    ActionRegistry.register('data_sync_response', 
        (data) => handleDataSyncResponse(data),
        { requiresValidation: false }
    );

    // Action de mouvement avec enrichissement des données
    ActionRegistry.register('player_move', 
        (data) => {
            if (data && validateCriticalData(true)) {
                update_player_coord(data);
            } else {
                console.error('Données invalides pour player_move');
            }
        },
        {
            requiresValidation: true,
            enrichData: (data) => {
                // S'assurer que les données sont complètes
                if (!data.updated_current_player_data || !data.updated_other_player_data) {
                    return {
                        ...data,
                        updated_current_player_data: [currentPlayer],
                        updated_other_player_data: otherPlayers
                    };
                }
                return data;
            }
        }
    );

    ActionRegistry.register('async_reverse_ship',
        (data) => {
            if (data.message && validateCriticalData(true)) {
                reverse_ship(data.message);
            } else {
                console.error('❌ Impossible de traiter reverse_ship, données invalides');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('async_warp_travel',
        (data) => {
            if (data.message && validateCriticalData(true)) {
                async_travel(data.message);
            } else {
                console.error('❌ Impossible de traiter async_travel, données invalides');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('async_remove_ship',
        (data) => {
            if (data.message && validateCriticalData(true)) {
                remove_ship_display(data.message);
            } else {
                console.error('❌ Impossible de traiter remove_ship_display, données invalides');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('user_join',
        (data) => {
            if (data.message && validateCriticalData(true)) {
                add_pc(data.message);
            } else {
                console.error('❌ Impossible de traiter add_pc, données invalide');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('send_message',
        (data) => {
            if (data.message && validateCriticalData(true)) {
                console.log('💬 Message reçu:', data.message)
            } else {
                console.error('❌ Impossible de traiter send_chat_message, données invalides');
            }
        },
        { requiresValidation: false }
    );

    return {
        'send_message': () => {
            if (data.message && validateCriticalData(true)) {
                //send_chat_message(data.message);
                console.log('💬 Message reçu:', data.message)
            } else {
                console.error('❌ Impossible de traiter send_chat_message, données invalides');
            }
        } 
    };
}