// ASYNC GAME LOGIC

function async_move(pos) {
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "player": pos.player,
            "end_x": pos.end_x,
            "end_y": pos.end_y,
            "is_reversed": pos.is_reversed,
            "id_array": pos.id_array,
        }),
        type: "async_move"
    }));
}

function async_reverse_ship(data) {
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "user": data.user,
            "id_array": data.id_array,
        }),
        type: "async_reverse_ship"
    }));
}

function update_player_coord(data) {
    let entry_point = document.querySelectorAll('.pc');
    let player_name = data["player"];
    let user_id = data["player_user_id"];
    for (let i = 0; i < entry_point.length; i++) {
        if (entry_point[i].querySelector('span').title == player_name) {

            let end_point = document.querySelector('tbody').rows[`${data["end_y"]}`].cells[`${data["end_x"]}`];
            let player_name = entry_point[i].querySelector('div>span').title;
            let inbetween_pos = end_point.innerHTML;

            end_point.innerHTML = entry_point[i].innerHTML;
            entry_point[i].innerHTML = inbetween_pos;
            entry_point[i].querySelector('div>span').title = `${map_informations["sector"]["name"]} [x = ${parseInt(data["start_x"]) - 1}; y = ${parseInt(data["start_y"]) - 1}]`;

            if (current_user_id != user_id) {

                end_point.querySelector('div>span').title = `${player_name}`;
                end_point.classList.add('pc', 'uncrossable');
                entry_point[i].classList.remove('pc', 'uncrossable');
                update_player_coord_in_cache_array(player_name, { "coord_x": data["end_x"], "coord_y": data["end_y"] })

            } else {
                end_point.setAttribute('onclick', 'reverse_player_ship_display()');
                end_point.setAttribute('size_x', current_player.s_size.x);
                end_point.setAttribute('size_y', current_player.s_size.y);
                end_point.querySelector('div>span').title = `${player_name}`;
                end_point.classList.add('player-start-pos', 'uncrossable', 'pc', 'player-ship-pos');

                // rebinding old start location in title
                entry_point[i].classList.remove('player-start-pos', 'uncrossable', 'pc', 'player-ship-pos');
                entry_point[i].removeAttribute('onclick', 'reverse_player_ship_display()')
                entry_point[i].querySelector('div>span').title = `${map_informations["sector"]["name"]} [x = ${current_player.coord.start_x - 1}; y = ${current_player.coord.start_y - 1}]`;
                entry_point[i].removeAttribute('size_x');
                entry_point[i].removeAttribute('size_y');
            }
        }
    }
}

function update_player_coord_in_cache_array(player_name, coord) {
    for (let i = 0; i < map_informations.pc_npc.length; i++) {
        if (map_informations.pc_npc[i].user.name == player_name) {
            map_informations.pc_npc[i].user.coordinates = coord
        }
    }
}

function reverse_ship(data) {
    let id_list = data["id_array"]
    update_reverse_ship_in_cache_array(data["player_id"], data["is_reversed"])

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
    for (let i = 0; i < map_informations.pc_npc.length; i++) {
        if (map_informations.pc_npc[i].user.player == player_id) {
            map_informations.pc_npc[i].ship.is_reversed = status
        }
    }
}