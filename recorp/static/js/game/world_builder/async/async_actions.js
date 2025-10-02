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


function async_travel(sector_id, warpzone_name){
    executeUserAction(() => {
        if (wsManager && wsManager.isConnected) {
            let spaceship = document.querySelector('.player-ship-start-pos');
            let coordinates = spaceship.getAttribute('id').split('_')
            let size_x = spaceship.getAttribute('size_x');
            let size_y = spaceship.getAttribute('size_y');
            let data = {
                "player_id": currentPlayer.user.player,
                "source_id": sector_id,
                "warpzone_name": warpzone_name,
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

function remove_ship_display(data){
    let coord_x = parseInt(data.position.x);
    let coord_y = parseInt(data.position.y);
    let player_id = data.player_id;
    let size = data.size;

    if(size.x == 1 && size.y == 1){
        let element = document.getElementById(`${coord_y}_${coord_x}`);
        let element_div = element.querySelector('div');
        let element_div_span = document.createElement('span');
        
        element.removeAttribute("size_x");
        element.removeAttribute("size_y");
        element_div.replaceChildren();

        element_div_span.className = "absolute hover:box-border hover:border-2 hover:border hover:border-solid inline-block border-white w-[32px] h-[32px] pathfinding-zone cursor-pointer";
        element_div_span.setAttribute('title', `${map_informations["sector"]["name"]} [y = ${parseInt(coord_y)}; x = ${parseInt(coord_x)}]`);
        element_div_span.setAttribute(attribute_touch_mouseover, 'get_pathfinding(this)');
        element_div_span.setAttribute(attribute_touch_click, 'display_pathfinding()');
        
        element_div.append(element_div_span);
    }else{
        for(let index_row = parseInt(coord_y) ; index_row <  parseInt(coord_y) + parseInt(size.y) ; index_row++){
            for(let index_col = parseInt(coord_x) ; index_col < parseInt(coord_x) + parseInt(size.x) ; index_col++){
                let element = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                let element_div = element.querySelector('div');
                let element_div_span = document.createElement('span');
                
                element.removeAttribute("size_x");
                element.removeAttribute("size_y");
                element_div.replaceChildren();
    
                element_div_span.className = "absolute hover:box-border hover:border-2 hover:border hover:border-solid inline-block border-white w-[32px] h-[32px] pathfinding-zone cursor-pointer";
                element_div_span.setAttribute('title', `${map_informations["sector"]["name"]} [y = ${parseInt(index_row)}; x = ${parseInt(index_col)}]`);
                element_div_span.setAttribute(attribute_touch_mouseover, 'get_pathfinding(this)');
                element_div_span.setAttribute(attribute_touch_click, 'display_pathfinding()');
                
                element_div.append(element_div_span);
            }
        }
    }
    
    document.querySelector('#modal-pc_' + player_id)?.remove();
    document.querySelector('#modal-unknown-pc_' + player_id)?.remove();
}