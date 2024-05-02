// ASYNC GAME LOGIC

function async_move(pos) {
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "player": pos.player,
            "end_x": pos.end_x,
            "end_y": pos.end_y,
            "start_x": pos.start_x,
            "start_y": pos.start_y
        }),
        type: "async_move"
    }));
}

function update_player_coord(data) {
    console.log(data)
    let entry_point = document.getElementById(`${data["start_y"]}_${data["start_x"]}`);
    let end_point = document.getElementById(`${data["end_y"]}_${data["end_x"]}`);
    console.log(entry_point);
    console.log(end_point);
    let player_name = entry_point.querySelector('div>span').title.split(' ')[0];
    let inbetween_pos = end_point.innerHTML;

    end_point.innerHTML = entry_point.innerHTML;
    entry_point.innerHTML = inbetween_pos;

    entry_point.querySelector('div>span').title = `${map_informations["sector"]["name"]} [x = ${parseInt(data["start_x"]) - 1}; y = ${parseInt(data["start_y"]) - 1}]`;
    end_point.querySelector('div>span').title = `[${player_name} [x = ${parseInt(data["end_x"])} y = ${parseInt(data["end_y"])}]`;
    end_point.classList.add('pc', 'uncrossable');
    entry_point.classList.remove('pc', 'uncrossable');
}