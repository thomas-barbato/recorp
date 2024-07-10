let movement_array = [];

let mobile_current_player = new Player(
    null,
    null,
    null,
    10,
)

function display_pathfinding_mobile(direction) {
    set_disabled_button_status(false);
    define_user_values();
    add_to_movement_array(direction);
    if (mobile_current_player.move_points_value > movement_array.length) {
        for (let i = 0; i < movement_array.length; i++) {
            let last_coord = movement_array[movement_array.length - 1].split('_');
            mobile_current_player.set_end_coord(
                parseInt(last_coord[1]),
                parseInt(last_coord[0]),
            );

            let td_ship_el = document.getElementById(`${movement_array[i]}`);
            let span_el = td_ship_el.querySelector('span');
            let path = movement_array[i].split('_');
            let coord = {
                x: parseInt(path[1]),
                y: parseInt(path[0])
            };
            if (i < movement_array.length - 1) {
                span_el.classList.add('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
                span_el.textContent = i + 1;
                // if i index is same has path - 1
                // show ship placeholder.
            } else if (i == movement_array.length - 1) {
                span_el.textContent = "";
                // will be used to stock real ship coordinates
                let ship_arrival_coordinates = []
                let can_be_crossed = true;
                for (let row_i = coord.y; row_i < (coord.y + mobile_current_player.s_size.y); row_i++) {
                    for (let col_i = coord.x; col_i < (coord.x + mobile_current_player.s_size.x); col_i++) {
                        let td_ship_el = document.getElementById(`${row_i-1}_${col_i-1}`);
                        if (td_ship_el) {
                            // check outbound
                            if ((col_i) >= 41 || (row_i - 1) >= 41 || td_ship_el.classList.contains('uncrossable') && !td_ship_el.classList.contains('player-ship-pos')) {
                                can_be_crossed = false;
                            }
                            // save id in list
                            ship_arrival_coordinates.push(`${row_i-1}_${col_i-1}`);
                        } else {
                            can_be_crossed = false;
                        }
                    }
                }
                switch (ship_arrival_coordinates.length) {
                    case 9:
                        for (let i = 0; i < 9; i++) {
                            let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                            let span_ship_el = td_ship_el.querySelector('span');
                            if (i == 0) {
                                span_ship_el.classList.add('border-t', 'border-l');
                                span_ship_el.classList.remove('hover:border-2', 'hover:border');
                            } else if (i == 1) {
                                span_ship_el.classList.add('border-t');
                            } else if (i == 2) {
                                span_ship_el.classList.add('border-t', 'border-r');
                            } else if (i == 3) {
                                span_ship_el.classList.add('border-l');
                            } else if (i == 5) {
                                span_ship_el.classList.add('border-r');
                            } else if (i == 6) {
                                span_ship_el.classList.add('border-l', 'border-b');
                            } else if (i == 7) {
                                span_ship_el.classList.add('border-b');
                            } else if (i == 8) {
                                span_ship_el.classList.add('border-b', 'border-r');
                            }
                        }
                        break;
                    case 3:
                        for (let i = 0; i < 3; i++) {
                            let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                            let span_ship_el = td_ship_el.querySelector('span');
                            if (i == 0) {
                                span_ship_el.classList.add('border-t', 'border-l', 'border-b');
                            } else if (i == 1) {
                                span_ship_el.classList.add('border-t', 'border-b');
                            } else if (i == 2) {
                                span_ship_el.classList.add('border-t', 'border-r', 'border-b');
                            }
                        }
                        break;
                    case 2:
                        for (let i = 0; i < 2; i++) {
                            let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                            let span_ship_el = td_ship_el.querySelector('span');
                            if (i == 0 || i == 1) {
                                span_ship_el.classList.add('border-t', 'border-l', 'border-b');
                            }
                        }
                        break;
                }
                if (can_be_crossed == true) {
                    for (let i = 0; i < ship_arrival_coordinates.length; i++) {
                        let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                        let span_ship_el = td_ship_el.querySelector('span');
                        span_ship_el.textContent = "";
                        span_ship_el.classList.remove('bg-teal-500/30');
                        span_ship_el.classList.add('bg-amber-400/50', 'border-amber-400', 'animate-pulse');
                    }
                    // set new end_coord
                    current_player.set_end_coord(
                        coord.x,
                        coord.y
                    );
                    // set real coordinates
                    current_player.set_fullsize_coordinates(ship_arrival_coordinates);
                    current_player.set_selected_cell_bool(true);
                } else {
                    for (let i = 0; i < ship_arrival_coordinates.length; i++) {
                        let uncrossable_td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`)
                        let uncrossable_span_ship_el = uncrossable_td_ship_el.querySelector('span');
                        uncrossable_span_ship_el.textContent = "";
                        uncrossable_span_ship_el.classList.remove('bg-teal-500/30', 'border-dashed');
                        uncrossable_span_ship_el.classList.add('bg-red-600/50', 'border-red-600', 'animate-pulse');
                    }
                    current_player.set_selected_cell_bool(false);
                }
            }
        }
    } else {
        set_disabled_button_status(true);
    }
}

function add_to_movement_array(direction) {
    let modified_y = 0;
    let modified_x = 0;
    let move_y = mobile_current_player.coord.start_y
    let move_x = mobile_current_player.coord.start_x
    if (movement_array.length > 0) {
        switch (direction) {
            case "top":
                modified_y = -1;
                break;
            case "bottom":
                modified_y = 1;
                break;
            case "left":
                modified_x = -1;
                break;
            case "right":
                modified_x = 1;
                break;
        }
        let last_position = movement_array[(movement_array.length - 1)].split('_');
        move_y = parseInt(last_position[0]) + modified_y
        move_x = parseInt(last_position[1]) + modified_x
        movement_array.push(`${ move_y }_${ move_x }`);
    } else {
        movement_array.push(`${ move_y }_${ move_x }`);
    }

}

function remove_from_movement_array() {

}

function clear_path() {
    set_disabled_button_status(false)
    for (let i = 0; i < movement_array.length; i++) {
        let td_ship_el = document.getElementById(`${movement_array[i]}`);
        let e_target = td_ship_el.querySelector('div>span');
        e_target.classList.remove('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
        e_target.textContent = "";
    }
    movement_array = [];
}

function set_disabled_button_status(is_disabled) {
    let center = document.querySelector('#center')
    let direction_icon = document.querySelectorAll('.arrow-icon');
    let direction_element = document.querySelectorAll('.direction-arrow');

    if (is_disabled) {

        for (let i = 0; i < direction_element.length; i++) {
            direction_element[i].classList.remove('bg-gray-800/40', 'border-[#B1F1CB]');
            direction_element[i].classList.add('border-red-600', 'disabled-arrow');
        }
        center.classList.add('text-red-600');
        center.classList.remove('text-emerald-400');

        for (let i = 0; i < direction_icon.length; i++) {
            direction_icon[i].classList.remove('text-emerald-400');
            direction_icon[i].classList.add('text-red-600');
        }

    } else {

        for (let i = 0; i < direction_element.length; i++) {
            direction_element[i].classList.add('bg-gray-800/40', 'border-[#B1F1CB]');
            direction_element[i].classList.remove('border-red-600', 'disabled-arrow');
        }

        center.classList.remove('text-red-600');
        center.classList.add('text-emerald-400');

        for (let i = 0; i < direction_icon.length; i++) {
            direction_icon[i].classList.remove('text-red-600');
            direction_icon[i].classList.add('text-emerald-400');
        }
    }
}


function define_user_values() {
    for (let i = 0; i < map_informations['pc_npc'].length; i++) {
        if (map_informations['pc_npc'][i]['user']['user'] == current_user_id) {

            let start_node_id = document.querySelector('.player-start-pos').id.split('_');
            let ship_size = document.querySelector('.player-start-pos');
            let ship_is_reversed = true ? document.querySelectorAll('.player-ship-reversed')[0].style.display === "block" : false;

            mobile_current_player.set_player_id(
                map_informations['pc_npc'][i]['user']['player']
            );

            mobile_current_player.set_is_reversed(ship_is_reversed);
            mobile_current_player.set_ship_size(
                parseInt(ship_size.getAttribute('size_x')),
                parseInt(ship_size.getAttribute('size_y'))
            );

            // we use start_node_id to get destination coord.
            // we check ship size to define itterator.
            if (mobile_current_player.s_size.x == 1 && mobile_current_player.s_size.y == 1) {
                if (mobile_current_player.reversed_ship_status == true) {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) - 1,
                        parseInt(start_node_id[0]),
                    );
                } else {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) + 1,
                        parseInt(start_node_id[0]),
                    );
                }
            } else if (mobile_current_player.s_size.x == 2 && mobile_current_player.s_size.y == 1) {
                if (mobile_current_player.reversed_ship_status == true) {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) + 2,
                        parseInt(start_node_id[0]),
                    );
                } else {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) - 1,
                        parseInt(start_node_id[0]),
                    );
                }
            } else if (mobile_current_player.s_size.x == 3 && mobile_current_player.s_size.y == 1) {
                if (mobile_current_player.reversed_ship_status == true) {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) - 2,
                        parseInt(start_node_id[0]),
                    );
                } else {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) + 2,
                        parseInt(start_node_id[0]),
                    );
                }
            } else if (mobile_current_player.s_size.x == 3 && mobile_current_player.s_size.y == 3) {
                if (mobile_current_player.reversed_ship_status == true) {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) - 2,
                        parseInt(start_node_id[0]),
                    );
                } else {
                    mobile_current_player.set_start_coord(
                        parseInt(start_node_id[1]) + 2,
                        parseInt(start_node_id[0]),
                    );
                }
            }
        }
    }
}

function define_position_preview(ship_arrival_coordinates) {
    switch (ship_arrival_coordinates.length) {
        case 9:
            for (let i = 0; i < 9; i++) {
                let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                let span_ship_el = td_ship_el.querySelector('span');
                if (td_ship_el.classList.contains('player-ship-pos')) {
                    span_ship_el.classList.remove('border', 'border-dashed', 'border-2', 'border-green-300');
                }
                if (i == 0) {
                    span_ship_el.classList.add('border-t', 'border-l');
                    span_ship_el.classList.remove('hover:border-2', 'hover:border');
                } else if (i == 1) {
                    span_ship_el.classList.add('border-t');
                } else if (i == 2) {
                    span_ship_el.classList.add('border-t', 'border-r');
                } else if (i == 3) {
                    span_ship_el.classList.add('border-l');
                } else if (i == 5) {
                    span_ship_el.classList.add('border-r');
                } else if (i == 6) {
                    span_ship_el.classList.add('border-l', 'border-b');
                } else if (i == 7) {
                    span_ship_el.classList.add('border-b');
                } else if (i == 8) {
                    span_ship_el.classList.add('border-b', 'border-r');
                }
            }
            break;
        case 3:
            for (let i = 0; i < 3; i++) {
                let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                let span_ship_el = td_ship_el.querySelector('span');
                if (td_ship_el.classList.contains('player-ship-pos')) {
                    span_ship_el.classList.remove('border', 'border-dashed', 'border-2', 'border-green-300');
                }
                if (i == 0) {
                    span_ship_el.classList.add('border-t', 'border-l', 'border-b');
                    span_ship_el.classList.remove('hover:border-2', 'hover:border');
                } else if (i == 1) {
                    span_ship_el.classList.add('border-t', 'border-b');
                } else if (i == 2) {
                    span_ship_el.classList.add('border-t', 'border-r', 'border-b');
                }
            }
            break;
        case 2:
            for (let i = 0; i < 2; i++) {
                let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                let span_ship_el = td_ship_el.querySelector('span');
                if (td_ship_el.classList.contains('player-ship-pos')) {
                    span_ship_el.classList.remove('border', 'border-dashed', 'border-2', 'border-green-300');
                }
                if (i == 0) {
                    span_ship_el.classList.add('border-t', 'border-l', 'border-b');
                    span_ship_el.classList.remove('hover:border-2', 'hover:border');
                } else if (i == 1) {
                    span_ship_el.classList.add('border-t', 'border-r', 'border-b');
                }
            }
            break;
    }
}