window.computeModuleRange = function ({ module, transmitterActor, receiverActor }) {

    if (!module || !transmitterActor || !receiverActor) {
        return Promise.resolve({
            allowed: false,
            distance: null,
            maxRange: null,
            reason: "missing_data"
        });
    }

    if (
        !module.effect ||
        typeof module.effect.range !== "number"
    ) {
        return Promise.resolve({
            allowed: false,
            distance: null,
            maxRange: null,
            reason: "no_range"
        });
    }

    const maxRange = module.effect.range;

    return window.canvasEngine.gameWorker
        .call("compute_distance", {
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
        })
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
