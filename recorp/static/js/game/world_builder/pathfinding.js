function get_pathfinding(e) {
    for (let i = 0; i < map_informations['pc_npc'].length; i++) {
        if (map_informations['pc_npc'][i]['user_id'] == current_user_id) {

            let id = e.parentNode.parentNode.id.split('_');
            let end_coord_x = parseInt(id[1]) + 1;
            let end_coord_y = parseInt(id[0]) + 1;
            let grid_container = document.querySelector('.tabletop-view');
            let grid_class = grid_container.rows[end_coord_y].cells[end_coord_x];

            if (grid_class.classList.contains('uncrossable') || grid_class.classList.contains('start-player-pos')) {
                return;
            }

            let start_coord_x = map_informations['pc_npc'][i]['coordinates']['coord_x'] + 1;
            let start_coord_y = map_informations['pc_npc'][i]['coordinates']['coord_y'] + 1;
            let pr = new pathfinding(grid_container, start_coord_x, start_coord_y, end_coord_x, end_coord_y);
            break;
        }
    }
}

function pathfinding(grid_container, start_x, start_y, end_x, end_y) {
    this.grid = grid_container;
    this.map_size = {
        map_rows: atlas.row,
        map_cols: atlas.col,
    };
    this.index_col = 1;
    this.index_row = 1;
    this.state = { x: start_x, y: start_y };
    this.goal = { x: end_x, y: end_y };
    this.path = [];
    this.init();
}

pathfinding.prototype.init = function() {
    let self = this;
    this.obstacles = self.getObstacles();
    this.aStar(this.state, this.goal);
    this.displayGrid(this.path);
}

pathfinding.prototype.getObstacles = function() {
    let obstacles = [];
    for (let row_i = 0; row_i < this.map_size.map_rows; row_i++) {
        for (let col_i = 0; col_i < this.map_size.map_cols; col_i++) {
            let cell = this.grid.rows[row_i].cells[col_i];
            if (cell.classList.contains('uncrossable') || cell.classList.contains('player-start-pos')) {
                obstacles.push({ y: row_i, x: col_i, width: 1, height: 1 });
            }
        }
    }
    return obstacles;
}

pathfinding.prototype.isObstacle = function(y, x) {
    return this.obstacles.find(o => o.y == y && o.x == x);
}

pathfinding.prototype.heuristic = function(state) {
    // Calculate the number of steps required to reach the goal, using the Manhattan distance formula
    let dy = Math.abs(state.y - this.goal.y);
    let dx = Math.abs(state.x - this.goal.x);
    let penalty = this.pathIntersectsObstacle(state, this.goal, this.obstacles) * 10
    return Math.sqrt(dy * dy + dx * dx) + penalty;
}

pathfinding.prototype.pathIntersectsObstacle = function(start, end) {
    // Convert the starting and ending coordinates to grid coordinates
    let { y: startY, x: startX } = start;
    let { y: endY, x: endX } = end;

    // Get the coordinates of all points on the path
    this.path = this.getPath(startY, startX, endY, endX);

    //get the points in the array that are within the list of obstacles
    let instersections = this.path.filter(point => !!this.obstacles.find(o => o.y == point[0] && o.x == point[1])).length
    return instersections
}

pathfinding.prototype.aStar = function(start, goal) {
    // Create an empty data structure to store the explored paths
    let explored = [];
    // Create a data structure to store the paths that are being explored
    let frontier = [{
        state: start,
        cost: 0,
        estimate: this.heuristic(start)
    }];


    // While there are paths being explored
    while (frontier.length > 0) {
        // Sort the paths in the frontier by cost, with the lowest-cost paths first
        frontier.sort(function(a, b) {
            return a.estimate - b.estimate;
        });

        // Choose the lowest-cost path from the frontier
        let node = frontier.shift();

        // Add this nodeto the explored paths
        explored.push(node);
        // If this nodereaches the goal, return thenode 
        if (node.state.x == goal.x && node.state.y == goal.y) {
            return explored
        }

        // Generate the possible next steps from this node's state
        let next = this.generateNextSteps(node.state);

        // For each possible next step
        for (let i = 0; i < next.length; i++) {
            // Calculate the cost of the next step by adding the step's cost to the node's cost
            let step = next[i];
            let cost = step.cost + node.cost;

            // Check if this step has already been explored
            let isExplored = (explored.find(e => {
                return e.state.x == step.state.x &&
                    e.state.y == step.state.y
            }))

            //avoid repeated nodes during the calculation of neighbors
            let isFrontier = (frontier.find(e => {
                return e.state.x == step.state.x &&
                    e.state.y == step.state.y
            }))


            // If this step has not been explored
            if (!isExplored && !isFrontier) {
                // Add the step to the frontier, using the cost and the heuristic function to estimate the total cost to reach the goal
                frontier.push({
                    state: step.state,
                    cost: cost,
                    estimate: cost + this.heuristic(step.state)
                });
            }
        }
    }

    // If there are no paths left to explore, return null to indicate that the goal cannot be reached
    return null;
}


// Define the function to generate the possible next steps from a given state
pathfinding.prototype.generateNextSteps = function(state) {
    // Define an array to store the next steps
    let next = [];

    // Check if the current state has any valid neighbors
    if (state.x > 0) {
        // If the current state has a neighbor to the left, add it to the array of next steps
        if (!this.isObstacle(state.x - 1, state.y)) {
            next.push({
                state: { x: state.x - 1, y: state.y },
                cost: 1
            });
        }
    }
    if (state.x < this.map_size.map_cols - 1) {
        // If the current state has a neighbor to the right, add it to the array of next steps
        if (!this.isObstacle(state.x + 1, state.y)) {
            next.push({
                state: { x: state.x + 1, y: state.y },
                cost: 1
            });
        }
    }
    if (state.y > 0) {
        // If the current state has a neighbor above it, add it to the array of next steps
        if (!this.isObstacle(state.x, state.y - 1)) {
            next.push({
                state: { x: state.x, y: state.y - 1 },
                cost: 1
            });
        }
    }
    if (state.y < this.map_size.map_rows - 1) {
        // If the current state has a neighbor below it, add it to the array of next steps
        if (!this.isObstacle(state.x, state.y + 1)) {
            next.push({
                state: { x: state.x, y: state.y + 1 },
                cost: 1
            });
        }
    }

    // Return the array of next steps
    return next;
}


pathfinding.prototype.getPath = function(startX, startY, endX, endY) {
    // Initialize an empty array to store the coordinates of the points on the path
    let path = [];

    // Use the Bresenham's line algorithm to get the coordinates of the points on the path
    let x1 = startX,
        y1 = startY,
        x2 = endX,
        y2 = endY;
    let isSteep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    if (isSteep) {
        [x1, y1] = [y1, x1];
        [x2, y2] = [y2, x2];
    }
    let isReversed = false;
    if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
        isReversed = true;
    }
    let deltax = x2 - x1,
        deltay = Math.abs(y2 - y1);
    let error = Math.floor(deltax / 2);
    let y = y1;
    let ystep = null;
    if (y1 < y2) {
        ystep = 1;
    } else {
        ystep = -1;
    }
    for (let x = x1; x <= x2; x++) {
        if (isSteep) {
            path.push([y, x]);
        } else {
            path.push([x, y]);
        }
        error -= deltay;
        if (error < 0) {
            y += ystep;
            error += deltax;
        }
    }

    // If the line is reversed, reverse the order of the points in the path
    if (isReversed) {
        path = path.reverse();
    }

    return path;
}


// Define a function to display the grid and the nodeon the screen
pathfinding.prototype.displayGrid = function(path) {
    // Create a two-dimensional array to represent the grid
    // using this.index_row and this.index_col to ignore [0][0]
    let grid = [];
    for (let row_i = 0; row_i < this.map_size.map_rows; row_i++) {
        grid[row_i] = [];
        for (let col_i = 0; col_i < this.map_size.map_cols; col_i++) {
            grid[row_i][col_i] = " . ";
        }
    }

    // Mark the starting and goal states on the grid
    grid[this.state.y][this.state.x] = " S ";
    this.obstacles.forEach(obs => {
        grid[obs.y][obs.x] = " - ";
        if (this.grid.rows[obs.y].cells[obs.x].classList.contains("player-start-pos")) {
            grid[obs.y][obs.x] = " G ";
        }
    });

    // Mark the path on the grid
    let finished = false;
    let sortedPath = path.sort((a, b) => a.estimate - b.estimate);
    let currentCost = 0;
    let costs = [];
    while (!finished) {
        let step = sortedPath.shift();
        if (step.state.y == this.goal.y && step.state.x == this.goal.x) {
            finished = true;
        } else {
            if (!costs.includes(step.cost)) {
                grid[step.state.y][step.state.x] = " X ";
                costs.push(step.cost);
            }
        }
        currentCost++
    }

    // Print the grid to the console
    for (let y = 0; y < map_size.map_rows; y++) {
        let line = "";
        for (let x = 0; x < map_size.map_cols; x++) {
            line += grid[y][x];
        }
        console.log(line)
    }
}