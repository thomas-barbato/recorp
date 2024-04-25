class Player {
    constructor(start_x, start_y, move_points) {
        this.start_x = start_x;
        this.start_y = start_y;
        this.end_x = 0;
        this.end_y = 0;
        this.move_points = move_points;
        this.selected_cell = false;
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