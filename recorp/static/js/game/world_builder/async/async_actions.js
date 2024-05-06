// ASYNC GAME LOGIC

function async_move(pos) {
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "player": pos.player,
            "end_x": pos.end_x,
            "end_y": pos.end_y,
        }),
        type: "async_move"
    }));
}

function update_player_coord(data) {
    let entry_point = document.querySelectorAll('.pc');
    let player_name = data["player"]
    for (let i = 0; i < entry_point.length; i++) {
        if (entry_point[i].querySelector('span').title.split(' ')[0] == player_name) {
            let end_point = document.querySelector('tbody').rows[`${data["end_y"]}`].cells[`${data["end_x"]}`];
            let player_name = entry_point[i].querySelector('div>span').title.split(' ')[0];
            let inbetween_pos = end_point.innerHTML;

            end_point.innerHTML = entry_point[i].innerHTML;
            entry_point[i].innerHTML = inbetween_pos;

            entry_point[i].querySelector('div>span').title = `${map_informations["sector"]["name"]} [x = ${parseInt(data["start_x"]) - 1}; y = ${parseInt(data["start_y"]) - 1}]`;
            end_point.querySelector('div>span').title = `[${player_name} [x = ${parseInt(data["end_x"])} y = ${parseInt(data["end_y"])}]`;
            end_point.classList.add('pc', 'uncrossable');
            entry_point[i].classList.remove('pc', 'uncrossable');
            console.log(entry_point[i])
            console.log(end_point)
        }
    }

}