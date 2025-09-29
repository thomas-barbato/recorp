

function setup_message_handlers(data){

    return {
        'player_move': () => {
            if (data.message && validateCriticalData(true)) {
                update_player_coord(data.message);
            } else {
                console.error('❌ Impossible de traiter player_move, données invalides');
            }
        },
        'async_reverse_ship': () => {
            if (data.message && validateCriticalData(true)) {
                reverse_ship(data.message);
            } else {
                console.error('❌ Impossible de traiter reverse_ship, données invalides');
            }
        },
        'async_warp_travel': () => {
            if (data.message && validateCriticalData(true)) {
                async_travel(data.message);
            } else {
                console.error('❌ Impossible de traiter async_travel, données invalides');
            }
        },
        'async_remove_ship': () => {
            if (data.message && validateCriticalData(true)) {
                remove_ship_display(data.message);
            } else {
                console.error('❌ Impossible de traiter remove_ship_display, données invalides');
            }
        },
        'data_sync_response': () => {
            if (data.message && validateCriticalData(true)) {
                handleDataSyncResponse(data.message);
            } else {
                console.error('❌ Impossible de traiter handleDataSyncResponse, données invalides');
            }
        },
        'user_join': () => {
            if (data.message && validateCriticalData(true)) {
                add_pc(data.message);
            } else {
                console.error('❌ Impossible de traiter add_pc, données invalides');
            }
        },
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