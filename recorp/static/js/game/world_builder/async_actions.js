gameSocket.onmessage = function(e) {
    console.log(e)
    const data = JSON.parse(e.data);
    switch (data.type) {
        case "player_move":
            console.log("player move ! YES");
            break;
        case "send_message":
            //sendMessage(data);
            break;
        case "player_move":
            //userJoin(data);
            break;
        case "user_leave":
            //userLeave(data);
            break;
        default:
            break;
    }
};

// ASYNC GAME LOGIC

function player_move(pos) {
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "id": current_user_id,
            "pos": pos,
        }),
        type: "player_move"
    }));
}