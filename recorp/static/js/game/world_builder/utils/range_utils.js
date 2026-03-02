function getEngine() {
    return window.GameState?.canvasEngine ?? window.canvasEngine ?? null;
}

function getModuleEffectsArray(module) {
    if (Array.isArray(module?.effects)) {
        return module.effects.filter((entry) => entry && typeof entry === "object");
    }
    return [];
}

function getModuleRangeValue(module) {
    const ranges = [];
    for (const effect of getModuleEffectsArray(module)) {
        const raw = effect?.range;
        if (typeof raw === "number" && Number.isFinite(raw)) {
            ranges.push(raw);
        }
    }
    if (!ranges.length) return null;
    return Math.max(...ranges);
}

window.computeActorsDistance = function ({ transmitterActor, receiverActor }) {
    if (!transmitterActor || !receiverActor) {
        return Promise.resolve(null);
    }

    const worker = getEngine()?.gameWorker;
    if (!worker || typeof worker.call !== "function") {
        return Promise.resolve(null);
    }

    return worker.call("compute_distance", {
        from: {
            x: transmitterActor.x,
            y: transmitterActor.y,
            sizeX: transmitterActor.sizeX,
            sizeY: transmitterActor.sizeY
        },
        to: {
            x: receiverActor.x,
            y: receiverActor.y,
            sizeX: receiverActor.sizeX,
            sizeY: receiverActor.sizeY
        }
    });
};

window.computeModuleRange = function ({ module, transmitterActor, receiverActor }) {

    if (!module || !transmitterActor || !receiverActor) {
        return Promise.resolve({
            allowed: false,
            distance: null,
            maxRange: null,
            reason: "missing_data"
        });
    }

    const maxRange = getModuleRangeValue(module);
    if (typeof maxRange !== "number") {
        return Promise.resolve({
            allowed: false,
            distance: null,
            maxRange: null,
            reason: "no_range"
        });
    }

    return window.computeActorsDistance({ transmitterActor, receiverActor })
        .then(distance => ({
            allowed: distance <= maxRange,
            distance,
            maxRange,
            reason: "ok"
        }))
        .catch(err => {
            console.error("computeModuleRange worker error", err);
            return {
                allowed: false,
                distance: null,
                maxRange: null,
                reason: "worker_error"
            };
        });
};
