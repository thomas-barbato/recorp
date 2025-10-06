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