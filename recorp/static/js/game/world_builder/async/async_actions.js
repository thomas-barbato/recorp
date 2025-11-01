// ASYNC GAME LOGIC
function async_move(pos) {
    cleanCss();
    executeUserAction(() => {
        if (wsManager && wsManager.isConnected) {
            wsManager.send({
                message: JSON.stringify({
                    "player": pos.player,
                    "end_x": pos.end_x,
                    "end_y": pos.end_y,
                    "size_x": pos.size_x,
                    "size_y": pos.size_y,
                    "is_reversed": pos.is_reversed,
                    "start_id_array": pos.start_id_array,
                    "move_cost": pos.move_cost,
                    "destination_id_array": pos.destination_id_array,
                }),
                type: "async_move"
            });
        } else {
            console.error('WebSocket non connecté pour async_move');
        }
    });
}

function async_reverse_ship(data) {
    clear_path();
    if (wsManager && wsManager.isConnected) {
        wsManager.send({
            message: JSON.stringify({
                "player": data.player,
                "id_array": data.id_array,
            }),
            type: "async_reverse_ship"
        });
    } else {
        console.error('WebSocket non connecté pour async_reverse_ship');
    }
}


function handleWarpTravel(sectorWarpZoneId){
    executeUserAction(() => {
        if (wsManager && wsManager.isConnected) {
            let spaceship = document.querySelector('.player-ship-start-pos');
            let coordinates = spaceship.getAttribute('id').split('_')
            let size_x = spaceship.getAttribute('size_x');
            let size_y = spaceship.getAttribute('size_y');
            const playerCoordArray = Array.from(document.querySelectorAll('.ship-pos')).map(element => element.id);;
            let data = {
                "player_id": currentPlayer.user.player,
                "sectorwarpzone_id": sectorWarpZoneId,
                "current_sector_id": map_informations.sector.id,
                "start_id_array": playerCoordArray,
                "coordinates": {
                    y : coordinates[0],
                    x : coordinates[1]
                },
                "size": {
                    x : size_x,
                    y : size_y
                }
            }
            
            wsManager.send({
                type: "async_warp_travel",
                message: JSON.stringify(data)
            });

        } else {
            console.error('WebSocket non connecté pour async_reverse_ship');
        }
    })
}

function handleWarpComplete(data) {
    
    const { new_sector_id, new_room_key, new_sector_data, player_id } = data;

    // 🚀 Afficher le loader pendant la transition
    let sector_name = new_sector_data.sector.name.replaceAll('-', ' ').replaceAll('_', ' ')
    loadingScreen.show('Saut en cours vers le secteur ' + sector_name);
    
    // Bloquer les actions pendant la transition
    window._syncInProgress = true;
    
    // Fermer l'ancienne connexion WebSocket proprement
    if (wsManager) {
        wsManager.shouldReconnect = false; // Empêcher la reconnexion auto
        wsManager.close();
    }
    
    // Nettoyer l'ancien secteur
    cleanupSector();
    
    // Mettre à jour les données globales
    map_informations.sector = new_sector_data.sector;
    map_informations.sector_element = new_sector_data.sector_element;
    map_informations.npc = new_sector_data.npc;
    map_informations.pc = new_sector_data.pc;
    
    // Trouver le joueur actuel dans les nouvelles données
    currentPlayer = map_informations.pc.find(p => p.user.player === current_player_id);
    otherPlayers = map_informations.pc.filter(p => p.user.player !== current_player_id);
    foregroundElement = map_informations.sector_element || [];
    npcs = map_informations.npc || [];
    
    // Créer une nouvelle connexion WebSocket
    setTimeout(() => {
        
        wsManager = new WebSocketManager(new_sector_id);
        // Attendre que la connexion soit établie
        const checkConnection = setInterval(() => {
            
            if (wsManager.isConnected) {

                clearInterval(checkConnection);
                // reset du secteur
                recreateTileStructure();
                // Régénérer le secteur
                init_sector_generation();
                // Débloquer les actions
                window._syncInProgress = false;

                // ✅ Cacher le loader quand tout est prêt
                loadingScreen.hide();
            }

        }, 100);
    }, 500); // Petit délai pour la transition
}

function async_send_mp(data){
    console.log(data)
    executeUserAction(() => {
        if (wsManager && wsManager.isConnected) {
            wsManager.send({
                message: data,
                type: "async_send_mp"
            });
        } else {
            console.error('WebSocket non connecté pour async_send_mp');
        }
    });
}