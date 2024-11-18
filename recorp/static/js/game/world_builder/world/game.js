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


function set_range_finding(target_id, player_id, max_range, ship_size_y, ship_size_x, other_ship_size_y, other_ship_size_x) {
    let player = player_id.split('_');
    let target = target_id.split('_');

    let player_y = parseInt(player[0]);
    let player_x = parseInt(player[1]);
    let target_y = parseInt(target[0]);
    let target_x = parseInt(target[1]);
    let can_be_attacked = false;
    let ship_gap_x_right = 1;
    let ship_gap_x_left = 1;
    let ship_gap_y_top = 1;
    let ship_gap_y_bottom = 1;
    let other_ship_start_x = 0;
    let other_ship_end_x = 0;
    let other_ship_start_y = 0;
    let other_ship_end_y = 0;

    if (ship_size_x == 3 && ship_size_y == 3) {
        ship_gap_x_right = 3;
        ship_gap_y_bottom = 3;
    } else if (ship_size_x == 3 && ship_size_y == 1) {
        ship_gap_x_right = 3;
    } else if (ship_size_x == 2 && ship_size_y == 1) {
        ship_gap_x_right = 2;
    }

    let target_zone = []

    if (other_ship_size_y == 1 && other_ship_size_x == 1) {
        target_zone.push(`${target_y}_${target_x}`)
    } else {
        if (other_ship_size_x == 3 && other_ship_size_y == 3) {
            other_ship_end_x = 3;
            other_ship_end_y = 3;
        } else if (other_ship_size_x == 3 && other_ship_size_y == 1) {
            other_ship_end_x = 3;
            other_ship_end_y = 1;
        } else if (other_ship_size_x == 2 && other_ship_size_y == 1) {
            other_ship_end_x = 2;
            other_ship_end_y = 1;
        }
        for (let y = (target_y - other_ship_start_y); y < (target_y + other_ship_end_y); y++) {
            for (let x = (target_x - other_ship_start_x); x < (target_x + other_ship_end_x); x++) {
                target_zone.push(`${y}_${x}`)
            }
        }
    }

    let start_y = (player_y - max_range - ship_gap_y_top) + 1 > 0 ? (player_y - max_range - ship_gap_y_top) + 1 : 0;
    let end_y = (player_y + max_range + ship_gap_y_bottom) < atlas.row ? (player_y + max_range + ship_gap_y_bottom) : atlas.row;
    let start_x = (player_x - max_range - ship_gap_x_left) + 1 > 0 ? (player_x - max_range - ship_gap_x_left) + 1 : 0;
    let end_x = (player_x + max_range + ship_gap_x_right) < atlas.col ? (player_x + max_range + ship_gap_x_right) : atlas.col;

    for (let y = start_y; y < end_y; y++) {
        for (let x = start_x; x < end_x; x++) {
            let coord = `${y}_${x}`;
            if (target_zone.includes(coord)) {
                can_be_attacked = true;
                break;
            }
        }
    }
    return can_be_attacked;
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