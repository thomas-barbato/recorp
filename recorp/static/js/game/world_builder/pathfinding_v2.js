function set_path_coord_v2(e) {
    let id = e.parentNode.parentNode.id.split('_');
    end_coord_x = parseInt(id[1]) + 1;
    end_coord_y = parseInt(id[0]) + 1;

    for (let i = 0; i < map_informations['pc_npc'].length; i++) {
        if (map_informations['pc_npc'][i]['user_id'] == current_user_id) {
            start_coord_x = map_informations['pc_npc'][i]['coordinates']['coord_x'] + 1;
            start_coord_y = map_informations['pc_npc'][i]['coordinates']['coord_y'] + 1;
            break;
        }
    }

    let grid_container = document.querySelector('.tabletop-view').querySelector('tbody');
    let new_path = new check_path(grid_container);
    //grid = new GraphSearch(grid_container, opts, astar.search);
}

function check_path(grid_container) {
    this.grid = grid_container;
    this.cleanFinishStatment();
    this.init();
}

check_path.prototype.init = function() {
    let self = this;
    self.end = self.setAndGetFinish();
    this.start = self.getStartCell();
    this.setDirection();
}

check_path.prototype.cleanFinishStatment = function() {
    let tile = this.grid.querySelectorAll('.tile');
    for (let i = 0; i < tile.length; i++) {
        tile[i].classList.remove('finish');
    }
}

check_path.prototype.getStartCell = function() {
    return this.grid.rows[end_coord_y].cells[end_coord_x];
}

check_path.prototype.setAndGetFinish = function() {
    let end = this.grid.rows[end_coord_y].cells[end_coord_x];
    end.classList.add('finish');
    return end
}

check_path.prototype.setDirection = function() {
    console.log(start_coord_y, end_coord_y);
    if (start_coord_y > end_coord_y) {
        if (start_coord_x > end_coord_x) {
            console.log("haut gauche");
        } else if (start_coord_x < end_coord_x) {
            console.log("haut droite");
        } else {
            console.log("haut centre")
        }
    } else if (start_coord_y < end_coord_y) {
        if (start_coord_x < end_coord_x) {
            console.log("bas droite");
        } else if (start_coord_x > end_coord_x) {
            console.log("bas gauche");
        } else {
            console.log("bas centre");
        }
    } else {
        if (start_coord_y == end_coord_y) {
            if (start_coord_x > end_coord_x) {
                console.log("meme niveau gauche");
            } else if (start_coord_x < end_coord_x) {
                console.log("meme niveau droite");
            }
        }
    }
}