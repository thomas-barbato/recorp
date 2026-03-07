const INF = 2147483647;

class BinaryHeap {
    constructor() {
        this.content = [];
    }

    clear() {
        this.content.length = 0;
    }

    push(id, score) {
        const node = { id, score };
        this.content.push(node);
        this._sinkDown(this.content.length - 1);
    }

    pop() {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this._bubbleUp(0);
        }
        return result;
    }

    size() {
        return this.content.length;
    }

    _sinkDown(index) {
        const element = this.content[index];
        while (index > 0) {
            const parentIndex = Math.floor((index + 1) / 2) - 1;
            const parent = this.content[parentIndex];
            if (element.score >= parent.score) break;
            this.content[parentIndex] = element;
            this.content[index] = parent;
            index = parentIndex;
        }
    }

    _bubbleUp(index) {
        const length = this.content.length;
        const element = this.content[index];
        while (true) {
            const rightIndex = (index + 1) * 2;
            const leftIndex = rightIndex - 1;
            let swapIndex = null;
            let leftScore = element.score;

            if (leftIndex < length) {
                const left = this.content[leftIndex];
                leftScore = left.score;
                if (leftScore < element.score) {
                    swapIndex = leftIndex;
                }
            }

            if (rightIndex < length) {
                const right = this.content[rightIndex];
                const rightScore = right.score;
                const compareScore = swapIndex === null ? element.score : leftScore;
                if (rightScore < compareScore) {
                    swapIndex = rightIndex;
                }
            }

            if (swapIndex === null) break;
            this.content[index] = this.content[swapIndex];
            this.content[swapIndex] = element;
            index = swapIndex;
        }
    }
}

const state = {
    width: 0,
    height: 0,
    size: 0,
    staticGrid: new Uint8Array(0),
    dynamicGrid: new Uint8Array(0),
    staticVersion: 0,
    dynamicVersion: 0,
    gScore: new Int32Array(0),
    parent: new Int32Array(0),
    seenStamp: new Uint32Array(0),
    closedStamp: new Uint32Array(0),
    searchId: 0,
    heap: new BinaryHeap()
};

function ensureCapacity(width, height) {
    const size = Math.max(0, width * height);
    if (state.width === width && state.height === height && state.size === size) {
        return;
    }

    state.width = width;
    state.height = height;
    state.size = size;
    state.staticGrid = new Uint8Array(size);
    state.dynamicGrid = new Uint8Array(size);
    state.gScore = new Int32Array(size);
    state.parent = new Int32Array(size);
    state.seenStamp = new Uint32Array(size);
    state.closedStamp = new Uint32Array(size);
    state.searchId = 0;
    state.heap.clear();
}

function assertReady() {
    if (!state.width || !state.height || !state.size) {
        throw new Error('Pathfinding worker is not initialized');
    }
}

function toId(x, y) {
    return (y * state.width) + x;
}

function toPoint(id) {
    const x = id % state.width;
    return {
        x,
        y: (id - x) / state.width
    };
}

function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < state.width && y < state.height;
}

function heuristicId(id, destId) {
    const a = toPoint(id);
    const b = toPoint(destId);
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isBlockedId(id) {
    return state.staticGrid[id] !== 0 || state.dynamicGrid[id] !== 0;
}

function beginSearch() {
    state.searchId += 1;
    if (state.searchId === 0) {
        state.seenStamp.fill(0);
        state.closedStamp.fill(0);
        state.searchId = 1;
    }
    state.heap.clear();
    return state.searchId;
}

function touchNode(id, searchId) {
    if (state.seenStamp[id] === searchId) {
        return;
    }
    state.seenStamp[id] = searchId;
    state.gScore[id] = INF;
    state.parent[id] = -1;
}

function reconstructPath(startId, destId) {
    const path = [];
    let currentId = destId;

    while (currentId !== -1) {
        path.push(toPoint(currentId));
        if (currentId === startId) {
            break;
        }
        currentId = state.parent[currentId];
    }

    if (!path.length || currentId === -1) {
        return null;
    }

    path.reverse();
    return path;
}

export function initPathfindingGrid({ width, height, staticGrid, staticVersion = 0 }) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
        throw new Error('initPathfindingGrid: invalid width/height');
    }
    if (!staticGrid || typeof staticGrid.length !== 'number') {
        throw new Error('initPathfindingGrid: missing staticGrid');
    }

    ensureCapacity(width, height);
    if (staticGrid.length !== state.size) {
        throw new Error('initPathfindingGrid: staticGrid size mismatch');
    }

    state.staticGrid = new Uint8Array(staticGrid);
    state.dynamicGrid = new Uint8Array(state.size);
    state.staticVersion = staticVersion;
    state.dynamicVersion = 0;

    return {
        ready: true,
        width: state.width,
        height: state.height,
        staticVersion: state.staticVersion,
        dynamicVersion: state.dynamicVersion
    };
}

export function syncPathfindingDynamic({ dynamicGrid, dynamicVersion = 0 }) {
    assertReady();
    if (!dynamicGrid || typeof dynamicGrid.length !== 'number') {
        throw new Error('syncPathfindingDynamic: missing dynamicGrid');
    }
    if (dynamicGrid.length !== state.size) {
        throw new Error('syncPathfindingDynamic: dynamicGrid size mismatch');
    }

    state.dynamicGrid = new Uint8Array(dynamicGrid);
    state.dynamicVersion = dynamicVersion;

    return {
        ready: true,
        dynamicVersion: state.dynamicVersion
    };
}

export function findPath({ start, dest }) {
    assertReady();
    if (!start || !dest) {
        throw new Error('findPath: missing start/dest');
    }
    if (!inBounds(start.x, start.y) || !inBounds(dest.x, dest.y)) {
        return {
            path: null,
            dynamicVersion: state.dynamicVersion
        };
    }

    const startId = toId(start.x, start.y);
    const destId = toId(dest.x, dest.y);
    const searchId = beginSearch();

    touchNode(startId, searchId);
    state.gScore[startId] = 0;
    state.parent[startId] = -1;
    state.heap.push(startId, heuristicId(startId, destId));

    while (state.heap.size() > 0) {
        const currentNode = state.heap.pop();
        if (!currentNode) break;

        const currentId = currentNode.id;
        if (state.closedStamp[currentId] === searchId) {
            continue;
        }

        if (currentId === destId) {
            return {
                path: reconstructPath(startId, destId),
                dynamicVersion: state.dynamicVersion
            };
        }

        state.closedStamp[currentId] = searchId;

        const current = toPoint(currentId);
        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (const neighbor of neighbors) {
            if (!inBounds(neighbor.x, neighbor.y)) continue;

            const neighborId = toId(neighbor.x, neighbor.y);
            if (state.closedStamp[neighborId] === searchId) continue;
            if (isBlockedId(neighborId)) continue;

            touchNode(neighborId, searchId);

            const tentativeG = state.gScore[currentId] + 1;
            if (tentativeG >= state.gScore[neighborId]) {
                continue;
            }

            state.parent[neighborId] = currentId;
            state.gScore[neighborId] = tentativeG;
            state.heap.push(neighborId, tentativeG + heuristicId(neighborId, destId));
        }
    }

    return {
        path: null,
        dynamicVersion: state.dynamicVersion
    };
}