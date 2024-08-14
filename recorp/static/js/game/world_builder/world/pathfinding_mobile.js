let movement_array = [];
let ship_arrival_coordinates = [];
let can_be_crossed_temp_array = [];
let current_direction = "";
let direction_array = [];


function display_pathfinding_mobile(direction) {
    direction_array.push(direction);
    define_user_values();
    unset_disabled_button_status();
    add_to_movement_array(direction);
    let last_coord = movement_array.slice(-1)[0].split('_');
    current_player.set_end_coord(
        parseInt(last_coord[1]),
        parseInt(last_coord[0]),
    );

    define_preview_zone(direction)

}

function define_preview_zone(direction) {

    let coord_minus_ship_size_x = 0;
    let coord_minus_ship_size_y = 0;
    if (current_player.s_size.y == 3 && current_player.s_size.x == 3) {
        if (direction == "top") {
            if (is_reversed_movement(direction_array)) {
                coord_minus_ship_size_y = 0;
                coord_minus_ship_size_x = -1;
            } else {
                coord_minus_ship_size_y = -2;
                coord_minus_ship_size_x = -1;
            }
        } else if (direction == "bottom") {
            if (is_reversed_movement(direction_array)) {
                coord_minus_ship_size_y = 0;
                coord_minus_ship_size_x = -1;
                console.log(movement_array)
                console.log(ship_arrival_coordinates)
            } else {
                coord_minus_ship_size_y = 0;
                coord_minus_ship_size_x = -1;
            }

        } else if (direction == "left") {
            coord_minus_ship_size_x = -2;
            coord_minus_ship_size_y = -1;
        } else if (direction == "right") {
            coord_minus_ship_size_x = 0;
            coord_minus_ship_size_y = -1;
        }
    } else if (current_player.s_size.y == 1 && current_player.s_size.x == 2) {
        if (direction == "top" || direction == "bottom") {
            coord_minus_ship_size_x = 0;
        } else if (direction == "left") {
            coord_minus_ship_size_x = -1;
        } else if (direction == "right") {
            coord_minus_ship_size_x = 0;
        }
    } else if (current_player.s_size.y == 1 && current_player.s_size.x == 3) {
        if (direction == "top" || direction == "bottom") {
            coord_minus_ship_size_x = -1;
        } else if (direction == "left") {
            coord_minus_ship_size_x = -2;
        } else if (direction == "right") {
            coord_minus_ship_size_x = 0;
        }
    }
    if (current_player.move_points_value >= movement_array.length) {
        clean_previous_preview_position(ship_arrival_coordinates);

        let can_be_crossed = true;
        let movement_array_slice = movement_array.slice(-1)[0].split('_');
        console.log(movement_array_slice)
        let last_td_ship_el = document.getElementById(`${movement_array_slice[0]}_${movement_array_slice[1]}`);

        if (last_td_ship_el) {
            let last_span_el = last_td_ship_el.querySelector('span');
            last_span_el.classList.add('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
            last_span_el.textContent = movement_array.length;
            if (direction == "bottom" || direction == "right") {
                for (let row_i = parseInt(movement_array_slice[0]); row_i < (parseInt(movement_array_slice[0]) + current_player.s_size.y); row_i++) {
                    for (let col_i = parseInt(movement_array_slice[1]); col_i < (parseInt(movement_array_slice[1]) + current_player.s_size.x); col_i++) {
                        final_row_i = (row_i + coord_minus_ship_size_y);
                        final_col_i = (col_i + coord_minus_ship_size_x);
                        let td_ship_el = document.getElementById(`${final_row_i}_${final_col_i}`);
                        if (td_ship_el) {
                            if ((final_row_i) < 1) {
                                disable_button(['top']);
                            } else if ((final_row_i) >= 39) {
                                disable_button(['bottom']);
                            }
                            if ((final_col_i) < 1) {
                                disable_button(['left']);
                            } else if ((final_col_i) >= 39) {
                                disable_button(['right']);
                            }
                            if (td_ship_el.classList.contains('uncrossable') || td_ship_el.classList.contains('player-ship-pos')) {
                                can_be_crossed_temp_array.push(false);
                            }
                            if (document.getElementById(`${final_row_i}_${final_col_i}`)) {
                                ship_arrival_coordinates.push(`${final_row_i}_${final_col_i}`);
                            }

                        } else {
                            can_be_crossed_temp_array.push(false);
                        }
                    }
                }
                if (can_be_crossed_temp_array.length > 0) {
                    can_be_crossed = false;
                    can_be_crossed_temp_array.splice(0, can_be_crossed_temp_array.length);
                }
                define_position_preview(ship_arrival_coordinates, can_be_crossed, direction);
                if (current_player.move_points_value == movement_array.length) {
                    let reverse_current_direction = "";
                    switch (current_direction) {
                        case "left":
                            reverse_current_direction = "right";
                            break;
                        case "right":
                            reverse_current_direction = "left";
                            break;
                        case "top":
                            reverse_current_direction = "bottom";
                            break;
                        case "bottom":
                            reverse_current_direction = "top";
                            break;
                        default:
                            break;
                    }
                    let direction_array = ["top", "bottom", "right", "left"];
                    let block_these_buttons = direction_array.filter(e => e !== reverse_current_direction);
                    disable_button(block_these_buttons);
                }
            } else {
                for (let row_i = parseInt(movement_array_slice[0]); row_i > (parseInt(movement_array_slice[0]) - current_player.s_size.y); row_i--) {
                    for (let col_i = parseInt(movement_array_slice[1]); col_i > (parseInt(movement_array_slice[1]) - current_player.s_size.x); col_i--) {
                        final_row_i = (row_i + coord_minus_ship_size_y);
                        final_col_i = (col_i + coord_minus_ship_size_x);
                        let td_ship_el = document.getElementById(`${final_row_i}_${final_col_i}`);
                        if (td_ship_el) {
                            if ((final_row_i) < 1) {
                                disable_button(['top']);
                            } else if ((final_row_i) >= 39) {
                                disable_button(['bottom']);
                            }
                            if ((final_col_i) < 1) {
                                disable_button(['left']);
                            } else if ((final_col_i) >= 39) {
                                disable_button(['right']);
                            }
                            if (td_ship_el.classList.contains('uncrossable') || td_ship_el.classList.contains('player-ship-pos')) {
                                can_be_crossed_temp_array.push(false);
                            }
                            if (document.getElementById(`${final_row_i}_${final_col_i}`)) {
                                ship_arrival_coordinates.push(`${final_row_i}_${final_col_i}`);
                            }

                        } else {
                            can_be_crossed_temp_array.push(false);
                        }
                    }
                }
                if (can_be_crossed_temp_array.length > 0) {
                    can_be_crossed = false;
                    can_be_crossed_temp_array.splice(0, can_be_crossed_temp_array.length);
                }
                define_position_preview(ship_arrival_coordinates, can_be_crossed, direction);
                if (current_player.move_points_value == movement_array.length) {
                    let reverse_current_direction = "";
                    switch (current_direction) {
                        case "left":
                            reverse_current_direction = "right";
                            break;
                        case "right":
                            reverse_current_direction = "left";
                            break;
                        case "top":
                            reverse_current_direction = "bottom";
                            break;
                        case "bottom":
                            reverse_current_direction = "top";
                            break;
                        default:
                            break;
                    }
                    let direction_array = ["top", "bottom", "right", "left"];
                    let block_these_buttons = direction_array.filter(e => e !== reverse_current_direction);
                    disable_button(block_these_buttons);
                }
            }

        } else {
            cleanCss();
            clear_path();
            clean_previous_preview_position(ship_arrival_coordinates);
            set_disabled_center_button_status(true);
        }
    } else {
        set_disabled_center_button_status(true);
    }
}

function is_reversed_movement(direction_array) {
    let last_move = direction_array[direction_array.length - 1];
    let seconde_last_move = direction_array[direction_array.length - 2];

    let movement_is_reversed = false;

    if ((last_move == "top" && seconde_last_move == "bottom") || (last_move == "bottom" && seconde_last_move == "top")) {
        movement_is_reversed = true
    } else if ((last_move == "right" && seconde_last_move == "left") || (last_move == "left" && seconde_last_move == "right")) {
        movement_is_reversed = true
    }

    return movement_is_reversed;
}

function get_direction_modifier(direction) {
    let modified_y = 0;
    let modified_x = 0;
    // set direction modifier.
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
    return [modified_y, modified_x];
}

function add_to_movement_array(direction) {
    let move_y = 0;
    let move_x = 0;
    let coord = 0;
    let direction_coord_modified = get_direction_modifier(direction);

    if (movement_array.length >= 1) {
        let last_position = movement_array.slice(-1)[0].split('_');
        move_y = parseInt(last_position[0]) + direction_coord_modified[0];
        move_x = parseInt(last_position[1]) + direction_coord_modified[1];
        let coord = `${move_y}_${move_x}`;
        if (current_player.move_points_value >= movement_array.length) {
            if (!movement_already_exists(coord)) {
                set_disabled_center_button_status(false);
                current_direction = direction;
                movement_array.push(coord);
            } else {
                set_disabled_center_button_status(true);
                current_direction = direction;
                delete_last_destination(coord);
            }
        } else {
            set_disabled_center_button_status(true);
            if (movement_already_exists(coord)) {
                delete_last_destination(coord);
            }
        }
    } else if (movement_array.length == 0) {
        // set start location for pathfinding.
        // per ship size.
        console.log(current_player.coord.start_y, current_player.coord.start_x)
        if (current_player.s_size.y == 3 && current_player.s_size.x == 3) {
            if (direction == "right") {
                move_y = current_player.coord.start_y;
                move_x = current_player.coord.start_x + 2;
            } else if (direction == "left") {
                move_y = current_player.coord.start_y;
                move_x = current_player.coord.start_x - 2;
            } else if (direction == "top") {
                move_y = current_player.coord.start_y - 2;
                move_x = current_player.coord.start_x;
            } else if (direction == "bottom") {
                move_y = current_player.coord.start_y + 2;
                move_x = current_player.coord.start_x;
            }
        } else if (current_player.s_size.y == 1 && current_player.s_size.x == 3) {
            if (direction == "right") {
                move_y = current_player.coord.start_y;
                move_x = current_player.coord.start_x + 2;
            } else if (direction == "left") {
                move_y = current_player.coord.start_y;
                move_x = current_player.coord.start_x - 2;
            } else if (direction == "top") {
                move_y = current_player.coord.start_y - 2;
                move_x = current_player.coord.start_x;
            } else if (direction == "bottom") {
                move_y = current_player.coord.start_y + 2;
                move_x = current_player.coord.start_x;
            }
        } else if (current_player.s_size.x == 2) {
            if (direction == "right") {
                if (current_player.is_reversed) {
                    move_y = current_player.coord.start_y;
                    move_x = current_player.coord.start_x + 2;
                } else {
                    move_y = current_player.coord.start_y;
                    move_x = current_player.coord.start_x + 2;
                }
            } else if (direction == "left") {
                if (current_player.is_reversed) {
                    move_y = current_player.coord.start_y;
                    move_x = current_player.coord.start_x - 1;
                } else {
                    move_y = current_player.coord.start_y;
                    move_x = current_player.coord.start_x;
                }
            } else if (direction == "top") {
                if (current_player.is_reversed) {
                    move_y = current_player.coord.start_y + 1;
                    move_x = current_player.coord.start_x;
                } else {
                    move_y = current_player.coord.start_y - 2;
                    move_x = current_player.coord.start_x;
                }
            } else if (direction == "bottom") {
                if (current_player.is_reversed) {
                    move_y = current_player.coord.start_y + 2;
                    move_x = current_player.coord.start_x;
                } else {
                    move_y = current_player.coord.start_y + 1;
                    move_x = current_player.coord.start_x;
                }
            }
        } else {
            if (direction == "right") {
                move_y = current_player.coord.start_y;
                move_x = current_player.coord.start_x + 1;
            } else if (direction == "left") {
                move_y = current_player.coord.start_y;
                move_x = current_player.coord.start_x - 1;
            }
        }

        current_direction = direction;
        coord = `${move_y}_${move_x}`;
        movement_array.push(coord);
    }
}


function clear_path() {
    unset_disabled_button_status();
    for (let i = 0; i < movement_array.length; i++) {
        let td_ship_el = document.getElementById(`${movement_array[i]}`);
        let e_target = td_ship_el.querySelector('div>span');
        e_target.classList.remove('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
        e_target.textContent = "";
    }
    movement_array.splice(0, movement_array.length);
    clean_previous_preview_position(ship_arrival_coordinates);
}

function set_disabled_center_button_status(is_disabled) {
    let top = document.querySelector('#move-top');
    let bottom = document.querySelector('#move-bottom');
    let left = document.querySelector('#move-left');
    let right = document.querySelector('#move-right');
    let center = document.querySelector('#center')
    let center_i = center.querySelector('i');

    if (is_disabled) {
        center.disabled = true;
        center.classList.add('text-red-600', 'border-red-600', 'disabled-arrow');
        center_i.classList.add('text-red-600');
        center.classList.remove('text-emerald-400', 'active:bg-[#25482D]');
        center_i.classList.remove('text-emerald-400', 'active:text-white');
        top.classList.add('border-b-red-600');
        bottom.classList.add('border-t-red-600');
        left.classList.add('border-r-red-600');
        right.classList.add('border-l-red-600');
    } else {
        center.disabled = false;
        center.classList.remove('text-red-600', 'disabled-arrow');
        center_i.classList.remove('text-red-600');
        center.classList.add('text-emerald-400', 'active:bg-[#25482D]');
        center_i.classList.add('text-emerald-400', 'active:text-white');
        top.classList.remove('border-b-red-600');
        bottom.classList.remove('border-t-red-600');
        left.classList.remove('border-r-red-600');
        right.classList.remove('border-l-red-600');
    }
}

function unset_disabled_button_status() {
    let center = document.querySelector('#center');
    let center_i = center.querySelector('i');
    let top = document.querySelector('#move-top');
    let bottom = document.querySelector('#move-bottom');
    let left = document.querySelector('#move-left');
    let right = document.querySelector('#move-right');
    let direction_icon = document.querySelectorAll('.arrow-icon');
    let direction_element = document.querySelectorAll('.direction-arrow');

    for (let i = 0; i < direction_element.length; i++) {
        direction_element[i].classList.add('bg-gray-800/40', 'border-[#B1F1CB]', 'active:bg-[#25482D]');
        direction_element[i].classList.remove('border-red-600', 'disabled-arrow');
    }

    center.classList.remove('text-red-600', 'disabled-arrow');
    center.classList.add('text-emerald-400');
    center_i.classList.add('text-emerald-400');

    top.disabled = false;
    bottom.disabled = false;
    left.disabled = false;
    right.disabled = false;
    center.disabled = false;

    top.classList.remove('border-b-red-600');
    bottom.classList.remove('border-t-red-600');
    left.classList.remove('border-r-red-600');
    right.classList.remove('border-l-red-600');

    for (let i = 0; i < direction_icon.length; i++) {
        direction_icon[i].classList.remove('text-red-600');
        direction_icon[i].classList.add('text-emerald-400');
    }
}

function disable_button(direction) {
    for (let i = 0; i < direction.length; i++) {
        let button = document.querySelector('#move-' + direction[i]);
        let button_i = button.querySelector('i');

        button.disabled = true;
        button.classList.remove('text-emerald-400', 'border-[#B1F1CB]', 'active:text-white', 'active:bg-[#25482D]');
        button.classList.add('text-red-600', 'disabled-arrow', 'border-red-600');
        button_i.classList.remove('text-emerald-400', 'active:text-white');
        button_i.classList.add('text-red-600');
    }
}


function define_user_values() {
    for (let i = 0; i < map_informations['pc_npc'].length; i++) {
        if (map_informations['pc_npc'][i]['user']['user'] == current_user_id) {

            let start_node_id = document.querySelector('.player-start-pos').id.split('_');
            let ship_size = document.querySelector('.player-start-pos');
            let ship_is_reversed = true ? document.querySelectorAll('.player-ship-reversed')[0].style.display === "block" : false;

            current_player.set_player_id(
                map_informations['pc_npc'][i]['user']['player']
            );

            current_player.set_is_reversed(ship_is_reversed);
            current_player.set_ship_size(
                parseInt(ship_size.getAttribute('size_x')),
                parseInt(ship_size.getAttribute('size_y'))
            );

            // we use start_node_id to get destination coord.
            // we check ship size to define itterator.
            current_player.set_start_coord(
                parseInt(start_node_id[1]),
                parseInt(start_node_id[0]),
            );

        }
    }
}

function define_position_preview(ship_arrival_coordinates, can_be_crossed, direction) {
    for (let i = 0; i < movement_array.length; i++) {
        let td_ship_el = document.getElementById(`${movement_array[i]}`);
        let span_ship_el = td_ship_el.querySelector('span');
        if (!ship_arrival_coordinates.includes(movement_array[i])) {
            span_ship_el.classList.add('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
            span_ship_el.textContent = `${i + 1}`;
        } else {
            span_ship_el.classList.remove('bg-teal-500/30');
            span_ship_el.textContent = "";
        }
    }
    switch (ship_arrival_coordinates.length) {
        case 9:
            for (let i = 0; i < 9; i++) {
                let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                let span_ship_el = td_ship_el.querySelector('span');
                if (span_ship_el) {
                    if (td_ship_el.classList.contains('player-ship-pos')) {
                        span_ship_el.classList.remove('border', 'border-dashed', 'border-2', 'border-green-300', 'hover:border-2', 'hover:border', 'text-white', 'font-bold', 'text-center');
                        span_ship_el.textContent = "";
                    }

                    switch (i) {
                        case 0:
                            span_ship_el.classList.add('border-l', 'border-t');
                            break;
                        case 1:
                            span_ship_el.classList.add('border-t');
                            break;
                        case 2:
                            span_ship_el.classList.add('border-t', 'border-r');
                            break;
                        case 3:
                            span_ship_el.classList.add('border-l');
                            break;
                        case 4:
                            span_ship_el.classList.add('text-white', 'font-bold', 'text-center');
                            span_ship_el.textContent = `${movement_array.length}`;
                            break;
                        case 5:
                            span_ship_el.classList.add('border-r');
                            break;
                        case 6:
                            span_ship_el.classList.add('border-l', 'border-b');
                            break;
                        case 7:
                            span_ship_el.classList.add('border-b');
                            break;
                        case 8:
                            span_ship_el.classList.add('border-r', 'border-b');
                            break;
                        default:
                            break;
                    }
                }
            }
            break;
        case 3:
            for (let i = 0; i < 3; i++) {
                let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
                let span_ship_el = td_ship_el.querySelector('span');
                if (td_ship_el.classList.contains('player-ship-pos')) {
                    span_ship_el.classList.remove('border', 'border-dashed', 'border-2', 'border-green-300');
                    span_ship_el.textContent = "";
                }
                if (i == 0) {
                    span_ship_el.classList.add('border-t', 'border-l', 'border-b');
                    span_ship_el.classList.remove('hover:border-2', 'hover:border');
                } else if (i == 1) {
                    span_ship_el.classList.add('border-t', 'border-b', 'text-white', 'font-bold', 'text-center');
                    span_ship_el.textContent = `${movement_array.length}`;
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
                    span_ship_el.classList.add('border-t', 'border-r', 'border-b', 'text-white', 'font-bold', 'text-center');
                    span_ship_el.textContent = `${movement_array.length}`;
                }
            }
            break;
    }
    if (can_be_crossed == true) {
        set_disabled_center_button_status(false);
        let first_td = document.getElementById(`${ship_arrival_coordinates[0]}`);
        display_ship_start_point = first_td.id.split('_');
        // taking first element of ship_arrival_coordinate to start display new ship pos
        // + 1 to match add_sector_elements.js display of pc / npc rows[] cells[];
        current_player.set_end_coord(parseInt(display_ship_start_point[1]) + 1, parseInt(display_ship_start_point[0]) + 1);
        for (let i = 0; i < ship_arrival_coordinates.length; i++) {
            let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
            let span_ship_el = td_ship_el.querySelector('span');
            if (span_ship_el) {
                span_ship_el.classList.remove('bg-teal-500/30', 'border-dashed');
                if (ship_arrival_coordinates.length == 1) {
                    span_ship_el.classList.add('text-white', 'font-bold', 'text-center')
                    span_ship_el.textContent = `${movement_array.length}`;
                }
                span_ship_el.classList.add('bg-amber-400/50', 'border-amber-400');
            }
        }
    } else {
        set_disabled_center_button_status(true);
        for (let i = 0; i < ship_arrival_coordinates.length; i++) {
            let uncrossable_td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`)
            let uncrossable_span_ship_el = uncrossable_td_ship_el.querySelector('span');
            if (uncrossable_span_ship_el) {
                uncrossable_span_ship_el.classList.remove('bg-teal-500/30', 'border-dashed');
                uncrossable_span_ship_el.classList.add('bg-red-600/50', 'border-red-600');
                if (ship_arrival_coordinates.length == 1) {
                    uncrossable_span_ship_el.classList.add('text-white', 'font-bold', 'text-center')
                    uncrossable_span_ship_el.textContent = `${movement_array.length}`;
                }
            }
        }
    }
    // set real coordinates
    current_player.set_selected_cell_bool(true);
}

function clean_previous_preview_position(ship_arrival_coordinates) {
    for (let i = 0; i < ship_arrival_coordinates.length; i++) {
        let e = document.getElementById(ship_arrival_coordinates[i]);
        let e_span = e.querySelector('span');
        e_span.textContent = "";
        e_span.classList.remove(
            'border-t',
            'border-b',
            'border-l',
            'border-r',
            'border-red-600',
            'border-amber-400',
            'bg-red-600/50',
            'bg-amber-400/50',
            'text-white',
            'font-bold',
            'text-center'
        );
    }
    ship_arrival_coordinates.splice(0, ship_arrival_coordinates.length);
}

function movement_already_exists(coord) {
    return movement_array.includes(coord);
}

function delete_last_destination(coord) {
    let e = document.getElementById(movement_array[movement_array.length - 1]);
    let e_span = e.querySelector('span');
    e_span.classList.remove(
        'bg-teal-500/30'
    );
    e_span.textContent = "";
    for (let i = 0; i < ship_arrival_coordinates.length; i++) {
        let e = document.getElementById(ship_arrival_coordinates[i]);
        let e_span = e.querySelector('span');
        e_span.textContent = "";
        e_span.classList.remove(
            'border-t',
            'border-b',
            'border-l',
            'border-r',
            'border-red-600',
            'border-amber-400',
            'bg-red-600/50',
            'bg-amber-400/50',
            'text-white',
            'font-bold',
            'text-center'
        );
    }

    movement_array.pop();
}

function mobile_movement_action() {
    let e = document.querySelector('#center');
    if (e && e.disabled == false) {
        current_player.set_fullsize_coordinates(ship_arrival_coordinates);
        let player_coord_array = Array.prototype.slice.call(document.querySelectorAll('.player-ship-pos')).map(function(element) {
            return element.id;
        });
        direction_array.slice(0, -1);
        async_move({
            player: current_player.player,
            end_x: current_player.coord.end_x,
            end_y: current_player.coord.end_y,
            is_reversed: current_player.reversed_ship_status,
            start_id_array: player_coord_array,
            destination_id_array: current_player.fullsize_coordinate,
        });
    }
}