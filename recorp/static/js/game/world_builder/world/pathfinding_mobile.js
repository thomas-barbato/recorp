let movement_array = [];

let mobile_current_player = new Player(
    null,
    null,
    null,
    10,
)

for (let i = 0; i < map_informations['pc_npc'].length; i++) {
    if (map_informations['pc_npc'][i]['user']['user'] == current_user_id) {
        mobile_current_player.set_player_id(
            map_informations['pc_npc'][i]['user']['player']
        );
    }
}

function display_pathfinding_mobile(direction) {
    let start_node_id = document.querySelector('.player-start-pos').id.split('_');
    let ship_size = document.querySelector('.player-start-pos');
    let ship_is_reversed = true ? document.querySelectorAll('.player-ship-reversed')[0].style.display === "block" : false;

    mobile_current_player.set_is_reversed(ship_is_reversed);
    mobile_current_player.set_ship_size(
        parseInt(ship_size.getAttribute('size_x')),
        parseInt(ship_size.getAttribute('size_y'))
    );

    // we use start_node_id to get destination coord.
    // we check ship size to define itterator.
    if (mobile_current_player.s_size.x == 1 && mobile_current_player.s_size.y == 1) {
        mobile_current_player.set_start_coord(
            parseInt(start_node_id[1]) + 1,
            parseInt(start_node_id[0]),
        );
    } else if (mobile_current_player.s_size.x == 2 && mobile_current_player.s_size.y == 1) {
        if (mobile_current_player.reversed_ship_status == true) {
            mobile_current_player.set_start_coord(
                parseInt(start_node_id[1]) + 2,
                parseInt(start_node_id[0]) + 1,
            );
        } else {
            mobile_current_player.set_start_coord(
                parseInt(start_node_id[1]) + 1,
                parseInt(start_node_id[0]) + 1,
            );
        }
    } else if (mobile_current_player.s_size.x == 3 && mobile_current_player.s_size.y == 1) {
        if (mobile_current_player.reversed_ship_status == true) {
            mobile_current_player.set_start_coord(
                parseInt(start_node_id[1]),
                parseInt(start_node_id[0]) + 1,
            );
        } else {
            mobile_current_player.set_start_coord(
                parseInt(start_node_id[1]) + 2,
                parseInt(start_node_id[0]) + 1,
            );
        }
    } else if (mobile_current_player.s_size.x == 3 && mobile_current_player.s_size.y == 3) {
        if (mobile_current_player.reversed_ship_status == true) {
            mobile_current_player.set_start_coord(
                parseInt(start_node_id[1]),
                parseInt(start_node_id[0]) + 1,
            );
        } else {
            mobile_current_player.set_start_coord(
                parseInt(start_node_id[1]) + 2,
                parseInt(start_node_id[0]) + 1,
            );

        }
    }

    add_to_movement_array(direction)

    for (let i = 0; i < movement_array.length; i++) {
        console.log(movement_array);
        let e = document.getElementById(`${movement_array[i]}`);
        let e_target = e.querySelector('div>span');
        e_target.classList.add('bg-red-500');
        console.log(e_target)
    }



}



function add_to_movement_array(direction) {
    let modified_y = 0;
    let modified_x = 0;

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
    if (movement_array.length > 0) {
        let last_position = movement_array[movement_array.length - 1].split('_');
        movement_array.push(`${ parseInt(last_position[0]) + modified_y }_${ parseInt(last_position[1]) + modified_x }`);
    } else {
        movement_array.push(`${ parseInt(mobile_current_player.coord.start_y)}_${ parseInt(mobile_current_player.coord.start_x)}`);
    }

}

function remove_from_movement_array() {

}