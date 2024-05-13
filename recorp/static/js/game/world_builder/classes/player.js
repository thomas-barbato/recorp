class Player {
    constructor(player_id, start_x, start_y, move_points) {
        this.player_id = player_id;
        this.start_x = start_x;
        this.start_y = start_y;
        this.end_x = 0;
        this.end_y = 0;
        this.ship_size_x = 0;
        this.ship_size_y = 0;
        this.move_points = move_points;
        this.selected_cell = false;
    }

    set_player_id(player_id) {
        this.player_id = player_id;
    }

    set_remaining_move_points(value) {
        if (!isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))) {
            this.move_points = value;
        }
    }

    set_selected_cell_bool(value) {
        this.selected_cell = value;
    }

    set_start_coord(start_x, start_y) {
        this.start_x = start_x;
        this.start_y = start_y;
    }

    set_end_coord(end_x, end_y) {
        this.end_x = end_x;
        this.end_y = end_y;
    }

    set_ship_size(size_x, size_y) {
        this.ship_size_x = size_x;
        this.ship_size_y = size_y;
    }

    get s_size() {
        return {
            "x": this.ship_size_x,
            "y": this.ship_size_y,
        }
    }

    get player() {
        return this.player_id;
    }

    get selected_cell_bool() {
        return this.selected_cell;
    }

    get move_points_value() {
        return this.move_points;
    }

    get coord() {
        return {
            start_x: this.start_x,
            start_y: this.start_y,
            end_x: this.end_x,
            end_y: this.end_y,
        }
    }
}