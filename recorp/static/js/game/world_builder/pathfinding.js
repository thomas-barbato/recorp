const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);

const opts = {
    debug: false,
    diagonal: true,
    closest: true
};

let end_coord_x = 0;
let end_coord_y = 0

let start_coord_x = 0;
let start_coord_y = 0;

let css = {
    success: "bg-green-500/50",
    failure: "bg-red-600/50"
};

let grid = [];

function set_path_coord(e) {
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
    //grid = new GraphSearch(grid_container, opts, astar.search);
}

let performance = window.performance;

function GraphSearch(graph, options, implementation) {
    this.graph = graph;
    this.search = implementation;
    this.opts = options;
    this.initialize();
}
/*
GraphSearch.prototype.setOption = function(opts) {
    this.opts = opts;
    this.drawDebugInfo();
};*/

GraphSearch.prototype.initialize = function() {
    let self = this;
    self.clearFinishClass();
    let end_cell = document.querySelectorAll('.tile').rows[end_coord_y].cells[end_coord_x];
    nodes = Object.entries(this.graph.querySelectorAll('.tile'));
    console.log(typeof nodes)
    this.graph = new Graph(nodes);
    self.cellOnMouseHover(end_cell);
};

GraphSearch.prototype.cellOnMouseHover = function(end_cell) {

    if (end_cell.classList.contains('uncrossable') || end_cell.classList.contains('player-start-pos')) {
        return;
    }
    end_cell.classList.add("finish");
    let start_cell = this.graph.rows[start_coord_y].cells[start_coord_x];
    var sTime = performance ? performance.now() : new Date().getTime();
    var path = this.search(this.graph, start_cell, end_cell, {
        closest: opts.closest
    });
}

GraphSearch.prototype.nodeFromElement = function(cell) {
    return this.graph.grid[parseInt(cell.attr("x"))][parseInt(cell.attr("y"))];
};

GraphSearch.prototype.clearFinishClass = function() {
    let tile = document.querySelectorAll('.tile');
    for (let i = 0; i < tile.length; i++) {
        tile[i].classList.remove('finish');
    }
}