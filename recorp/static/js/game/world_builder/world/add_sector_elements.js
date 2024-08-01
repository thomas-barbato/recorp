function add_sector_background(background_name) {
    let index_row = 1;
    let index_col = 1;
    let bg_url = '/static/img/atlas/background/' + background_name + '/' + '0.gif';
    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            let entry_point_border = entry_point.querySelector('div>span');

            entry_point.style.backgroundImage = "url('" + bg_url + "')";
            entry_point.style.backgroundPositionX = `-${col_i}px`;
            entry_point.style.backgroundPositionY = `-${row_i}px`;
            entry_point_border.classList.add('pathfinding-zone', 'cursor-pointer');
            entry_point_border.setAttribute('title', `${map_informations["sector"]["name"]} [x = ${parseInt(index_col - 1)}; y = ${parseInt(index_row - 1)}]`);

            index_col++;
        }
        index_row++;
        index_col = 1;
    }
    for (let i = 0; i < map_informations.pc_npc.length; i++) {
        let player = map_informations.pc_npc[i];
        if (player.user.user == current_user_id) {
            hide_sector_overflow(player.user.coordinates.coord_x, player.user.coordinates.coord_y);
            if (!user_is_on_mobile_device()) {
                set_pathfinding_event();
            }
            document.querySelector('.tabletop-view').classList.remove('hidden')
            break;
        }
    }
}

function add_sector_foreground(sector_element) {
    for (let sector_i = 0; sector_i < sector_element.length; sector_i++) {
        element_type = sector_element[sector_i]["animations"][0];
        element_type_translated = sector_element[sector_i]["type_translated"];
        element_data = sector_element[sector_i]["data"];
        folder_name = sector_element[sector_i]["animations"][1];
        modal_data = {
            type: sector_element[sector_i].data.type,
            translated_type: sector_element[sector_i].data.type_translated,
            animation: {
                dir: sector_element[sector_i]["animations"][0],
                img: sector_element[sector_i]["animations"][1],
            },
            name: sector_element[sector_i].data.name,
            description: sector_element[sector_i].data.description,
            resources: {
                id: sector_element[sector_i].resource.id,
                name: sector_element[sector_i].resource.name,
                quantity_str: sector_element[sector_i].resource.quantity_str,
                quantity: sector_element[sector_i].resource.quantity,
                translated_text_resource: sector_element[sector_i].resource.translated_text_resource,
                translated_quantity_str: sector_element[sector_i].resource.translated_quantity_str,
                translated_scan_msg_str: sector_element[sector_i].resource.translated_scan_msg_str,
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
                x: sector_element[sector_i].data.coord_x,
                y: sector_element[sector_i].data.coord_y
            }
        }
        let modal = create_foreground_modal(
            element_data["name"],
            modal_data
        );

        document.querySelector('#modal-container').append(modal);
        let index_row = sector_element[sector_i]['data']['coord_y'];
        let index_col = sector_element[sector_i]['data']['coord_x'];
        let size_x = sector_element[sector_i]['size']["size_x"];
        let size_y = sector_element[sector_i]['size']["size_y"];
        let bg_url = '/static/img/atlas/foreground/' + element_type + '/' + folder_name + '/' + '0.gif';

        for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[parseInt(index_row) + 1].cells[parseInt(index_col) + 1];
                let entry_point_div = entry_point.querySelector('div');
                let entry_point_border = entry_point_div.querySelector('span');
                let img_div = document.createElement('div');

                entry_point.classList.add('uncrossable');
                entry_point.setAttribute('size_x', size_x);
                entry_point.setAttribute('size_y', size_y);
                entry_point_border.classList.add('hover:border-dashed', 'border-amber-500', 'cursor-pointer');
                entry_point_border.setAttribute('title', `${element_data["name"]} [x: ${parseInt(index_col)}; y: ${parseInt(index_row)}]`);
                entry_point_border.setAttribute('data-modal-target', "modal-" + element_data["name"]);
                entry_point_border.setAttribute('data-modal-toggle', "modal-" + element_data["name"]);
                if (!user_is_on_mobile_device()) {
                    entry_point_border.setAttribute('onclick', "open_close_modal('" + "modal-" + element_data["name"] + "')");
                } else {
                    entry_point_border.setAttribute('ontouchstart', "open_close_modal('" + "modal-" + element_data["name"] + "')");
                }

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
            index_col = sector_element[sector_i]['data']['coord_x'];
        }
    }
}

function add_pc_npc(data) {
    let border_color = "";
    for (let i = 0; i < data.length; i++) {
        let coord_x = (data[i]["user"]["coordinates"].coord_x);
        let coord_y = (data[i]["user"]["coordinates"].coord_y);
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
                },
                actions: {
                    action_label: map_informations.actions.translated_action_label_msg,
                    close: map_informations.actions.translated_close_msg,
                    player_in_same_faction: map_informations.actions.player_is_same_faction,
                    translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
                    translated_statistics_str: map_informations.actions.translated_statistics_msg_str,
                },
            }

            let modal = create_pc_npc_modal(`pc_npc_${data[i].user.player}`, modal_data, `${coord_y-1}_${coord_x-1}`, ship_size_y, ship_size_x);
            document.querySelector('#modal-container').append(modal);
        }

        for (let row_i = 0; row_i < (atlas.tilesize * ship_size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * ship_size_x); col_i += atlas.tilesize) {

                let entry_point = document.querySelector('.tabletop-view').rows[coord_y + 1].cells[coord_x + 1];
                let entry_point_border = entry_point.querySelector('span');
                let div = entry_point.querySelector('div');
                let bg_url = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '.png';
                let bg_url_reversed_img = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '-reversed.png';
                let space_ship = document.createElement('div');
                let space_ship_reversed = document.createElement('div');

                entry_point.classList.add('uncrossable');
                entry_point.setAttribute('size_x', ship_size_x);
                entry_point.setAttribute('size_y', ship_size_y);
                entry_point_border.classList.add('border-dashed', 'cursor-pointer');
                entry_point_border.setAttribute('title', `${data[i]["user"]["name"]}`);
                entry_point_border.setAttribute('data-modal-target', `modal-pc_npc_${data[i].user.player}`);
                entry_point_border.setAttribute('data-modal-toggle', `modal-pc_npc_${data[i].user.player}`);
                if (!user_is_on_mobile_device()) {
                    entry_point_border.setAttribute('onclick', "open_close_modal('" + `modal-pc_npc_${data[i].user.player}` + "')");
                    entry_point_border.removeAttribute('onmouseover', 'get_pathfinding(this)');
                } else {
                    entry_point_border.setAttribute('ontouchstart', "open_close_modal('" + `modal-pc_npc_${data[i].user.player}` + "')");
                }

                space_ship.style.backgroundImage = "url('" + bg_url + "')";
                space_ship.classList.add('ship');
                space_ship.style.backgroundPositionX = `-${col_i}px`;
                space_ship.style.backgroundPositionY = `-${row_i}px`;

                space_ship_reversed.style.backgroundImage = "url('" + bg_url_reversed_img + "')";
                space_ship_reversed.classList.add('ship-reversed');
                space_ship_reversed.style.backgroundPositionX = `-${col_i}px`;
                space_ship_reversed.style.backgroundPositionY = `-${row_i}px`;

                if (data[i]["user"]["user"] == current_user_id) {
                    update_user_coord_display(data[i]["user"]["coordinates"].coord_x, data[i]["user"]["coordinates"].coord_y);
                    border_color = "border-green-300";
                    entry_point.classList.add("player-ship-pos");
                    if (!user_is_on_mobile_device()) {
                        entry_point.setAttribute('onclick', 'reverse_player_ship_display()');
                    } else {
                        entry_point.setAttribute('ontouchstart', 'reverse_player_ship_display()');
                    }
                    /* Check ship_size and set player-start-pos in the middle */
                    if (ship_size_y == 1 && ship_size_x == 1 || ship_size_y == 1 && ship_size_x == 2) {
                        if (col_i == 0) {
                            entry_point.classList.add("player-start-pos", "border-dashed");
                        }
                    } else if (ship_size_y == 1 && ship_size_x == 3) {
                        if (col_i == 32) {
                            entry_point.classList.add("player-start-pos", "border-dashed");
                        }
                    } else if (ship_size_y == 3 && ship_size_x == 3) {
                        if (row_i == 32 && col_i == 32) {
                            entry_point.classList.add("player-start-pos", "border-dashed");
                        }
                    }
                    space_ship.classList.add("player-ship");
                    space_ship_reversed.classList.add("player-ship-reversed");
                }

                let pc_or_npc_class = data[i]["user"]["is_npc"] == true ? "npc" : "pc";

                if (data[i]["user"]["is_npc"]) {
                    border_color = "border-red-700";
                } else if (data[i]["user"]["user"] != current_user_id && !data[i]["user"]["is_npc"]) {
                    border_color = "border-cyan-400";
                }

                entry_point_border.classList.add(border_color);
                entry_point.classList.add(pc_or_npc_class);
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
            coord_x = data[i]["user"]["coordinates"]["coord_x"];
        }
    }
}

function hide_sector_overflow(coord_x, coord_y) {

    let position_on_map = {
        x: parseInt(coord_x),
        y: parseInt(coord_y)
    };

    let limite_x = map_informations.screen_sized_map["col"];
    let limite_y = map_informations.screen_sized_map["row"];


    let limite_divider = 2;

    let display_map_start_x = (position_on_map.x - Math.round(limite_x / limite_divider)) <= 0 ? 0 : (position_on_map.x - Math.round(limite_x / limite_divider));
    let display_map_end_x = (position_on_map.x + Math.round(limite_x / limite_divider)) >= atlas.col ? atlas.col : (display_map_start_x + limite_x);

    let display_map_start_y = (position_on_map.y - Math.round(limite_y / limite_divider)) <= 0 ? 0 : (position_on_map.y - Math.round(limite_y / limite_divider));
    let display_map_end_y = (position_on_map.y + Math.round(limite_y / limite_divider)) >= atlas.row ? atlas.row : (display_map_start_y + limite_y);

    if (display_map_end_x == atlas.col) {
        display_map_start_x = display_map_end_x - limite_x;
    }
    if (display_map_end_y == atlas.row) {
        display_map_start_y = display_map_end_y - limite_y;
    }

    for (let y = 0; y <= atlas.row; y++) {
        for (let x = 0; x <= atlas.col; x++) {
            let entry_point = document.querySelector('.tabletop-view').rows[y].cells[x];
            entry_point.classList.remove("hidden");
            if ((x < display_map_start_x || x > display_map_end_x) && x != 0) {
                entry_point.classList.add("hidden");
            }
            if ((y < display_map_start_y || y > display_map_end_y) && y != 0) {
                entry_point.classList.add("hidden");
            }
        }
    }

    document.getElementById('Y_X').textContent = `${display_map_start_y > 0 ? parseInt(display_map_start_y)-1 : display_map_start_y}:${display_map_start_x > 0 ? parseInt(display_map_start_x)-1 : display_map_start_x}`

}

function update_user_coord_display(x, y) {
    document.querySelector('#player-coord-x').textContent = `x = ${x}`;
    document.querySelector('#player-coord-y').textContent = `y = ${y}`;
}

function update_target_coord_display() {
    let selected_tile = document.querySelectorAll('.tile')
    for (let i = 0; i < selected_tile.length; i++) {
        selected_tile[i].addEventListener('mouseover', function() {
            let target_name = this.querySelector('span').title.split(' ')[0];
            let coord_name = document.querySelector('#target-coord-name');
            let coord_x = document.querySelector('#target-coord-x');
            let coord_y = document.querySelector('#target-coord-y');
            coord_name.textContent = target_name;
            coord_x.textContent = `x = ${this.cellIndex - 1}`;
            coord_y.textContent = `y = ${this.parentNode.rowIndex - 1}`;
        })
    }
}