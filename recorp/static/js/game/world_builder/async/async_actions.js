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
    let target_user_id = data["user_id"];

    if (current_user_id != target_user_id) {
        let target_player_id = data["player_id"];
        let start_pos_array = data["start_id_array"];
        let end_pos_array = data["destination_id_array"];
        let movement_remaining = parseInt(data["movement_remaining"]);
        console.log(target_player_id)
        console.log(movement_remaining)
        let max_movement = parseInt(data["max_movement"]);
        for (let i = 0; i < start_pos_array.length; i++) {

            let entry_point = document.getElementById(start_pos_array[i]);
            let temp_point = document.getElementById(end_pos_array[i]).innerHTML;
            let end_point = document.getElementById(end_pos_array[i]);

            let get_start_coord = start_pos_array[i].split('_');

            end_point.innerHTML = entry_point.innerHTML;
            entry_point.innerHTML = temp_point;

            entry_point.querySelector('.pathfinding-zone').title = `${map_informations["sector"]["name"]} [y: ${get_start_coord[0]} ; x: ${get_start_coord[1]}]`;
            end_point.classList.add('pc', 'uncrossable');
            entry_point.classList.remove('pc', 'uncrossable');
            end_point.setAttribute('onclick', 'open_close_modal( ' + `modal-pc_${target_player_id}` + ')');

        }

        let movement_remaining_div = document.getElementById(`modal-pc_${target_player_id}`);
        let movement_progress_bar_size = movement_remaining_div.getElementsByTagName('div');
        let movement_progress_bar_text = movement_remaining_div.getElementsByTagName('span');
        console.log(`${Math.round((movement_remaining * 100) / (max_movement))}%`)
        movement_progress_bar_size.style.width = `${Math.round((movement_remaining * 100) / (max_movement))}%`;
        movement_progress_bar_text.textContent = `${movement_remaining} / ${max_movement}`;

    }else{
        update_player_pos_display_after_move(data)
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

function update_player_pos_display_after_move(data){

    let current_player_ship = document.querySelectorAll('.ship-pos');
    let coord_x = parseInt(data.player.user.coordinates.coord_x) + 1;
    let coord_y = parseInt(data.player.user.coordinates.coord_y) + 1;
    let ship_size_y = data.player.ship.size.size_y;
    let ship_size_x = data.player.ship.size.size_x;
    let is_reversed = data.player.ship.is_reversed;
    let coordinates_array_to_disable_button = [];   


    for(let i = 0; i < current_player_ship.length; i++){
        current_player_ship[i].removeAttribute("onclick");
        current_player_ship[i].removeAttribute("size_x");
        current_player_ship[i].removeAttribute("size_y");
        current_player_ship[i].querySelector('.ship').remove();
        current_player_ship[i].querySelector('.ship-reversed').remove();
        current_player_ship[i].querySelector('span').remove();

        let old_pos_id_split = current_player_ship[i].id.split('_')

        let span_container = current_player_ship[i].querySelector('div');
        let span = document.createElement('span');
        span.className = "absolute hover:box-border hover:border-2 hover:border block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer";
        span.title = `${data.sector.name} [y: ${old_pos_id_split[0]} ; x: ${old_pos_id_split[1]}]`;
        span_container.append(span);

        current_player_ship[i].className = "relative w-[32px] h-[32px] m-0 p-0 tile";
    }

    hide_sector_overflow(data.player.user.coordinates.coord_x, data.player.user.coordinates.coord_y);
    if (!user_is_on_mobile_device()) {
        set_pathfinding_event();
    }

    for (let row_i = 0; row_i < (atlas.tilesize * ship_size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * ship_size_x); col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
            let entry_point_border = entry_point.querySelector('span');
            let div = entry_point.querySelector('div');
            let bg_url = "/static/js/game/assets/ships/" + data.player.ship.image + '.png';
            let bg_url_reversed_img = "/static/js/game/assets/ships/" + data.player.ship.image + '-reversed.png';
            let space_ship = document.createElement('div');
            let space_ship_reversed = document.createElement('div');

            entry_point.classList.add('uncrossable');
            entry_point.setAttribute('size_x', ship_size_x);
            entry_point.setAttribute('size_y', ship_size_y);
            entry_point_border.classList.add('border-dashed', 'cursor-pointer');
            entry_point_border.setAttribute('title', `${data.player.user.name}`);
            entry_point_border.setAttribute('data-modal-target', `modal-pc_${data.player.user.player}`);
            entry_point_border.setAttribute('data-modal-toggle', `modal-pc_${data.player.user.player}`);
            
            if (!user_is_on_mobile_device()) {
                entry_point_border.setAttribute('onclick', "open_close_modal('" + `modal-pc_${data.player.user.player}` + "')");
                entry_point_border.removeAttribute('onmouseover', 'get_pathfinding(this)');
            } else {
                entry_point_border.setAttribute('ontouchstart', "open_close_modal('" + `modal-pc_${data.player.user.player}` + "')");
            }

            space_ship.style.backgroundImage = "url('" + bg_url + "')";
            space_ship.classList.add('ship');
            space_ship.style.backgroundPositionX = `-${col_i}px`;
            space_ship.style.backgroundPositionY = `-${row_i}px`;

            space_ship_reversed.style.backgroundImage = "url('" + bg_url_reversed_img + "')";
            space_ship_reversed.classList.add('ship-reversed');
            space_ship_reversed.style.backgroundPositionX = `-${col_i}px`;
            space_ship_reversed.style.backgroundPositionY = `-${row_i}px`;

            update_user_coord_display(data.player.user.coordinates.coord_x, data.player.user.coordinates.coord_y);
            border_color = "border-green-300";
            entry_point.classList.add("ship-pos");
            if (!user_is_on_mobile_device()) {
                entry_point.setAttribute('onclick', 'reverse_player_ship_display()');
            } else {
                entry_point.setAttribute('ontouchstart', 'reverse_player_ship_display()');
                coordinates_array_to_disable_button.push(`${coord_y}_${coord_x}`)
            }
            /* Check ship_size and set ship-start-pos in the middle */
            if (ship_size_y == 1 && ship_size_x == 1 || ship_size_y == 1 && ship_size_x == 2) {
                if (col_i == 0) {
                    entry_point.classList.add("player-ship-start-pos", "border-dashed");
                }
            } else if (ship_size_y == 1 && ship_size_x == 3) {
                if (col_i == 32) {
                    entry_point.classList.add("player-ship-start-pos", "border-dashed");
                }
            } else if (ship_size_y == 3 && ship_size_x == 3) {
                if (row_i == 32 && col_i == 32) {
                    entry_point.classList.add("player-ship-start-pos", "border-dashed");
                }
            }
            space_ship.classList.add("player-ship");
            space_ship_reversed.classList.add("player-ship-reversed");
            if (user_is_on_mobile_device()) {
                if (data.player.ship.current_movement <= 0) {
                    disable_button(["top", "bottom", "right", "left", "center"])
                }
            }
            current_player.set_remaining_move_points(data.player.ship.current_movement);

            entry_point_border.classList.add(border_color);
            space_ship.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
            space_ship_reversed.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
            if (is_reversed) {
                space_ship.style.display = "none";
                space_ship_reversed.style.display = "block";
            } else {
                space_ship.style.display = "block";
                space_ship_reversed.style.display = "none";
            }

            div.append(space_ship);
            div.append(space_ship_reversed);

            coord_x++;
        }
        coord_y++;
        coord_x = parseInt(data.player.user.coordinates.coord_x) + 1
        
        let remaining_movement = document.querySelector('#remaining-movement-div');
        let remaining_movement_div = remaining_movement.querySelector('div');
        let remaining_movement_span = remaining_movement.querySelector('span');
        remaining_movement_div.style.width = `${Math.round((data.player.ship.current_movement * 100) / (data.player.ship.max_movement))}%`;
        remaining_movement_span.textContent = `${data.player.ship.current_movement} / ${data.player.ship.max_movement}`;

    }
    if (user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinates_array_to_disable_button));
    }
}