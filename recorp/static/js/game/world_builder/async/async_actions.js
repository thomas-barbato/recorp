// ASYNC GAME LOGIC

function async_move(pos) {
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "start_x": pos.start_x,
            "start_y": pos.start_y,
            "end_x": pos.end_x,
            "end_y": pos.end_y
        }),
        type: "async_move"
    }));
}

function update_player_coord(data) {
    let coord = data["message"]
    console.log(coord)
    let entry_point = document.querySelector('.tabletop-view').rows[coord.start_y + 1].cells[coord.start_x + 1];
    let end_point = document.querySelector('.tabletop-view').rows[coord.end_y + 1].cells[coord.end_x + 1];
    let player_name = entry_point.querySelector('div>span').title.split(' ')[0]

    end_point.innerHTML = entry_point.innerHTML;
    end_point.title = `[${player_name} [x = ${parseInt(coord.end_x + 1)} y = ${parseInt(coord.end_x + 1)}]`
    entry_point.innerHTML = "";
}