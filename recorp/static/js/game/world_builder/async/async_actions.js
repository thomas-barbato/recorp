// ASYNC GAME LOGIC

function async_move(pos) {
    cleanCss();
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "player": pos.player,
            "end_x": pos.end_x,
            "end_y": pos.end_y,
            "is_reversed": pos.is_reversed,
            "start_id_array": pos.start_id_array,
            "move_cost": pos.move_cost,
            "destination_id_array": pos.destination_id_array,
        }),
        type: "async_move"
    }));
}

function update_player_coord(data) {
    clear_path();
    let player_name = data["player"];
    let target_user_id = data["user_id"];
    let target_player_id = data["player_id"];
    let start_pos_array = data["start_id_array"];
    let end_pos_array = data["destination_id_array"];
    let movement_remaining = parseInt(data["movement_remaining"]);
    let max_movement = parseInt(data["max_movement"]);

    for (let i = 0; i < start_pos_array.length; i++) {

        if (current_user_id != target_user_id) {
            let entry_point = document.getElementById(start_pos_array[i]);
            let temp_point = document.getElementById(end_pos_array[i]).innerHTML;
            let end_point = document.getElementById(end_pos_array[i]);

            let get_start_coord = start_pos_array[i].split('_');

            end_point.innerHTML = entry_point.innerHTML;
            entry_point.innerHTML = temp_point;

            entry_point.querySelector('.pathfinding-zone').title = `${map_informations["sector"]["name"]} [y: ${get_start_coord[0]} ; x: ${get_start_coord[1]}]`;
            end_point.classList.add('pc', 'uncrossable');
            entry_point.classList.remove('pc', 'uncrossable');
            end_point.setAttribute('onclick', 'open_close_modal( ' + `modal-pc_${target_user_id}` + ')');

            let movement_remaining_div = document.getElementById(`movement-container-${target_player_id}`);
            let movement_progress_bar_size = movement_remaining_div.querySelector('div');
            let movement_progress_bar_text = movement_remaining_div.querySelector('span');

            movement_progress_bar_size.style.width = `${Math.round((movement_remaining * 100) / (max_movement))}%`;
            movement_progress_bar_text.textContent = `${movement_remaining} / ${max_movement}`;

        } else {
            window.location.reload();
        }
    }
}

function update_player_coord_in_cache_array(player_name, coord) {
    for (let i = 0; i < map_informations.pc.length; i++) {
        if (map_informations.pc[i].user.name == player_name) {
            map_informations.pc[i].user.coordinates = coord
        }
    }
}

function async_reverse_ship(data) {
    clear_path();
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "user": data.user,
            "id_array": data.id_array,
        }),
        type: "async_reverse_ship"
    }));
}

function reverse_ship(data) {
    let id_list = data["id_array"];
    update_reverse_ship_in_cache_array(data["player_id"], data["is_reversed"]);

    for (let i = 0; i < id_list.length; i++) {
        let element = document.getElementById(id_list[i]);
        let element_ship = element.querySelector('.ship');
        let element_ship_reversed = element.querySelector('.ship-reversed');

        if (data["is_reversed"] == true) {
            element_ship.style.display = "none";
            element_ship_reversed.style.display = "block";
        } else {
            element_ship.style.display = "block";
            element_ship_reversed.style.display = "none";
        }
    }
}

function update_reverse_ship_in_cache_array(player_id, status) {
    for (let i = 0; i < map_informations.pc.length; i++) {
        if (map_informations.pc[i].user.player == player_id) {
            map_informations.pc[i].ship.is_reversed = status;
        }
    }
}
