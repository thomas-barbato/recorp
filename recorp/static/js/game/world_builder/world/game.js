let gameSocket = "";
const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);

let atlas = {
    "col": 40,
    "row": 40,
    "tilesize": 32,
    "map_width_size": 40 * 32,
    "map_height_size": 40 * 32,
}

function user_is_on_mobile_device() {
    return (
        /\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod|KFAPWI)\b/i.test(window.navigator.userAgent)
    );
}

function reverse_player_ship_display() {
    var ids = Array.prototype.slice.call(document.querySelectorAll('.player-ship-pos')).map(function(element) {
        return element.id;
    });

    return async_reverse_ship({
        user: current_user_id,
        id_array: ids,
    });
}

window.addEventListener('load', () => {
    let room = map_informations.sector.id;
    let ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    gameSocket = new WebSocket(
        ws_scheme +
        '://' +
        window.location.host +
        "/ws/play_" +
        room +
        "/"
    );

    gameSocket.onopen = function() {
        console.log("connected");
    };

    gameSocket.onclose = function() {
        console.log("WebSocket connection closed unexpectedly. Trying to reconnect in 1s...");
        setTimeout(function() {
            console.log("Reconnecting...");
            var gameSocket = new WebSocket(
                ws_scheme +
                '://' +
                window.location.host +
                "/ws/play_" +
                room +
                "/"
            );
        }, 1000);
    };

    add_sector_background(map_informations.sector.image);
    add_sector_foreground(map_informations.sector_element);
    add_pc_npc(map_informations.pc_npc);

    gameSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        switch (data.type) {
            case "player_move":
                update_player_coord(data.message);
                break;
            case "async_reverse_ship":
                reverse_ship(data.message);
                break;
            case "player_attack":
                update_ship_after_attack(data.message);
                break;
            case "send_message":
                //sendMessage(data);
                break;
            case "user_leave":
                //userLeave(data);
                break;
            default:
                break;
        }
    };

});

window.addEventListener('DOMContentLoaded', () => {
    update_target_coord_display();
})