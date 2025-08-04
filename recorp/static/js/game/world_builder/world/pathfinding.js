// Variables globales
let pathfinder_obj = {};
let cell_already_clicked = false;
let current_player = new Player(null, null, null);
let pathfinding_path_before_preview_zone_len = 1;

// Configuration des styles CSS
const CSS_CLASSES = {
    TEAL_ZONE: 'teal-zone',
    BG_TEAL: 'bg-teal-500/30',
    BG_RED: 'bg-red-600/50',
    BG_AMBER: 'bg-amber-400/50',
    BORDER_AMBER: 'border-amber-400',
    BORDER_RED: 'border-red-600',
    ANIMATE_PULSE: 'animate-pulse',
    TEXT_WHITE: 'text-white',
    FONT_BOLD: 'font-bold',
    TEXT_CENTER: 'text-center',
    BORDER: 'border',
    BORDER_2: 'border-2',
    BORDER_DASHED: 'border-dashed',
    BORDER_ORANGE: 'border-orange-400',
    BORDER_CYAN: 'border-cyan-400',
    HOVER_BORDER: 'hover:border-2',
    HOVER_BORDER_SIMPLE: 'hover:border'
};

const GRID_CONSTANTS = {
    MAX_SIZE: 41,
    WALL_WEIGHT: 15,
    MIN_WEIGHT: 1,
    MAX_WEIGHT: 7
};

// Configuration des événements de pathfinding
function set_pathfinding_event() {
    const pathfindingTiles = document.querySelectorAll(".tile:not(.hidden):not(.uncrossable)");
    
    pathfindingTiles.forEach(tile => {
        const pathfindingZone = tile.querySelector('.pathfinding-zone');
        if (pathfindingZone && isValidPathfindingTile(tile)) {
            pathfindingZone.setAttribute('onmouseover', 'get_pathfinding(this)');
            pathfindingZone.setAttribute('onclick', 'display_pathfinding()');
        }
    });
}

function isValidPathfindingTile(tile) {
    const invalidClasses = ['uncrossable', 'hidden', 'pc', 'npc'];
    return !invalidClasses.some(className => tile.classList.contains(className));
}

// Affichage du pathfinding
function display_pathfinding() {
    const playerSpan = pathfinder_obj.player_cell.querySelector('div>span');
    playerSpan.classList.add('box-border', CSS_CLASSES.BORDER_2, CSS_CLASSES.BORDER);

    if (!current_player.selected_cell_bool) {
        handlePathfindingDisplay();
    } else {
        handlePlayerMovement();
    }
}

function handlePathfindingDisplay() {
    pathfinding_path_before_preview_zone_len = 0;
    
    pathfinder_obj.path.forEach((pathNode, index) => {
        const cellElement = getCellElement(pathNode);
        const spanElement = cellElement.querySelector('span');
        
        clearPathNodeStyles(spanElement);
        
        if (index < current_player.move_points_value) {
            processValidPathNode(spanElement, index);
        } else {
            processInvalidPathNode(spanElement, index);
        }
    });
}

function getCellElement(pathNode) {
    return pathfinder_obj.graph.rows[pathNode.x].cells[pathNode.y];
}

function clearPathNodeStyles(spanElement) {
    spanElement.classList.remove(CSS_CLASSES.BORDER, CSS_CLASSES.BORDER_2);
}

function processValidPathNode(spanElement, index) {
    if (index < pathfinder_obj.path.length - 1) {
        displayPathStep(spanElement, index);
    } else {
        displayShipPreview(index);
    }
}

function displayPathStep(spanElement, index) {
    if (current_player.move_points_value === 0) {
        applyRedPathStyle(spanElement);
    } else {
        applyTealPathStyle(spanElement);
    }
    spanElement.textContent = index + 1;
}

function applyRedPathStyle(spanElement) {
    spanElement.classList.add(CSS_CLASSES.BG_RED, CSS_CLASSES.BORDER_RED, 
        CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD, CSS_CLASSES.TEXT_CENTER);
}

function applyTealPathStyle(spanElement) {
    spanElement.classList.add(CSS_CLASSES.BG_TEAL, CSS_CLASSES.TEAL_ZONE, 
        CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD, CSS_CLASSES.TEXT_CENTER);
}

function processInvalidPathNode(spanElement, index) {
    spanElement.classList.add(CSS_CLASSES.BG_RED, CSS_CLASSES.BORDER_RED, 
        CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD, CSS_CLASSES.TEXT_CENTER);
    spanElement.textContent = index + 1;
}

function displayShipPreview(pathIndex) {
    const shipCoordinates = calculateShipCoordinates(pathIndex);
    const canBeCrossed = validateShipPlacement(shipCoordinates);
    
    if (canBeCrossed) {
        displayValidShipPreview(shipCoordinates);
        updatePlayerCoordinates(pathIndex, shipCoordinates);
    } else {
        displayInvalidShipPreview(shipCoordinates);
        current_player.set_selected_cell_bool(false);
    }
    
    applyShipBorders(shipCoordinates);
}

function calculateShipCoordinates(pathIndex) {
    const coordinates = [];
    const lastPathNode = pathfinder_obj.path[pathIndex];
    
    for (let row = lastPathNode.x; row < lastPathNode.x + current_player.s_size.y; row++) {
        for (let col = lastPathNode.y; col < lastPathNode.y + current_player.s_size.x; col++) {
            coordinates.push(`${row-1}_${col-1}`);
        }
    }
    
    return coordinates;
}

function validateShipPlacement(coordinates) {
    return coordinates.every(coord => {
        const element = document.getElementById(coord);
        if (!element) return false;
        
        const [row, col] = coord.split('_').map(Number);
        return col < GRID_CONSTANTS.MAX_SIZE && 
            row < GRID_CONSTANTS.MAX_SIZE && 
            !element.classList.contains('uncrossable') && 
            !element.classList.contains('ship-pos') && 
            current_player.move_points !== 0;
    });
}

function displayValidShipPreview(coordinates) {
    coordinates.forEach(coord => {
        const element = document.getElementById(coord);
        const spanElement = element.querySelector('span');
        
        spanElement.classList.remove(CSS_CLASSES.BG_TEAL, CSS_CLASSES.BORDER_DASHED, CSS_CLASSES.TEAL_ZONE);
        spanElement.classList.add(CSS_CLASSES.BG_AMBER, CSS_CLASSES.BORDER_AMBER, 
        CSS_CLASSES.ANIMATE_PULSE, CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD, CSS_CLASSES.TEXT_CENTER);
        spanElement.textContent = "";
    });
}

function displayInvalidShipPreview(coordinates) {
    coordinates.forEach(coord => {
        const element = document.getElementById(coord);
        if (element) {
            const spanElement = element.querySelector('span');
            spanElement.classList.remove(CSS_CLASSES.BG_TEAL, CSS_CLASSES.BORDER_DASHED, CSS_CLASSES.TEAL_ZONE);
            spanElement.classList.add(CSS_CLASSES.BG_RED, CSS_CLASSES.BORDER_RED, 
            CSS_CLASSES.ANIMATE_PULSE, CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD, CSS_CLASSES.TEXT_CENTER);
            spanElement.textContent = "";
        }
    });
}

function updatePlayerCoordinates(pathIndex, coordinates) {
    current_player.set_end_coord(
        pathfinder_obj.path[pathIndex].x,
        pathfinder_obj.path[pathIndex].y
    );
    current_player.set_fullsize_coordinates(coordinates);
    current_player.set_selected_cell_bool(true);
}

function applyShipBorders(coordinates) {
    const tealZoneSize = document.querySelectorAll('.teal-zone').length + 1;
    const shipSize = coordinates.length;
    
    const borderConfigs = {
        9: getBorderConfig9x9(),
        3: getBorderConfig3x1(),
        2: getBorderConfig2x1(),
        1: getBorderConfig1x1()
    };
    
    const config = borderConfigs[shipSize];
    if (config) {
        applyBorderConfiguration(coordinates, config, tealZoneSize);
    }
    
    pathfinding_path_before_preview_zone_len = 1;
}

function getBorderConfig9x9() {
    return [
        { classes: ['border-l', 'border-t'], removeBorder: true },
        { classes: ['border-t'] },
        { classes: ['border-t', 'border-r'] },
        { classes: ['border-l'] },
        { classes: [CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD, CSS_CLASSES.TEXT_CENTER], showCost: true },
        { classes: ['border-r'] },
        { classes: ['border-l', 'border-b'] },
        { classes: ['border-b'] },
        { classes: ['border-r', 'border-b'] }
    ];
}

function getBorderConfig3x1() {
    return [
        { classes: ['border-t', 'border-l', 'border-b'], removeBorder: true },
        { classes: ['border-t', 'border-b'], showCost: true },
        { classes: ['border-t', 'border-r', 'border-b'] }
    ];
}

function getBorderConfig2x1() {
    return [
        { 
            classes: ['border-t', 'border-l', 'border-b'], 
            removeBorder: true,
            showCost: !current_player.reversed_ship_status 
        },
        { 
            classes: ['border-t', 'border-r', 'border-b'],
            showCost: current_player.reversed_ship_status 
        }
    ];
}

function getBorderConfig1x1() {
    return [{ classes: [CSS_CLASSES.BORDER], showCost: true }];
}

function applyBorderConfiguration(coordinates, config, tealZoneSize) {
    coordinates.forEach((coord, index) => {
        const element = document.getElementById(coord);
        const spanElement = element.querySelector('span');
        const borderConfig = config[index];
        
        if (element.classList.contains('ship-pos')) {
            spanElement.classList.remove(CSS_CLASSES.BORDER_DASHED, 
                CSS_CLASSES.BORDER_2, CSS_CLASSES.BORDER_ORANGE);
        }
        
        if (borderConfig.removeBorder) {
            spanElement.classList.remove(CSS_CLASSES.HOVER_BORDER, CSS_CLASSES.HOVER_BORDER_SIMPLE);
        }
        
        spanElement.classList.add(...borderConfig.classes);
        
        if (borderConfig.showCost) {
            spanElement.textContent = tealZoneSize;
            current_player.set_move_cost(tealZoneSize);
        }
    });
}

function handlePlayerMovement() {
    cleanCss();
    current_player.set_selected_cell_bool(false);
    
    // Redéfinir les coordonnées de départ
    current_player.set_start_coord(current_player.coord.end_y, current_player.coord.end_x);
    update_user_coord_display(current_player.coord.start_x, current_player.coord.start_y);
    
    const playerCoordArray = Array.from(document.querySelectorAll('.ship-pos'))
        .map(element => element.id);
    console.log(current_player)
    const moveData = {
        player: current_player_id,
        end_y: current_player.coord.end_x - 1,
        end_x: current_player.coord.end_y - 1,
        size_x : current_player.size_x,
        size_y : current_player.size_y,
        is_reversed: current_player.reversed_ship_status,
        start_id_array: playerCoordArray,
        move_cost: current_player.player_move_cost,
        destination_id_array: current_player.fullsize_coordinate,
    };
    
    async_move(moveData);
}

// Récupération du pathfinding
function get_pathfinding(element) {
    cleanCss();
    
    const shipIsReversed = document.querySelectorAll('.player-ship-reversed')[0].classList.contains('hidden');
    current_player.set_is_reversed(shipIsReversed);
    
    const playerObj = currentPlayer;
    const startNodeId = document.querySelector('.player-ship-start-pos').id.split('_');
    const destinationNodeId = element.parentNode.parentNode.id.split('_');
    const sizeElement = document.querySelector('.player-ship-start-pos');
    const gridContainer = document.querySelector('tbody');
    
    initializePlayer(playerObj, sizeElement, startNodeId, destinationNodeId);
    
    const pathfindingOptions = createPathfindingOptions();
    const targetGrid = gridContainer.rows[pathfindingOptions.grid_goal.y].cells[pathfindingOptions.grid_goal.x];
    
    if (targetGrid?.classList.contains(pathfindingOptions.css.wall)) {
        return;
    }
    
    pathfinding(gridContainer, pathfindingOptions);
}

function initializePlayer(playerObj, sizeElement, startNodeId, destinationNodeId) {
    current_player.set_player_id(playerObj['user']['player']);
    
    const shipSize = {
        x: parseInt(sizeElement.getAttribute('size_x')),
        y: parseInt(sizeElement.getAttribute('size_y'))
    };

    current_player.set_ship_size(shipSize.x, shipSize.y);
    const startCoord = calculateStartCoordinates(startNodeId, shipSize);
    
    current_player.set_start_coord(startCoord.x, startCoord.y);
    
    const endCoord = {
        x: parseInt(destinationNodeId[1]) + 1,
        y: parseInt(destinationNodeId[0]) + 1
    };
    current_player.set_end_coord(endCoord.x, endCoord.y);
    
    current_player.set_selected_cell_bool(false);
}

function calculateStartCoordinates(startNodeId, shipSize) {
    const baseX = parseInt(startNodeId[1]);
    const baseY = parseInt(startNodeId[0]) + 1;
    const sizeConfigs = {
        '1x1': { x: baseX + 1, y: baseY },
        '2x1': current_player.reversed_ship_status 
            ? { x: baseX + 2, y: baseY }
            : { x: baseX + 1, y: baseY },
        '3x1': current_player.reversed_ship_status 
            ? { x: baseX + 2, y: baseY }
            : { x: baseX, y: baseY },
        '3x3': current_player.reversed_ship_status 
            ? { x: baseX + 2, y: baseY }
            : { x: baseX, y: baseY }
    };
    
    const sizeKey = `${shipSize.x}x${shipSize.y}`;
    return sizeConfigs[sizeKey] || { x: baseX + 1, y: baseY };
}

function createPathfindingOptions() {
    return {
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
}

// Nettoyage des styles CSS

function cleanCss() {
    const pathfindingZones = document.querySelectorAll('.pathfinding-zone');
    
    pathfindingZones.forEach(zone => {
        const parent = zone.parentElement.parentElement;
        if (!parent.classList.contains('hidden')) {
            resetZoneStyles(zone);
            applyDefaultStyles(zone, parent);
        }
    });
}

function resetZoneStyles(zone) {
    const classesToRemove = [
        CSS_CLASSES.TEAL_ZONE, CSS_CLASSES.BG_TEAL, CSS_CLASSES.BG_RED,
        CSS_CLASSES.ANIMATE_PULSE, CSS_CLASSES.BG_AMBER, CSS_CLASSES.BORDER_AMBER,
        CSS_CLASSES.BORDER_RED, 'finish', 'box-border', CSS_CLASSES.BORDER_2,
        CSS_CLASSES.BORDER, CSS_CLASSES.TEXT_WHITE, CSS_CLASSES.FONT_BOLD,
        CSS_CLASSES.TEXT_CENTER, 'border-l', 'border-r', 'border-b', 'border-t'
    ];
    
    zone.classList.remove(...classesToRemove);
    zone.textContent = "";
}

function applyDefaultStyles(zone, parent) {
    // uncomment to add border everywhere.
    //zone.classList.add(CSS_CLASSES.HOVER_BORDER, CSS_CLASSES.HOVER_BORDER_SIMPLE);
    
    const styleMap = {
        'player-ship-start-pos': [CSS_CLASSES.BORDER_DASHED, CSS_CLASSES.BORDER_ORANGE],
        'ship-pos': [CSS_CLASSES.BORDER_DASHED, CSS_CLASSES.BORDER_ORANGE],
        'pc': [CSS_CLASSES.BORDER_DASHED, CSS_CLASSES.BORDER_CYAN],
        'npc': [CSS_CLASSES.BORDER_DASHED, CSS_CLASSES.BORDER_RED]
    };
    
    for (const [className, styles] of Object.entries(styleMap)) {
        if (parent.classList.contains(className)) {
            zone.classList.add(...styles);
            break;
        }
    }
}

// Fonction principale de pathfinding
function pathfinding(graph, opts) {
    this.graph = graph;
    this.opts = opts;
    this.search = astar.search;
    this.performance = window.performance;
    this.css = opts.css;
    this.new_graph = new GraphSearch(this.graph, this.opts, this.search, this.css);
}

// Classe GraphSearch
function GraphSearch(graph, options, css) {
    this.gs_graph = graph;
    this.gs_opts = options;
    this.gs_css = css;
    this.initialize();
}

GraphSearch.prototype.initialize = function() {
    this.gs_grid = [];
    const nodes = this.buildNodeGrid();
    this.temp_graph = new Graph(nodes);
    this.cellOnMouseHover();
};

GraphSearch.prototype.buildNodeGrid = function() {
    const nodes = [];
    
    for (let row = 0; row < this.gs_opts.grid_size.rows + 1; row++) {
        this.gs_grid[row] = [];
        const nodeRow = [];
        
        for (let col = 0; col < this.gs_opts.grid_size.cols + 1; col++) {
            const cell = this.gs_graph.rows[row].cells[col];
            cell.classList.remove("finish");
            
            const weight = cell.classList.contains("uncrossable") 
                ? GRID_CONSTANTS.WALL_WEIGHT 
                : Math.floor(Math.random() * 3) * 2 + 1;
            
            nodeRow.push(weight);
            
            if (row === this.gs_opts.grid_goal.y && col === this.gs_opts.grid_goal.x) {
                cell.classList.add(this.gs_css.finish);
            }
            
            this.gs_grid[row].push(cell);
        }
        nodes.push(nodeRow);
    }
    
    return nodes;
};

GraphSearch.prototype.cellOnMouseHover = function() {
    this.end = this.nodeFromElement(this.gs_opts.grid_goal);
    this.start = this.nodeFromElement(this.gs_opts.grid_start);
    const path = astar.search(this.temp_graph, this.start, this.end, this.gs_opts);
    
    if (path.length > 0) {
        this.setPathfindingObject(path);
    }
};

GraphSearch.prototype.nodeFromElement = function(coordinates) {
    return this.temp_graph.grid[parseInt(coordinates.y)][parseInt(coordinates.x)];
};

GraphSearch.prototype.setPathfindingObject = function(path) {
    pathfinder_obj = {
        path: path,
        graph: this.gs_graph,
        player_cell: this.gs_graph.rows[this.gs_opts.grid_start.y].cells[this.gs_opts.grid_start.x],
    };
};

// Fonctions utilitaires
function pathTo(node) {
    const path = [];
    let current = node;
    
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    
    return path;
}

function getHeap() {
    return new BinaryHeap(node => node.f);
}

// Algorithme A*
const astar = {
    search: function(graph, start, end, options = {}) {
        graph.cleanDirty();
        
        const heuristic = astar.heuristics.manhattan;
        const closest = options.closest;
        const openHeap = getHeap();
        let closestNode = start;
        
        start.h = heuristic(start, end);
        graph.markDirty(start);
        openHeap.push(start);
        
        while (openHeap.size() > 0) {
            const currentNode = openHeap.pop();
            
            if (currentNode === end) {
                return pathTo(currentNode);
            }
            
            currentNode.closed = true;
            const neighbors = graph.neighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (neighbor.closed || neighbor.isWall()) {
                    continue;
                }
                
                const gScore = currentNode.g + neighbor.getCost(currentNode);
                const beenVisited = neighbor.visited;
                
                if (!beenVisited || gScore < neighbor.g) {
                    this.updateNeighbor(neighbor, currentNode, heuristic, end, gScore);
                    graph.markDirty(neighbor);
                    
                    if (closest) {
                        closestNode = this.updateClosestNode(neighbor, closestNode);
                    }
                    
                    if (!beenVisited) {
                        openHeap.push(neighbor);
                    } else {
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }
        
        return closest ? pathTo(closestNode) : [];
    },
    
    updateNeighbor: function(neighbor, currentNode, heuristic, end, gScore) {
        neighbor.visited = true;
        neighbor.parent = currentNode;
        neighbor.h = neighbor.h || heuristic(neighbor, end);
        neighbor.g = gScore;
        neighbor.f = neighbor.g + neighbor.h;
    },
    
    updateClosestNode: function(neighbor, closestNode) {
        if (neighbor.h < closestNode.h || 
            (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
            return neighbor;
        }
        return closestNode;
    },
    
    heuristics: {
        manhattan: function(pos0, pos1) {
            return Math.abs(pos1.x - pos0.x) + Math.abs(pos1.y - pos0.y);
        }
    },
    
    cleanNode: function(node) {
        Object.assign(node, {
            f: 0, g: 0, h: 0,
            visited: false, closed: false, parent: null
        });
    }
};

// Classe Graph
function Graph(gridIn, options = {}) {
    this.nodes = [];
    this.grid = [];
    
    for (let y = 0; y < gridIn.length; y++) {
        this.grid[y] = [];
        const row = gridIn[y];
        
        for (let x = 0; x < row.length; x++) {
            const node = new GridNode(y, x, row[x]);
            this.grid[y][x] = node;
            this.nodes.push(node);
        }
    }
    
    this.init();
}

Graph.prototype.init = function() {
    this.dirtyNodes = [];
    this.nodes.forEach(node => astar.cleanNode(node));
};

Graph.prototype.cleanDirty = function() {
    this.dirtyNodes.forEach(node => astar.cleanNode(node));
    this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
    this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1] // West, East, South, North
    ];
    
    return directions
        .map(([dx, dy]) => this.grid[node.x + dx]?.[node.y + dy])
        .filter(Boolean);
};

Graph.prototype.toString = function() {
    return this.grid.map(row => 
        row.map(node => node.weight).join(" ")
    ).join("\n");
};

// Classe GridNode
function GridNode(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
}

GridNode.prototype.toString = function() {
    return `[${this.x} ${this.y}]`;
};

GridNode.prototype.getCost = function(fromNeighbor) {
    // Prise en compte du poids diagonal
    if (fromNeighbor && fromNeighbor.x !== this.x && fromNeighbor.y !== this.y) {
        return this.weight * 1.41421;
    }
    return this.weight;
};

GridNode.prototype.isWall = function() {
    return this.weight === 0;
};

// Classe BinaryHeap
function BinaryHeap(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        this.content.push(element);
        this.sinkDown(this.content.length - 1);
    },
    
    pop: function() {
        const result = this.content[0];
        const end = this.content.pop();
        
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        
        return result;
    },
    
    remove: function(node) {
        const index = this.content.indexOf(node);
        const end = this.content.pop();
        
        if (index !== this.content.length - 1) {
            this.content[index] = end;
            
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(index);
            } else {
                this.bubbleUp(index);
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
        const element = this.content[n];
        
        while (n > 0) {
            const parentN = ((n + 1) >> 1) - 1;
            const parent = this.content[parentN];
            
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            } else {
                break;
            }
        }
    },
    
    bubbleUp: function(n) {
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);
        
        while (true) {
            const child2N = (n + 1) << 1;
            const child1N = child2N - 1;
            let swap = null;
            let child1Score;
            
            if (child1N < length) {
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);
                
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }
            
            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFunction(child2);
                
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }
            
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            } else {
                break;
            }
        }
    }
};