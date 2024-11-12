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

let action_listener_touch_mouseover = is_user_is_on_mobile_device() === true ? 'touchstart' : 'mouseover';
let action_listener_touch_click = is_user_is_on_mobile_device() === true ? 'touchstart' : 'onclick';

function reverse_player_ship_display() {
    var ids = Array.prototype.slice.call(document.querySelectorAll('.ship-pos')).map(function(element) {
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
            gameSocket = new WebSocket(
                ws_scheme +
                '://' +
                window.location.host +
                "/ws/play_" +
                room +
                "/"
            );
        }, 1000);
    };

    generate_sector(
        map_informations.sector.image,
        map_informations.sector_element, 
        map_informations.npc, 
        map_informations.pc
    );

    if(is_user_is_on_mobile_device() === true){
        create_chat_modal(map_informations.chat_messages);
    }

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