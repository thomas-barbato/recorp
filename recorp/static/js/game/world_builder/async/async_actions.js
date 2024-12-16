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

    console.log(data)
    
    let ship_size = {
        "y" : parseInt(data["ship_size"]["size_y"]),
        "x" : parseInt(data["ship_size"]["size_x"]),
    }
    let target_user_id = data["user_id"];

    if (current_user_id != target_user_id) {
        
        let target_player_id = data["player_id"];
        let start_pos_array = data["start_id_array"];
        let end_pos_array = data["destination_id_array"];
        let movement_remaining = parseInt(data["movement_remaining"]);
        let max_movement = parseInt(data["max_movement"]);

        for (let i = 0; i < start_pos_array.length; i++) {

            let entry_point = document.getElementById(start_pos_array[i]);
            let temp_point = document.getElementById(end_pos_array[i]).innerHTML;
            let end_point = document.getElementById(end_pos_array[i]);
            let get_start_coord = start_pos_array[i].split('_');

            end_point.innerHTML = entry_point.innerHTML;
            entry_point.innerHTML = temp_point;

            entry_point.querySelector('.pathfinding-zone').title = `${map_informations["sector"]["name"]} [y: ${get_start_coord[0]} ; x: ${get_start_coord[1]}]`;
            entry_point.classList.remove('pc', 'uncrossable');
            end_point.classList.add('pc', 'uncrossable');
            end_point.addEventListener(action_listener_touch_click, function(){
                open_close(`modal-pc_${target_player_id}`);
            })
            let end_point_border = end_point.querySelector('span');
            end_point_border.addEventListener("mouseover", function(){
                generate_border(ship_size["y"], ship_size["x"], parseInt(data.end_y + 1), parseInt(data.end_x + 1));
            });
            end_point_border.addEventListener("mouseout", function(){
                remove_border(ship_size["y"], ship_size["x"], parseInt(data.end_y + 1), parseInt(data.end_x + 1), 'border-cyan-400');
            });

        }

        let modal_div = document.getElementById(`modal-pc_${target_player_id}`);
        let movement_remaining_div = modal_div.querySelector('#movement-container');
        let movement_progress_bar_size = movement_remaining_div.querySelector('div');
        let movement_progress_bar_text = movement_remaining_div.querySelector('span');

        movement_progress_bar_size.style.width = `${Math.round((movement_remaining * 100) / (max_movement))}%`;
        movement_progress_bar_text.textContent = `${movement_remaining} / ${max_movement}`;
        update_player_range_in_modal(data.modules_range);

    }else{
        update_player_pos_display_after_move(data);
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
    console.log(data)
    let current_player_ship = document.querySelectorAll('.ship-pos');
    let coord_x = parseInt(data.player.user.coordinates.coord_x) + 1;
    let coord_y = parseInt(data.player.user.coordinates.coord_y) + 1;
    let ship_size_y = data.player.ship.size.size_y;
    let ship_size_x = data.player.ship.size.size_x;
    let is_reversed = data.player.ship.is_reversed;
    let coordinates_array_to_disable_button = [];
    let current_player_ship_tooltip = "";

    for(let i = 0; i < current_player_ship.length; i++){
        current_player_ship[i].removeAttribute("onclick");
        current_player_ship[i].removeAttribute("size_x");
        current_player_ship[i].removeAttribute("size_y");
        current_player_ship[i].querySelector('.ship').remove();
        current_player_ship[i].querySelector('.ship-reversed').remove();
        current_player_ship[i].querySelector('span').remove();
        
        if(current_player_ship[i].querySelector('ul')){
            current_player_ship_tooltip = current_player_ship[i].querySelector('ul');
            current_player_ship[i].querySelector('ul').remove();
        }

        let old_pos_id_split = current_player_ship[i].id.split('_')

        let span_container = current_player_ship[i].querySelector('div');
        let span = document.createElement('span');
        span.className = "absolute hover:box-border block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer";
        span.title = `${data.sector.name} [y: ${old_pos_id_split[0]} ; x: ${old_pos_id_split[1]}]`;
        span_container.append(span);

        current_player_ship[i].className = "relative w-[32px] h-[32px] m-0 p-0 tile";
    }

    hide_sector_overflow(data.player.user.coordinates.coord_x, data.player.user.coordinates.coord_y);
    if (!is_user_is_on_mobile_device()) {
        set_pathfinding_event();
    }

    for (let row_i = 0; row_i < (atlas.tilesize * ship_size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * ship_size_x); col_i += atlas.tilesize) {
            
            let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
            let entry_point_border = entry_point.querySelector('span');

            if(row_i == ((atlas.tilesize * ship_size_y) - atlas.tilesize) && col_i == 0){
                if(current_player_ship_tooltip.querySelector('li#movement-information-display')){
                    current_player_ship_tooltip.querySelector('li#movement-information-display').remove();
                }
                entry_point.append(current_player_ship_tooltip);
            }

            let div = entry_point.querySelector('div');
            let ship_url = "/static/js/game/assets/ships/" + data.player.ship.image + '.png';
            let ship_url_reversed_img = "/static/js/game/assets/ships/" + data.player.ship.image + '-reversed.png';
            let space_ship = document.createElement('div');
            let space_ship_reversed = document.createElement('div');

            entry_point.classList.add('uncrossable');
            entry_point.setAttribute('size_x', ship_size_x);
            entry_point.setAttribute('size_y', ship_size_y);
            entry_point_border.classList.add('border-dashed', 'cursor-pointer');
            entry_point_border.setAttribute('title', `${data.player.user.name}`);
            entry_point_border.setAttribute('data-modal-target', `modal-pc_${data.player.user.player}`);

            entry_point_border.removeAttribute(action_listener_touch_mouseover, 'get_pathfinding(this)');
            entry_point_border.removeAttribute(action_listener_touch_click, 'display_pathfinding()');

            space_ship.style.backgroundImage = "url('" + ship_url + "')";
            space_ship.classList.add('ship');
            space_ship.style.backgroundPositionX = `-${col_i}px`;
            space_ship.style.backgroundPositionY = `-${row_i}px`;
            
            space_ship_reversed.style.backgroundImage = "url('" + ship_url_reversed_img + "')";
            space_ship_reversed.classList.add('ship-reversed');
            space_ship_reversed.style.backgroundPositionX = `-${col_i}px`;
            space_ship_reversed.style.backgroundPositionY = `-${row_i}px`;

            update_user_coord_display(data.player.user.coordinates.coord_x, data.player.user.coordinates.coord_y);
            border_color = "border-green-300";
            entry_point.classList.add("ship-pos");

            if (!is_user_is_on_mobile_device()) {

                entry_point.setAttribute('onclick', 'reverse_player_ship_display()');
                entry_point_border.addEventListener("mouseover", function(){
                    generate_border(ship_size_y, ship_size_x, parseInt(data.player.user.coordinates.coord_y) + 1, parseInt(data.player.user.coordinates.coord_x) + 1);
                });
                entry_point_border.addEventListener("mouseout", function(){
                    remove_border(ship_size_y, ship_size_x, parseInt(data.player.user.coordinates.coord_y) + 1, parseInt(data.player.user.coordinates.coord_x) + 1, border_color);
                });

            } else {
                entry_point.setAttribute('ontouchstart', 'reverse_player_ship_display()');
                coordinates_array_to_disable_button.push(`${coord_y}_${coord_x}`)
            }
            /* Check ship_size and set ship-start-pos in the middle */
            if (ship_size_y == 1 && ship_size_x == 1 || ship_size_y == 1 && ship_size_x == 2) {
                if (col_i == 0) {
                    entry_point.classList.add("player-ship-start-pos");
                }
            } else if (ship_size_y == 1 && ship_size_x == 3) {
                if (col_i == 32) {
                    entry_point.classList.add("player-ship-start-pos");
                }
            } else if (ship_size_y == 3 && ship_size_x == 3) {
                if (row_i == 32 && col_i == 32) {
                    entry_point.classList.add("player-ship-start-pos");
                }
            }
            space_ship.classList.add("player-ship");
            space_ship_reversed.classList.add("player-ship-reversed");
            if (is_user_is_on_mobile_device()) {
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

    occured_event_display_on_map("movement", false, data.player.user.player, value=data.move_cost)
    update_player_range_in_modal(data.modules_range);

    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinates_array_to_disable_button));
    }
}

function occured_event_display_on_map(event_type, is_using_timer, user_id, value=0){ 
    
    if(event_type == "movement"){
        
        let element = document.querySelector(`#tooltip-pc_${user_id}`);
        if(element){
            let movement_li = document.createElement('li');
            let movement_li_icon = document.createElement('img');
            let movement_li_value = document.createElement('span');

            movement_li.classList.add('flex', 'flex-row', 'gap-1');
            movement_li.id = "movement-information-display";

            movement_li_icon.src = '/static/js/game/assets/ux/movement-icon.svg';
            movement_li_icon.classList.add(
                'lg:w-[2vw]',
                'lg:h-[2vh]',
                'w-[4vw]',
                'h-[4vh]'
            )
            
            movement_li_value.classList.add('text-teal-300', 'p-1', 'w-full', 'font-shadow')
            movement_li_value.textContent = `-${value}`;

            movement_li.append(movement_li_value);
            movement_li.append(movement_li_icon);

            element.append(movement_li);
            fade_effect(element.querySelector("#movement-information-display"), 100)
        }
    }
}


function set_range_finding(data) {
    return data['is_in_range'] == true ? true : false;
}

function update_player_range_in_modal(data){
    
    let pc_npc_nodeList = document.querySelectorAll(["div[id*='-pc_']", "div[id*='-npc_']"]);
    for(node in pc_npc_nodeList){
        if(pc_npc_nodeList[node].id){
            
            let modal_split = pc_npc_nodeList[node].id.split('-')
            let splitted_id = modal_split[1].split('_');
            let node_type = splitted_id[0];
            let node_id = splitted_id[1];
            
            let element = document.querySelector(`#${pc_npc_nodeList[node].id}`);

            for(module in data[node_type][node_id]){
                let module_element = element.querySelector(`#module-${data[node_type][node_id][module].module_id}`);
                let is_in_range = set_range_finding(data[node_type][node_id][module]);
                if(is_in_range){
                    module_element.querySelector('#range-finder-warning-msg').classList.add('hidden');
                }else{
                    module_element.querySelector('#range-finder-warning-msg').classList.remove('hidden');
                }
            }
        }
    }
}