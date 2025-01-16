function add_background(data) {
    let index_row = 1;
    let index_col = 1;
    let bg_url = '/static/img/atlas/background/' + data + '/' + '0.gif';
    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            let entry_point_border = entry_point.querySelector('div>span');

            entry_point.style.backgroundImage = "url('" + bg_url + "')";
            entry_point.style.backgroundPositionX = `-${col_i}px`;
            entry_point.style.backgroundPositionY = `-${row_i}px`;
            entry_point_border.classList.add('pathfinding-zone', 'cursor-pointer');
            entry_point_border.setAttribute('title', `${map_informations["sector"]["name"]} [x = ${parseInt(index_col - 1)}; y = ${parseInt(index_row - 1)}]`);
            entry_point.addEventListener(attribute_touch_touch_mouseover, function(){
                update_target_coord_display(entry_point);
            })

            index_col++;
        }
        index_row++;
        index_col = 1;
    }
    for (let i = 0; i < map_informations.pc.length; i++) {
        let player = map_informations.pc[i];
        if (player.user.user == current_user_id) {
            hide_sector_overflow(player.user.coordinates.coord_x, player.user.coordinates.coord_y);
            if (!is_user_is_on_mobile_device()) {
                set_pathfinding_event();
            }
            document.querySelector('#player-container').classList.remove('hidden')
            break;
        }
    }
}

function add_foreground(data){
    for (let sector_i = 0; sector_i < data.length; sector_i++) {
        element_type = data[sector_i]["animations"][0];
        element_type_translated = data[sector_i]["type_translated"];
        element_data = data[sector_i]["data"];
        folder_name = data[sector_i]["animations"][1];
        modal_data = {
            type: data[sector_i].data.type,
            translated_type: data[sector_i].data.type_translated,
            animation: {
                dir: data[sector_i]["animations"][0],
                img: data[sector_i]["animations"][1],
            },
            name: data[sector_i].data.name,
            description: data[sector_i].data.description,
            resources: {
                id: data[sector_i].resource.id,
                name: data[sector_i].resource.name,
                quantity_str: data[sector_i].resource.quantity_str,
                quantity: data[sector_i].resource.quantity,
                translated_text_resource: data[sector_i].resource.translated_text_resource,
                translated_quantity_str: data[sector_i].resource.translated_quantity_str,
                translated_scan_msg_str: data[sector_i].resource.translated_scan_msg_str,
            },
            faction: {
                starter: map_informations.sector.faction.is_faction_level_starter,
                name: map_informations.sector.faction.name,
                translated_str: map_informations.sector.faction.translated_text_faction_level_starter,
            },
            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg,
                player_in_same_faction: map_informations.actions.player_is_same_faction,
            },
            coord: {
                x: data[sector_i].data.coord_x,
                y: data[sector_i].data.coord_y
            }
        }
        let modal = create_foreground_modal(
            element_data["name"],
            modal_data
        );

        document.querySelector('#modal-container').append(modal);
        let index_row = data[sector_i]['data']['coord_y'];
        let index_col = data[sector_i]['data']['coord_x'];
        let size_x = data[sector_i]['size']["size_x"];
        let size_y = data[sector_i]['size']["size_y"];
        let bg_url = '/static/img/atlas/foreground/' + element_type + '/' + folder_name + '/' + '0.gif';

        for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {

                let entry_point = document.querySelector('.tabletop-view').rows[parseInt(index_row)].cells[parseInt(index_col)];
                let entry_point_div = entry_point.querySelector('div');
                let entry_point_border = entry_point_div.querySelector('span');
                let img_div = document.createElement('div');

                entry_point.classList.add('uncrossable');
                entry_point.setAttribute('size_x', size_x);
                entry_point.setAttribute('size_y', size_y);
                entry_point_border.className = "absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer border-amber-500";
                entry_point_border.setAttribute('title', `${element_data["name"]} [x: ${parseInt(index_col)}; y: ${parseInt(index_row)}]`);
                entry_point_border.setAttribute('data-modal-target', "modal-" + element_data["name"]);
                entry_point_border.setAttribute(attribute_touch_click, "open_close_modal('" + "modal-" + element_data["name"] + "')");
                entry_point_border.addEventListener("mouseover", function(){
                    generate_border(size_y, size_x, parseInt(data[sector_i]['data']['coord_y']), parseInt(data[sector_i]['data']['coord_x']));
                });
                entry_point_border.addEventListener("mouseout", function(){
                    remove_border(size_y, size_x, parseInt(data[sector_i]['data']['coord_y']), parseInt(data[sector_i]['data']['coord_x']), 'border-amber-500');
                });

                img_div.classList.add(
                    'relative',
                    'left-0',
                    'right-0',
                    'm-0',
                    'p-0',
                    'w-[32px]',
                    'h-[32px]',
                    'z-1'
                );
                img_div.setAttribute('title', `${element_data["name"]} [y: ${parseInt(index_row) - 1}; x: ${parseInt(index_col) - 1}]`);
                img_div.style.backgroundImage = "url('" + bg_url + "')";
                img_div.style.backgroundPositionX = `-${col_i}px`;
                img_div.style.backgroundPositionY = `-${row_i}px`;
                entry_point_div.append(img_div);
                index_col++;
            }
            index_row++;
            index_col = data[sector_i]['data']['coord_x'];
        }
    }
}

function add_npc(data){
    let coordinates_array_to_disable_button = [];
    for (let i = 0; i < data.length; i++) {
        let coord_x = parseInt(data[i]["npc"]["coordinates"].x) + 1;
        let coord_y = parseInt(data[i]["npc"]["coordinates"].y) + 1;
        let ship_size_x = data[i]["ship"]['size'].size_x;
        let ship_size_y = data[i]["ship"]['size'].size_y;
        modal_data = {
            player: {
                name: data[i].npc.name,
                image: data[i].npc.image,
                faction_name: data[i].faction.name
            },
            ship: {
                name: data[i].ship.name,
                category: data[i].ship.category_name,
                description: data[i].ship.category_description,
                max_hp: data[i].ship.max_hp,
                current_hp: data[i].ship.current_hp,
                current_thermal_defense: data[i].ship.current_thermal_defense,
                current_missile_defense: data[i].ship.current_missile_defense,
                current_ballistic_defense: data[i].ship.current_ballistic_defense,
                max_movement: data[i].ship.max_movement,
                current_movement: data[i].ship.current_movement,
                status: data[i].ship.status,
                modules: data[i].ship.modules,
                modules_range: data[i].ship.modules_range,
            },
            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg,
                player_in_same_faction: map_informations.actions.player_is_same_faction,
                translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
                translated_statistics_str: map_informations.actions.translated_statistics_msg_str,
            },
        }
        let modal = create_pc_npc_modal(`npc_${data[i].npc.id}`, modal_data, `${coord_y-1}_${coord_x-1}`, ship_size_y, ship_size_x, true);
        document.querySelector('#modal-container').append(modal);

        for (let row_i = 0; row_i < (atlas.tilesize * ship_size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * ship_size_x); col_i += atlas.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
                let entry_point_border = entry_point.querySelector('span');
                let div = entry_point.querySelector('div');
                let bg_url = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '.png';
                let space_ship = document.createElement('div');
                let space_ship_reversed = document.createElement('div');

                entry_point.classList.add("npc", "uncrossable");
                entry_point.setAttribute('size_x', ship_size_x);
                entry_point.setAttribute('size_y', ship_size_y);
                entry_point_border.setAttribute('title', `${data[i]["npc"]["name"]}`);
                entry_point_border.setAttribute('data-modal-target', `modal-npc_${data[i].npc.id}`);
                entry_point_border.setAttribute(attribute_touch_click, "open_close_modal('" + `modal-npc_${data[i].npc.id}` + "')");
                entry_point_border.removeAttribute('onmouseover', 'get_pathfinding(this)');
                entry_point_border.addEventListener("mouseover", function(){
                    generate_border(ship_size_y, ship_size_x, parseInt(data[i]["npc"]["coordinates"].y) + 1, parseInt(data[i]["npc"]["coordinates"].x) + 1);
                });
                entry_point_border.addEventListener("mouseout", function(){
                    remove_border(ship_size_y, ship_size_x, parseInt(data[i]["npc"]["coordinates"].y) + 1, parseInt(data[i]["npc"]["coordinates"].x) + 1, 'border-red-600');
                });

                space_ship.style.backgroundImage = "url('" + bg_url + "')";
                space_ship.classList.add('ship');
                space_ship.style.backgroundPositionX = `-${col_i}px`;
                space_ship.style.backgroundPositionY = `-${row_i}px`;

                /* Check ship_size and set ship-start-pos in the middle */
                if (ship_size_y == 1 && ship_size_x == 1 || ship_size_y == 1 && ship_size_x == 2) {
                    if (col_i == 0) {
                        entry_point.classList.add("ship-start-pos", "border-dashed");
                    }
                } else if (ship_size_y == 1 && ship_size_x == 3) {
                    if (col_i == 32) {
                        entry_point.classList.add("ship-start-pos", "border-dashed");
                    }
                } else if (ship_size_y == 3 && ship_size_x == 3) {
                    if (row_i == 32 && col_i == 32) {
                        entry_point.classList.add("ship-start-pos", "border-dashed");
                    }
                }

                space_ship.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
                space_ship_reversed.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
                div.append(space_ship);

                coord_x++;
            }
            coord_y++;
            coord_x = parseInt(data[i]["npc"]["coordinates"].x) + 1;
        }
    }
    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinates_array_to_disable_button));
    }
}

function add_pc(data) {
    let border_color = "";
    let coordinates_array_to_disable_button = [];
    for (let i = 0; i < data.length; i++) {
        let coord_x = parseInt(data[i]["user"]["coordinates"].coord_x) + 1;
        let coord_y = (data[i]["user"]["coordinates"].coord_y) + 1;
        let ship_size_x = data[i]["ship"]['size'].size_x;
        let ship_size_y = data[i]["ship"]['size'].size_y;
        let is_reversed = data[i]["ship"]["is_reversed"];

        if (data[i].user.user != current_user_id) {
            modal_data = {
                player: {
                    name: data[i].user.name,
                    is_npc: data[i].user.is_npc,
                    image: data[i].user.image,
                    faction_name: data[i].faction.name
                },
                ship: {
                    name: data[i].ship.name,
                    category: data[i].ship.category_name,
                    description: data[i].ship.category_description,
                    max_hp: data[i].ship.max_hp,
                    current_hp: data[i].ship.current_hp,
                    current_thermal_defense: data[i].ship.current_thermal_defense,
                    current_missile_defense: data[i].ship.current_missile_defense,
                    current_ballistic_defense: data[i].ship.current_ballistic_defense,
                    max_movement: data[i].ship.max_movement,
                    current_movement: data[i].ship.current_movement,
                    status: data[i].ship.status,
                    modules: data[i].ship.modules,
                    modules_range: data[i].ship.modules_range,
                },
                actions: {
                    action_label: map_informations.actions.translated_action_label_msg,
                    close: map_informations.actions.translated_close_msg,
                    player_in_same_faction: map_informations.actions.player_is_same_faction,
                    translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
                    translated_statistics_str: map_informations.actions.translated_statistics_msg_str,
                },
            }
            let modal = create_pc_npc_modal(`pc_${data[i].user.player}`, modal_data, `${coord_y-1}_${coord_x-1}`, ship_size_y, ship_size_x, false);
            document.querySelector('#modal-container').append(modal);
        }
        for (let row_i = 0; row_i < (atlas.tilesize * ship_size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * ship_size_x); col_i += atlas.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
                if(row_i == ((atlas.tilesize * ship_size_y) - atlas.tilesize) && col_i == 0){
                    let entry_point_tooltip_container_ul = document.createElement('ul')
                    entry_point_tooltip_container_ul.id = `tooltip-pc_${data[i].user.player}`;
                    entry_point_tooltip_container_ul.classList.add(
                        'absolute', 
                        'z-10',  
                        'px-1', 
                        'py-1', 
                        'text-xs', 
                        'inline-block',
                        'font-bold', 
                        'text-white', 
                        'rounded-sm', 
                        'shadow-sm',
                        'text-center',
                        'list-none',
                        'text-justify',
                        'm-w-[100%]',
                        'tooltip'
                    );
                    if(entry_point_tooltip_container_ul.length >= 3){
                        let tooltip_container = entry_point.querySelectorAll('ul');
                        tooltip_container[0].remove();
                    }
                    entry_point.append(entry_point_tooltip_container_ul)
                }

                let entry_point_border = entry_point.querySelector('span');
                let div = entry_point.querySelector('div');
                let bg_url = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '.png';
                let bg_url_reversed_img = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '-reversed.png';
                let space_ship = document.createElement('div');
                let space_ship_reversed = document.createElement('div');

                
                if(!is_user_is_on_mobile_device() == true){
                    if (data[i].user.user != current_user_id) {
                        entry_point_border.setAttribute(attribute_touch_click, "open_close_modal('" + `modal-pc_${data[i].user.player}` + "')");
                    } else {
                        entry_point_border.setAttribute(attribute_touch_click, "reverse_player_ship_display()");
                        
                    }
                }

                space_ship.style.backgroundImage = "url('" + bg_url + "')";
                space_ship.classList.add('ship');
                space_ship.style.backgroundPositionX = `-${col_i}px`;
                space_ship.style.backgroundPositionY = `-${row_i}px`;

                space_ship_reversed.style.backgroundImage = "url('" + bg_url_reversed_img + "')";
                space_ship_reversed.classList.add('ship-reversed');
                space_ship_reversed.style.backgroundPositionX = `-${col_i}px`;
                space_ship_reversed.style.backgroundPositionY = `-${row_i}px`;
                entry_point_border.className = "absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer";

                if (data[i]["user"]["user"] == current_user_id) {
                    update_user_coord_display(data[i]["user"]["coordinates"].coord_x, data[i]["user"]["coordinates"].coord_y);
                    border_color = "border-green-300";
                    entry_point.classList.add("ship-pos");
                    entry_point_border.classList.add(border_color);

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
                    if (is_user_is_on_mobile_device()) {
                        if (data[i]["ship"]["current_movement"] <= 0) {
                            disable_button(["top", "bottom", "right", "left", "center"])
                        }
                    }
                    current_player.set_remaining_move_points(data[i]["ship"]["current_movement"]);
                }

                if (data[i]["user"]["user"] != current_user_id) {
                    border_color = "border-cyan-400";
                    entry_point_border.classList.add(border_color);
                }

                entry_point.classList.add("pc", "uncrossable");
                entry_point.setAttribute('size_x', ship_size_x);
                entry_point.setAttribute('size_y', ship_size_y);
                
                space_ship.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
                space_ship_reversed.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
                if (is_reversed) {
                    space_ship.style.display = "none";
                    space_ship_reversed.style.display = "block";
                } else {
                    space_ship.style.display = "block";
                    space_ship_reversed.style.display = "none";
                }

                entry_point_border.setAttribute('title', `${data[i]["user"]["name"]}`);
                entry_point_border.setAttribute('data-modal-target', `modal-pc_${data[i].user.player}`);
                entry_point_border.addEventListener("mouseover", function(){
                    generate_border(ship_size_y, ship_size_x, parseInt(data[i]["user"]["coordinates"].coord_y) + 1, parseInt(data[i]["user"]["coordinates"].coord_x) + 1);
                });
                entry_point_border.addEventListener("mouseout", function(){
                    remove_border(ship_size_y, ship_size_x, parseInt(data[i]["user"]["coordinates"].coord_y) + 1, parseInt(data[i]["user"]["coordinates"].coord_x) + 1, border_color);
                });

                div.append(space_ship);
                div.append(space_ship_reversed);

                coord_x++;
            }
            coord_y++;
            coord_x = parseInt(data[i]["user"]["coordinates"].coord_x) + 1
        }
    }
    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinates_array_to_disable_button));
    }
}

function generate_sector(background, sector, npc, pc) {
    add_background(background)
    add_foreground(sector)
    add_npc(npc);
    add_pc(pc);
}

function hide_sector_overflow(coord_x, coord_y) {

    let position_on_map = {
        x: parseInt(coord_x),
        y: parseInt(coord_y)
    };

    let limite_x;
    let limite_y;

    if(user_is_on_mobile_bool == true){
        limite_x = map_informations.screen_sized_map["col"];
        limite_y = map_informations.screen_sized_map["row"];
    }else{
        let window_height = window.innerHeight;
        let window_width = window.innerWidth;

        if(window_width >= 1920){
            limite_x = 40;
        }else if(window_width >= 1800){
            limite_x = 36;
        }else if(window_width >= 1680){
            limite_x = 32;
        }else if(window_width >= 1560){
            limite_x = 28;
        }else if(window_width >= 1280){
            limite_x = 24;
        }else if(window_width >= 768){
            limite_x = 20;
        }else if(window_width >= 640){
            limite_x = 20;
        }else{
            limite_x = 11;
        }

        if(window_height >= 965){
            limite_y = 25;
        }else if(window_height >= 840){
            limite_y = 20;
        }else if(window_height >= 680){
            limite_y = 16;
        }else{
            limite_y = 10;
        }
    }

    let camera_limite_y = limite_y / 2;
    let camera_limite_x = limite_x / 2;

    let display_map_start_x = (position_on_map.x - camera_limite_x) > 0 ? position_on_map.x - camera_limite_x : 0;
    let display_map_start_y = (position_on_map.y - camera_limite_y) > 0 ? position_on_map.y - camera_limite_y : 0;
    let display_map_end_x = (position_on_map.x + camera_limite_x) < atlas.col ? position_on_map.x + camera_limite_x : atlas.col;
    let display_map_end_y = (position_on_map.y + camera_limite_y) < atlas.row ? position_on_map.y + camera_limite_y : atlas.row;

    if (display_map_start_x == 0) {
        display_map_end_x = limite_x + 1;
    } else if (display_map_end_x == atlas.col) {
        display_map_start_x = atlas.col - (limite_x + 1);
    }

    if (display_map_start_y == 0) {
        display_map_end_y = limite_y + 1;
    } else if (display_map_end_y == atlas.row) {
        display_map_start_y = atlas.row - (limite_y + 1);
    }

    for (let y = 0; y <= atlas.row; y++) {
        for (let x = 0; x <= atlas.col; x++) {
            let entry_point = document.querySelector('.tabletop-view').rows[y].cells[x];
            if (((y >= display_map_start_y && y <= display_map_end_y) || y == 0) && ((x >= display_map_start_x && x <= display_map_end_x) || x == 0)) {
                entry_point.classList.remove("hidden");
            } else {
                entry_point.classList.add("hidden");
            }
        }
    }
    if (is_user_is_on_mobile_device()) {
        document.getElementById('Y_X_y').textContent = `${display_map_start_y > 0 ? parseInt(display_map_start_y) : display_map_start_y}`;
        document.getElementById('Y_X_x').textContent = `${display_map_start_x > 0 ? parseInt(display_map_start_x) : display_map_start_x}`;
    } else {
        document.getElementById('Y_X_y').textContent = `${display_map_start_y > 0 ? parseInt(display_map_start_y)-1 : display_map_start_y}`;
        document.getElementById('Y_X_x').textContent = `${display_map_start_x > 0 ? parseInt(display_map_start_x)-1 : display_map_start_x}`;
    }

}

function update_user_coord_display(x, y) {
    document.querySelector('#player-coord-x').textContent = x;
    document.querySelector('#player-coord-y').textContent = y;
}

function update_target_coord_display(element) {
    target_name = element.querySelector('span').title.split(' ')[0];
    coord_name = document.querySelector('#target-coord-name');
    coord_x = document.querySelector('#target-coord-x');
    coord_y = document.querySelector('#target-coord-y');
    coord_x.classList.remove('invisible');
    coord_y.classList.remove('invisible');
    coord_name.textContent = target_name;
    coord_x.textContent = `${element.cellIndex - 1}`;
    coord_y.textContent = `${element.parentNode.rowIndex - 1}`;
    if(is_user_is_on_mobile_device() == true){
        let e = element.querySelector('span');
        if(element.classList.contains('ship-pos')){
            reverse_player_ship_display()
        }else if(element.classList.contains('uncrossable')){
            open_close_modal(e.dataset.modalTarget);
        }
    }
}


function generate_border_className(size_y, size_x){
    switch(size_y){
        case 1:
            if(size_x == 1){
                return {
                    0: ["border-2", "border-dashed"]
                };
            }else if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed"], 
                    1: ["border-r-2", "border-t-2", "border-b-2", "border-dashed"]
                };
            }else if(size_x == 3){
                return {
                    0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed"], 
                    2: ["border-t-2", "border-b-2", "border-dashed"],
                    3: ["border-r-2", "border-t-2", "border-b-2", "border-dashed"],
                };
            }
            break;
        case 2:
            if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"], 
                    1: ["border-r-2", "border-t-2", "border-dashed"],
                    2: ["border-l-2", "border-b-2", "border-dashed"],
                    3: ["border-r-2", "border-b-2", "border-dashed"]
                };
            }
            break;
        case 3:
            if(size_x == 3){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"],
                    1: ["border-t-2", "border-dashed"], 
                    2: ["border-r-2", "border-t-2", "border-dashed"],
                    3: ["border-l-2", "border-dashed"],
                    4: ["none"],
                    5: ["border-r-2", "border-dashed"],
                    6: ["border-l-2", "border-b-2", "border-dashed"],
                    7: ["border-b-2", "border-dashed"],
                    8: ["border-r-2", "border-b-2", "border-dashed"]
                };
            }
            break;
        case 4:
            if(size_x == 4){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"],
                    1: ["border-t-2", "border-dashed"], 
                    2: ["border-t-2", "border-dashed"], 
                    3: ["border-r-2", "border-t-2", "border-dashed"],
                    4: ["border-l-2", "border-dashed"],
                    5: ["none"],
                    6: ["none"],
                    7: ["border-r-2", "border-dashed"],
                    8: ["border-l-2", "border-dashed"],
                    9: ["none"],
                    10: ["none"],
                    11: ["border-r-2", "border-dashed"],
                    12: ["border-l-2","border-b-2", "border-dashed"],
                    13: ["border-b-2", "border-dashed"],
                    14: ["border-b-2", "border-dashed"],
                    15: ["border-r-2", "border-b-2", "border-dashed"],
                };
            }
            break;
        default:
            break;
    }
}

function remove_border(size_y, size_x, coord_y, coord_x, color_class){
    let c_y = coord_y;
    let c_x = coord_x;

    for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
            let parent_e = document.querySelector('.tabletop-view').rows[c_y].cells[c_x];
            let child_e = parent_e.querySelector('span');
            child_e.className = `absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer ${color_class}`;
            c_x++;
        }
        c_y++;
        c_x = coord_x;
    }
}

function generate_border(size_y, size_x, coord_y, coord_x){
    let c_y = coord_y;
    let c_x = coord_x;
    let classList = generate_border_className(size_y, size_x);
    let element_list = [];

    for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
            let parent_e = document.querySelector('.tabletop-view').rows[c_y].cells[c_x];
            element_list.push(parent_e);
            c_x++;
        }
        c_y++;
        c_x = coord_x;
    }

    for(index = 0 ; index < element_list.length; index++){
        let child_e = element_list[index].querySelector('span');
        for(border_class in classList[index]){
            if(classList[index][border_class] != "none"){
                child_e.classList.add(classList[index][border_class])
            }
        }
    }
}