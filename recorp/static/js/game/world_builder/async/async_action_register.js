

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
                handleWarpTravel(data.message);
            } else {
                console.error('❌ Impossible de traiter handleWarpTravel, données invalides');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('async_warp_complete',
        (data) => {
            if (data && validateCriticalData(true)) {
                handleWarpComplete(data);
            } else {
                console.error('❌ Impossible de traiter async_warp_complete, données invalides');
            }
        },
        { requiresValidation: false }
    );


    ActionRegistry.register('async_remove_ship',
        (data) => {
            if (data && validateCriticalData(true)) {
                remove_ship_display(data);
            } else {
                console.error('❌ Impossible de traiter remove_ship_display, données invalides');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('async_user_join',
        (data) => { handleUserJoin(data);},
        { requiresValidation: false }
    );

    ActionRegistry.register('async_sent_mp',
        (data) => {
            if (data) {
                if(data.id == currentPlayer.user.player){
                    console.log('💬 Message envoyé')
                }
            } else {
                console.error('❌ Impossible de traiter send_chat_message, données invalides');
            }
        },
        { requiresValidation: false }
    );

    ActionRegistry.register('async_recieve_mp',
        (data) => {
            if (data) {
                if(data.recipient_id == currentPlayer.user.player){
                    showPrivateMessageNotification(data.note);
                    const mailList = document.querySelector('#mail-list');
                    if (mailList && !mailList.classList.contains('hidden')) {
                        loadMessages();
                    }
                }
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