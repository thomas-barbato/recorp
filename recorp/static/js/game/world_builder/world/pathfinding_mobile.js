let movement_array = [];
let ship_arrival_coordinates = []

let mobile_current_player = new Player(
    null,
    null,
    null,
    10,
)


function display_pathfinding_mobile(direction) {
    touchstart_btn_style(direction);
    unset_disabled_button_status();
    define_user_values();
    add_to_movement_array(direction);
    movement_already_exists(movement_array[movement_array.length - 1]);
    let last_coord = movement_array[movement_array.length - 1].split('_');
    // fix display for 3x3 ship, move start in the middle.
    mobile_current_player.set_end_coord(
        parseInt(last_coord[1]),
        parseInt(last_coord[0]),
    );

    if (mobile_current_player.move_points_value >= movement_array.length) {
        clean_previous_preview_position(ship_arrival_coordinates);

        let can_be_crossed = true;
        let last_td_ship_el = document.getElementById(`${mobile_current_player.coord.end_y}_${mobile_current_player.coord.end_x}`);

        if (last_td_ship_el) {
            let last_span_el = last_td_ship_el.querySelector('span');
            last_span_el.classList.add('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
            last_span_el.textContent = movement_array.length;

            for (let row_i = mobile_current_player.coord.end_y; row_i < (mobile_current_player.coord.end_y + mobile_current_player.s_size.y); row_i++) {
                for (let col_i = mobile_current_player.coord.end_x; col_i < (mobile_current_player.coord.end_x + mobile_current_player.s_size.x); col_i++) {
                    let td_ship_el = document.getElementById(`${row_i}_${col_i}`);
                    if (td_ship_el) {
                        let temp_row_i = row_i;
                        let temp_col_i = col_i;
                        if (mobile_current_player.s_size.y == 3) {
                            temp_row_i = row_i - 1;
                        }
                        if (mobile_current_player.s_size.x == 3) {
                            temp_col_i = col_i - 1;
                        }
                        ship_arrival_coordinates.push(`${temp_row_i}_${temp_col_i}`);
                        // check outbound
                        if (col_i >= 39 || row_i >= 39 || td_ship_el.classList.contains('uncrossable') && !td_ship_el.classList.contains('player-ship-pos')) {
                            if (col_i > 39) {
                                disable_button('right');
                                can_be_crossed = false;
                            } else if (col_i < 1) {
                                disable_button('left');
                                can_be_crossed = false;
                            } else if (col_i == 39) {
                                disable_button('right');
                                can_be_crossed = true;
                            } else if (col_i == 1) {
                                disable_button('left');
                                can_be_crossed = true;
                            } else {
                                can_be_crossed = true;
                            }

                            if (row_i > 39) {
                                disable_button('bottom');
                                can_be_crossed = false;
                            } else if (row_i < 1) {
                                disable_button('top');
                                can_be_crossed = false;
                            } else if (row_i == 39) {
                                can_be_crossed = true;
                                disable_button('right');
                            } else if (row_i == 1) {
                                disable_button('top');
                                can_be_crossed = true;
                            } else {
                                can_be_crossed = true;
                            }
                        }
                    } else {
                        can_be_crossed = false;
                    }
                }
            }
            define_position_preview(ship_arrival_coordinates, can_be_crossed);
        } else {
            clean_previous_preview_position(ship_arrival_coordinates);
        }
    } else {
        set_disabled_center_button_status(true);
    }
}

function add_to_movement_array(direction) {
    let modified_y = 0;
    let modified_x = 0;
    let move_y = mobile_current_player.coord.start_y;
    let move_x = mobile_current_player.coord.start_x;
    let last_position = 0;
    let coord = 0;
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
        last_position = movement_array[(movement_array.length - 1)].split('_');
        move_y = parseInt(last_position[0]) + modified_y;
        move_x = parseInt(last_position[1]) + modified_x;
        coord = `${move_y}_${move_x}`
        if (!movement_already_exists(coord)) {
            movement_array.push(coord);
        } else {
            delete_last_destination(coord);
        }
    } else {
        movement_array.push(`${ move_y }_${ move_x }`);
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
    movement_array.splice(0, movement_array.length)
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
        center.classList.remove('text-emerald-400');
        center_i.classList.remove('text-emerald-400');
        top.classList.add('border-b-red-600');
        bottom.classList.add('border-t-red-600');
        left.classList.add('border-r-red-600');
        right.classList.add('border-l-red-600');
    } else {
        center.disabled = false;
        center.classList.remove('text-red-600', 'disabled-arrow');
        center_i.classList.remove('text-red-600');
        center.classList.add('text-emerald-400');
        center_i.classList.add('text-emerald-400');
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
        direction_element[i].classList.add('bg-gray-800/40', 'border-[#B1F1CB]');
        direction_element[i].classList.remove('border-red-600', 'disabled-arrow');
    }

    center.classList.remove('text-red-600');
    center.classList.add('text-emerald-400');
    center_i.classList.remove('text-emerald-400');
    center.classList.remove('text-red-600', 'disabled-arrow');

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
    let button = document.querySelector('#move-' + direction);
    let button_i = button.querySelector('i');

    button.disabled = true;
    button.classList.remove('text-emerald-400', 'border-[#B1F1CB]');
    button.classList.add('text-red-600', 'disabled-arrow', 'border-red-600');
    button_i.classList.remove('text-emerald-400');
    button_i.classList.add('text-red-600');
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

function define_position_preview(ship_arrival_coordinates, can_be_crossed) {
    for (let i = 0; i < movement_array.length - 1; i++) {
        if (!ship_arrival_coordinates.includes(movement_array[i])) {
            let td_ship_el = document.getElementById(`${movement_array[i]}`);
            let span_ship_el = td_ship_el.querySelector('span');
            span_ship_el.classList.add('bg-teal-500/30', 'text-white', 'font-bold', 'text-center');
            span_ship_el.textContent = `${i + 1}`;
        }
    }
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
    if (can_be_crossed == true) {
        for (let i = 0; i < ship_arrival_coordinates.length; i++) {
            let td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`);
            let span_ship_el = td_ship_el.querySelector('span');
            span_ship_el.textContent = "";
            span_ship_el.classList.remove('bg-teal-500/30');
            span_ship_el.classList.add('bg-amber-400/50', 'border-amber-400');
        }
        // set real coordinates
        current_player.set_fullsize_coordinates(ship_arrival_coordinates);
        current_player.set_selected_cell_bool(true);
    } else {
        for (let i = 0; i < ship_arrival_coordinates.length; i++) {
            let uncrossable_td_ship_el = document.getElementById(`${ship_arrival_coordinates[i]}`)
            let uncrossable_span_ship_el = uncrossable_td_ship_el.querySelector('span');
            uncrossable_span_ship_el.textContent = "";
            uncrossable_span_ship_el.classList.remove('bg-teal-500/30', 'border-dashed');
            uncrossable_span_ship_el.classList.add('bg-red-600/50', 'border-red-600');
        }
    }
}

function clean_previous_preview_position(ship_arrival_coordinates) {
    for (let i = 0; i < ship_arrival_coordinates.length; i++) {
        let e = document.getElementById(ship_arrival_coordinates[i]);
        let e_span = e.querySelector('span');
        e_span.classList.remove(
            'border-t',
            'border-b',
            'border-l',
            'border-r',
            'border-red-600',
            'border-amber-400',
            'bg-red-600/50',
            'bg-amber-400/50',
        );
    }
    ship_arrival_coordinates.splice(0, ship_arrival_coordinates.length)
}

function movement_already_exists(coord) {
    return movement_array.includes(coord);
}

function delete_last_destination(coord) {
    let index = movement_array.findIndex(x => x == coord);
    for (let i = index; i < movement_array.length; i++) {
        let e = document.getElementById(movement_array[i]);
        let e_span = e.querySelector('span');
        e_span.classList.remove(
            'bg-teal-500/30'
        );
        e_span.textContent = "";
    }
    for (let i = 0; i < ship_arrival_coordinates.length; i++) {
        let e = document.getElementById(ship_arrival_coordinates[i]);
        let e_span = e.querySelector('span');
        e_span.classList.remove(
            'border-t',
            'border-b',
            'border-l',
            'border-r',
            'border-red-600',
            'border-amber-400',
            'bg-red-600/50',
            'bg-amber-400/50',
        );
    }

    movement_array.splice(index, movement_array.length, coord);
    ship_arrival_coordinates.splice(0, ship_arrival_coordinates.length);
}

function touchstart_btn_style(direction) {
    let e = document.querySelector('#move-' + direction);
    e.classList.remove('bg-gray-800/50');
    e.classList.add('bg-[#25482D]');
};

function touchend_btn_style(element_id) {
    let e = document.querySelector('#move-' + element_id);
    e.classList.remove('bg-[#25482D]');
    e.classList.add('bg-gray-800/50');

}