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

let user_is_on_mobile_bool = is_user_is_on_mobile_device()

let attribute_touch_touch_mouseover = user_is_on_mobile_bool === true ? 'touchstart' : 'mouseover';
let attribute_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'onclick';
let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';


function fade_effect(target, timer) {
    var fadeTarget = target;
    var fadeEffect = setInterval(function () {
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 1;
        }
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity -= 0.05;
        } else {
            clearInterval(fadeEffect);
            fadeTarget.remove();
        }
    }, timer);
}

function color_per_percent(current_val, max_val){
    
    let current_percent =`${Math.round((current_val * 100) / (max_val))}`;

    let status = "";

    if(current_percent == 100){
        status = "FULL";
    }else if(current_percent < 100 && current_percent >= 75){
        status = "ALMOST FULL";
    }else if(current_percent < 75 && current_percent >= 50){
        status = "AVERAGE";
    }else if(current_percent < 50 && current_percent >= 25){
        status = "BELOW AVERAGE";
    }else{
        status = "LOW";
    }

    let actual_stat = {
        "FULL": "text-emerald-400",
        "ALMOST FULL": "text-lime-300",
        "AVERAGE": "text-yellow-400",
        "BELOW AVERAGE": "text-orange-400",
        "LOW": "text-red-600"
    };

    return { 
        "status": status, 
        "color": actual_stat[status]
    }
}

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

    generate_sector(
        map_informations.sector.image,
        map_informations.sector_element, 
        map_informations.npc, 
        map_informations.pc
    );

    

    window.onresize = function(event) {
        let user_id = document.querySelector('.player-ship-start-pos').id.split('_');
        setTimeout(() => {
            hide_sector_overflow(user_id[1], user_id[0]);
            if (!is_user_is_on_mobile_device()) {
                set_pathfinding_event();
            }
        }, "300");
    };

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
            case "async_travel":
                player_travel(data.message);
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