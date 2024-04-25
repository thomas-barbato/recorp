let pathfinder_obj = {};
let cell_already_clicked = false;


let current_player = new Player(
    0,
    0,
    10,
)


function display_pathfinding() {
    let player_span = pathfinder_obj.player_cell.querySelector('div>span');
    player_span.classList.add('box-border', 'border-2', 'border');

    if (current_player.selected_cell_bool === false) {
        for (let i = 0; i < pathfinder_obj.path.length; i++) {

            let td_el = pathfinder_obj.graph.rows[pathfinder_obj.path[i].x + 1].cells[pathfinder_obj.path[i].y + 1];
            let span_el = td_el.querySelector('span');
            span_el.classList.add('text-white', 'font-bold', 'text-center');

            if (i <= current_player.move_points_value) {
                span_el.classList.add('bg-teal-500/30');
                current_player.set_end_coord(
                    pathfinder_obj.path[i].x + 1,
                    pathfinder_obj.path[i].y + 1
                );
            } else {
                span_el.classList.add('bg-red-600/30');
            }

            span_el.textContent = i + 1;
        }

        current_player.set_selected_cell_bool(true);
    } else {
        async_move({
            start_y: current_player.coord.start_y + 1,
            start_x: current_player.coord.start_x + 1,
            end_y: current_player.coord.end_x,
            end_x: current_player.coord.end_y
        });
        //ship_end_pos.innerHTML = ship_start_pos.innerHTML;
        //ship_start_pos.innerHTML = "";
        current_player.set_selected_cell_bool(false);
    }


}

function get_pathfinding(e) {
    cleanCss();

    for (let i = 0; i < map_informations['pc_npc'].length; i++) {
        if (map_informations['pc_npc'][i]['user']['user'] == current_user_id) {

            let id = e.parentNode.parentNode.id.split('_');
            let grid_container = document.querySelector('.tabletop-view');

            current_player.set_start_coord(
                map_informations['pc_npc'][i]['user']['coordinates'].coord_x,
                map_informations['pc_npc'][i]['user']['coordinates'].coord_y,
            )
            current_player.set_end_coord(
                parseInt(id[1]),
                parseInt(id[0])
            )

            current_player.set_selected_cell_bool(false);

            let opts = {
                grid_size: { cols: atlas.col, rows: atlas.row },
                grid_start: {
                    y: current_player.coord.start_y,
                    x: current_player.coord.start_x,
                },
                grid_goal: {
                    y: current_player.coord.end_y,
                    x: current_player.coord.end_x
                },
                css: {
                    start: "start-player-pos",
                    finish: "finish",
                    wall: "uncrossable",
                    active: "active"
                },
                debug: false,
                closest: true
            };

            let grid = grid_container.rows[opts.grid_goal.y + 1].cells[opts.grid_goal.x + 1];
            if (grid.classList.contains(opts.css.wall)) {
                return;
            }
            pathfinding(grid_container, opts);

        }
    }
}

function cleanCss() {
    let pf_zone = document.querySelectorAll('.pathfinding-zone');
    for (let i = 0; i < pf_zone.length; i++) {
        pf_zone[i].classList.remove('bg-teal-500/30', 'bg-red-600/30', 'finish', 'box-border', 'border-2', 'border', 'text-white', 'font-bold', 'text-center');
        pf_zone[i].textContent = "";
    }
}

function pathfinding(graph, opts) {
    this.graph = graph;
    this.opts = opts;
    this.search = astar.search;
    this.performance = window.performance;
    this.css = opts.css;
    this.new_graph = new GraphSearch(this.graph, this.opts, this.search, this.css);
}

function GraphSearch(graph, options, css) {
    this.gs_graph = graph;
    this.gs_opts = options;
    this.gs_css = css;
    this.initialize();
}

GraphSearch.prototype.initialize = function() {
    this.gs_grid = [];
    let self = this;
    let nodes = [];
    let node_row = [];
    let cell_weight = 0;


    // prepare graph, from object to array.
    for (let row_i = 0; row_i < this.gs_opts.grid_size.rows; row_i++) {
        this.gs_grid[row_i] = []
        node_row = [];
        for (let col_i = 0; col_i < this.gs_opts.grid_size.cols; col_i++) {
            this.gs_graph.rows[row_i + 1].cells[col_i + 1].classList.remove("finish");
            // add wall (weight: 15)
            if (this.gs_graph.rows[row_i + 1].cells[col_i + 1].classList.contains("uncrossable")) {
                node_row.push(15);
            } else {
                // define cell weigth
                node_row.push(Math.floor(Math.random() * 3) * 2 + 1);
            }
            // define end path
            if (row_i == this.gs_opts.grid_goal.y && col_i == this.gs_opts.grid_goal.x) {
                this.gs_graph.rows[row_i + 1].cells[col_i + 1].classList.add(this.gs_css.finish);
            }
            this.gs_grid[row_i].push(this.gs_graph.rows[row_i + 1].cells[col_i + 1]);
        }
        nodes.push(node_row);
    }

    this.temp_graph = new Graph(nodes);
    self.cellOnMouseHover();
};

GraphSearch.prototype.cellOnMouseHover = function() {

    this.end = this.nodeFromElement(this.gs_opts.grid_goal);
    this.start = this.nodeFromElement(this.gs_opts.grid_start);
    var path = astar.search(this.temp_graph, this.start, this.end, this.gs_opts);

    if (path.length === 0) {
        return;
    }

    this.setPathfindingObject(path);
};

GraphSearch.prototype.nodeFromElement = function(arg) {
    return this.temp_graph.grid[parseInt(arg.y)][parseInt(arg.x)];
};

GraphSearch.prototype.setPathfindingObject = function(path) {
    pathfinder_obj = {
        path: path,
        graph: this.gs_graph,
        player_cell: this.gs_graph.rows[this.gs_opts.grid_start.y + 1].cells[this.gs_opts.grid_start.x + 1],
    };
};

function pathTo(node) {
    var curr = node;
    var path = [];
    while (curr.parent) {
        path.unshift(curr);
        curr = curr.parent;
    }
    return path;
}

function getHeap() {
    return new BinaryHeap(function(node) {
        return node.f;
    });
}



var astar = {
    /**
    * Perform an A* Search on a graph given a start and end node.
    * @param {Graph} graph
    * @param {GridNode} start
    * @param {GridNode} end
    * @param {Object} [options]
    * @param {bool} [options.closest] Specifies whether to return the
            path to the closest node if the target is unreachable.
    * @param {Function} [options.heuristic] Heuristic function (see
    *          astar.heuristics).
    */
    search: function(graph, start, end, options) {
        graph.cleanDirty();
        options = options || {};
        var heuristic = astar.heuristics.manhattan;
        var closest = options.closest;
        var openHeap = getHeap();
        var closestNode = start; // set the start node to be the closest if required

        start.h = heuristic(start, end);
        graph.markDirty(start);

        openHeap.push(start);

        while (openHeap.size() > 0) {

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            var currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentNode === end) {
                return pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            var neighbors = graph.neighbors(currentNode);

            for (var i = 0, il = neighbors.length; i < il; ++i) {
                var neighbor = neighbors[i];

                if (neighbor.closed || neighbor.isWall()) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                var gScore = currentNode.g + neighbor.getCost(currentNode);
                var beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    graph.markDirty(neighbor);
                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                            closestNode = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    } else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        if (closest) {
            return pathTo(closestNode);
        }

        // No result was found - empty array signifies failure to find path.
        return [];
    },
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
    heuristics: {
        manhattan: function(pos0, pos1) {
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        }
    },
    cleanNode: function(node) {
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.visited = false;
        node.closed = false;
        node.parent = null;
    }
};

/**
 * A graph memory structure
 * @param {Array} gridIn 2D array of input weights
 * @param {Object} [options]
 */
function Graph(gridIn, options) {
    options = options || {};
    this.nodes = [];
    this.grid = [];
    for (var y = 0; y < gridIn.length; y++) {
        this.grid[y] = [];

        for (var x = 0, row = gridIn[y]; x < row.length; x++) {
            var node = new GridNode(y, x, row[x]);
            this.grid[y][x] = node;
            this.nodes.push(node);
        }
    }
    this.init();
}

Graph.prototype.init = function() {
    this.dirtyNodes = [];
    for (var i = 0; i < this.nodes.length; i++) {
        astar.cleanNode(this.nodes[i]);
    }
};

Graph.prototype.cleanDirty = function() {
    for (var i = 0; i < this.dirtyNodes.length; i++) {
        astar.cleanNode(this.dirtyNodes[i]);
    }
    this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
    this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
    var ret = [];
    var x = node.x;
    var y = node.y;
    var grid = this.grid;

    // West
    if (grid[x - 1] && grid[x - 1][y]) {
        ret.push(grid[x - 1][y]);
    }

    // East
    if (grid[x + 1] && grid[x + 1][y]) {
        ret.push(grid[x + 1][y]);
    }

    // South
    if (grid[x] && grid[x][y - 1]) {
        ret.push(grid[x][y - 1]);
    }

    // North
    if (grid[x] && grid[x][y + 1]) {
        ret.push(grid[x][y + 1]);
    }

    return ret;
};

Graph.prototype.toString = function() {
    var graphString = [];
    var nodes = this.grid;
    for (var x = 0; x < nodes.length; x++) {
        var rowDebug = [];
        var row = nodes[x];
        for (var y = 0; y < row.length; y++) {
            rowDebug.push(row[y].weight);
        }
        graphString.push(rowDebug.join(" "));
    }
    return graphString.join("\n");
};

function GridNode(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
}

GridNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
    // Take diagonal weight into consideration.
    if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
        return this.weight * 1.41421;
    }
    return this.weight;
};

GridNode.prototype.isWall = function() {
    return this.weight === 0;
};

function BinaryHeap(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    },
    pop: function() {
        // Store the first element so we can return it later.
        var result = this.content[0];
        // Get the element at the end of the array.
        var end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    },
    remove: function(node) {
        var i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    },
    size: function() {
        return this.content.length;
    },
    rescoreElement: function(node) {
        this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function(n) {
        // Fetch the element that has to be sunk.
        var element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

            // Compute the parent element's index, and fetch it.
            var parentN = ((n + 1) >> 1) - 1;
            var parent = this.content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                // Update 'n' to continue at the new position.
                n = parentN;
            }
            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    },
    bubbleUp: function(n) {
        // Look up the target element and its score.
        var length = this.content.length;
        var element = this.content[n];
        var elemScore = this.scoreFunction(element);

        while (true) {
            // Compute the indices of the child elements.
            var child2N = (n + 1) << 1;
            var child1N = child2N - 1;
            // This is used to store the new position of the element, if any.
            var swap = null;
            var child1Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                var child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                var child2 = this.content[child2N];
                var child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
            // Otherwise, we are done.
            else {
                break;

            }
        }
    }
};