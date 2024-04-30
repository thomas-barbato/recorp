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
    console.log("x = " + data["message"]["start_x"] + " y = " + data["message"]["start_y"]);
    let entry_point = document.querySelector('.tabletop-view').rows[data["message"]["start_y"]].cells[data["message"]["start_x"]];
    let end_point = document.querySelector('.tabletop-view').rows[data["message"]["end_y"]].cells[data["message"]["end_x"]];
    let player_name = entry_point.querySelector('div>span').title.split(' ')[0];
    let inbetween_pos = end_point.innerHTML;

    end_point.innerHTML = entry_point.innerHTML;
    entry_point.innerHTML = inbetween_pos;

    entry_point.querySelector('div>span').title = `${map_informations["sector"]["name"]} [x = ${parseInt(current_player.coord.start_y)}; y = ${parseInt(current_player.coord.start_x)}]`;
    end_point.title = `[${player_name} [x = ${parseInt(data["message"]["end_x"])} y = ${parseInt(data["message"]["end_x"])}]`;
    end_point.classList.add('pc', 'uncrossable');

}