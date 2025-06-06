let gameSocket = "";
const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);
let user_is_on_mobile_bool = is_user_is_on_mobile_device()
let attribute_touch_mouseover = user_is_on_mobile_bool === true ? 'touchstart' : 'mouseover';
let attribute_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'onclick';
let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';
let logout = document.querySelectorAll('.logout');

for(const button of logout){
    button.addEventListener(action_listener_touch_click, function(){
        let logout_submit_btn = button.querySelector('#logout-btn');
        logout_submit_btn.click();
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
        console.log("You are now connected");
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
    

    gameSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        switch (data.type) {
            case "player_move":
                update_player_coord(data.message);
                break;
            case "async_reverse_ship":
                console.log("async_reverse_ship !")
                reverse_ship(data.message);
                break;
            case "player_attack":
                update_ship_after_attack(data.message);
                break;
            case "async_remove_ship":
                remove_ship_display(data.message)
                break;
            case "user_join":
                add_pc([data.message]);
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