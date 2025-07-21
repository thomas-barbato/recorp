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
    
    let size = {
        "y" : parseInt(data.size.y),
        "x" : parseInt(data.size.x),
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
            /*
            end_point.addEventListener(attribute_touch_click, function(){
                open_close(`modal-pc_${target_player_id}`);
            })*/
            let end_point_border = end_point.querySelector('span');
            end_point_border.addEventListener("mouseover", function(){
                generate_border(size["y"], size["x"], parseInt(data.end_y + 1), parseInt(data.end_x + 1));
            });
            end_point_border.addEventListener("mouseout", function(){
                remove_border(size["y"], size["x"], parseInt(data.end_y + 1), parseInt(data.end_x + 1), 'border-cyan-400');
            });

        }

        let modal_div = document.getElementById(`modal-pc_${target_player_id}`);
        let detailed_movement_remaining_div = modal_div.querySelector('#movement-container-detailed');
        let detailed_movement_progress_bar_size = detailed_movement_remaining_div.querySelector('div');
        let detailed_movement_progress_bar_text = detailed_movement_remaining_div.querySelector('span');

        detailed_movement_progress_bar_size.style.width = `${Math.round((movement_remaining * 100) / (max_movement))}%`;
        detailed_movement_progress_bar_text.textContent = `${movement_remaining} / ${max_movement}`;

        let movement_value = color_per_percent(movement_remaining, max_movement);
        let movement_remaining_div = modal_div.querySelector('#movement-container');
        let movement_remaining_div_text = movement_remaining_div.querySelector('p');

        movement_remaining_div_text.className = `text-xs ${movement_value.color} font-shadow`;
        movement_remaining_div_text.textContent = movement_value.status;
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
            element_ship.classList.add('hidden');
            element_ship_reversed.classList.remove('hidden');
        } else {
            element_ship.classList.remove('hidden');
            element_ship_reversed.classList.add('hidden');
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
    let coord_x = parseInt(data.player.user.coordinates.x) + 1;
    let coord_y = parseInt(data.player.user.coordinates.y) + 1;
    let ship_size_y = data.player.ship.size.y;
    let ship_size_x = data.player.ship.size.x;
    let is_reversed = data.player.ship.is_reversed;
    let coordinates_array_to_disable_button = [];
    let current_player_ship_tooltip = "";

    for(let i = 0; i < current_player_ship.length; i++){
        current_player_ship[i].removeAttribute("onclick");
        current_player_ship[i].removeAttribute("size_x");
        current_player_ship[i].removeAttribute("size_y");
        current_player_ship[i].removeAttribute('type');
        current_player_ship[i].removeEventListener('mouseover', displayObservableZone);
        current_player_ship[i].removeEventListener('mouseout', HideObservableZone);
        current_player_ship[i].classList.remove('uncrossable', 'ship-pos', 'player-ship-start-pos', 'border-dashed');
        current_player_ship[i].querySelector('.player-ship').remove();
        current_player_ship[i].querySelector('.player-ship-reversed').remove();

        current_player_ship[i].querySelector('span').remove();
        
        let current_player_ship_background = current_player_ship[i].querySelector('div');
        current_player_ship_background.className = "relative w-[32px] h-[32px] coord-zone-div";
        
        if(current_player_ship[i].querySelector('ul')){
            current_player_ship_tooltip = current_player_ship[i].querySelector('ul');
            current_player_ship[i].querySelector('ul').remove();
        }

        let old_pos_id_split = current_player_ship[i].id.split('_')

        let div_container = current_player_ship[i].querySelector('div');
        let span = document.createElement('span');
        span.className = "absolute hover:box-border block z-10 w-[32px] h-[32px] pathfinding-zone cursor-crosshair z-1 foreground-element";
        span.title = `${data.sector.name} [y: ${old_pos_id_split[0]} ; x: ${old_pos_id_split[1]}]`;
        div_container.append(span);

        current_player_ship[i].className = "relative w-[32px] h-[32px] m-0 p-0 tile";
    }

    hide_sector_overflow(data.player.user.coordinates.x, data.player.user.coordinates.y);
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

            let entry_point_div = entry_point.querySelector('div');
            let ship_url = "/static/img/foreground/SHIPS/" + data.player.ship.image + '.png';
            let ship_url_reversed_img = "/static/img/foreground/SHIPS/" + data.player.ship.image + '-reversed.png';
            let space_ship = document.createElement('div');
            let space_ship_reversed = document.createElement('div');

            entry_point.classList.add('uncrossable','bg-orange-400/30');
            entry_point.setAttribute('size_x', ship_size_x);
            entry_point.setAttribute('size_y', ship_size_y);
            entry_point_border.classList.add('border-dashed', 'cursor-pointer');
            entry_point_border.setAttribute('title', `${data.player.user.name}`);
            entry_point_border.setAttribute('data-modal-target', `modal-pc_${data.player.user.player}`);
            
            observable_zone = getObservableZone(data.player.ship.visible_zone);

            entry_point.addEventListener('mouseover', displayObservableZone);
            entry_point.addEventListener('mouseout', HideObservableZone);

            entry_point_div.classList.add();

            entry_point_border.removeAttribute(attribute_touch_mouseover, 'get_pathfinding(this)');
            entry_point_border.removeEventListener(attribute_touch_click, display_pathfinding);

            space_ship.style.backgroundImage = "url('" + ship_url + "')";
            space_ship.classList.add('ship', 'z-1', 'absolute');
            space_ship.style.backgroundPositionX = `-${col_i}px`;
            space_ship.style.backgroundPositionY = `-${row_i}px`;
            
            space_ship_reversed.style.backgroundImage = "url('" + ship_url_reversed_img + "')";
            space_ship_reversed.classList.add('ship-reversed', 'z-1', 'absolute');
            space_ship_reversed.style.backgroundPositionX = `-${col_i}px`;
            space_ship_reversed.style.backgroundPositionY = `-${row_i}px`;

            update_user_coord_display(data.player.user.coordinates.x, data.player.user.coordinates.y);
            border_color = "border-orange-400";
            entry_point.classList.add("ship-pos");

            if (!is_user_is_on_mobile_device()) {

                entry_point.setAttribute('onclick', 'reverse_player_ship_display()');
                entry_point_border.addEventListener("mouseover", function(){
                    generate_border(ship_size_y, ship_size_x, parseInt(data.player.user.coordinates.y) + 1, parseInt(data.player.user.coordinates.x) + 1);
                });
                entry_point_border.addEventListener("mouseout", function(){
                    remove_border(ship_size_y, ship_size_x, parseInt(data.player.user.coordinates.y) + 1, parseInt(data.player.user.coordinates.x) + 1, border_color);
                });

            } else {
                entry_point.setAttribute('ontouchstart', 'reverse_player_ship_display()');
                coordinates_array_to_disable_button.push(`${coord_y}_${coord_x}`)
            }
            /* Check size and set ship-start-pos in the middle */
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
                space_ship.classList.add('hidden');
                space_ship_reversed.classList.remove('hidden');
            } else {
                space_ship.classList.remove('hidden');
                space_ship_reversed.classList.add('hidden');
            }

            entry_point_div.append(space_ship);
            entry_point_div.append(space_ship_reversed);

            coord_x++;
        }

        coord_y++;
        coord_x = parseInt(data.player.user.coordinates.x) + 1
        document.querySelector('#movement-percent').style.width = `${Math.round((data.player.ship.current_movement * 100) / (data.player.ship.max_movement))}%`;
        document.querySelector('#movement-container-value-max').textContent = `${data.player.ship.max_movement}`;
        
        let current_movement_value = document.querySelectorAll('#movement-container-value-current');
        current_movement_value.forEach(element => {
            element.textContent = `${data.player.ship.current_movement}`;
        });
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

            movement_li_icon.src = '/static/img/ux/movement-icon.svg';
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
    return data['is_in_range'];
}

function update_player_range_in_modal(data){
    let modal = "";
    for(const node_type in data){
        for(const node in data[node_type]){
            if(node_type == "pc" || node_type == "npc"){
                modal = document.getElementById(`modal-${node_type}_${data[node_type][node].target_id}`);
            }else{
                modal = document.getElementById(`modal-${data[node_type][node].name}`);
            }
            if(modal){
                let module_element = modal.querySelector(`#module-${data[node_type][node].module_id}`);
                if(module_element){
                    if(module_element.querySelector('#range-finder-warning-msg')){
                        if(data[node_type][node].is_in_range){
                            module_element.querySelector('#range-finder-warning-msg').classList.add('hidden');
                        }else{
                            module_element.querySelector('#range-finder-warning-msg').classList.remove('hidden');
                        }
                    }
                }
            }
        }
    }
}

function async_travel(id, user_id, warpzone_name){
    let spaceship = document.querySelector('.player-ship-start-pos');
    let coordinates = spaceship.getAttribute('id').split('_')
    let size_x = spaceship.getAttribute('size_x');
    let size_y = spaceship.getAttribute('size_y');
    let data = {
        "user": user_id,
        "source_id": id,
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

    let url = "warp"

    const headers = new Headers({
    'Content-Type': 'x-www-form-urlencoded',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRFToken': csrf_token
    });

    fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
            data
        })
    }).then(() => {
        gameSocket.send(JSON.stringify({
            message: JSON.stringify({
                data
            }),
            type: "async_warp_travel"
        }));
        window.location.reload();

    });
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

    var modal = document.querySelector('#modal-pc_' + player_id);
    if(modal){
        modal.parentNode.removeChild(modal);
    }
}