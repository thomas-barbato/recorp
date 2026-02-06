window.computeModuleRange = function ({ module, transmitterActor, receiverActor }) {
    const maxRange = module.effect?.range ?? 0;

    console.log(module.name, "range check", { transmitterActor, receiverActor, maxRange });

    // fallback de sécurité
    if (!window.canvasEngine?.gameWorker) {
        const distance = computeTooltipDistance(transmitterActor, receiverActor);
        return {
            allowed: distance <= maxRange,
            distance,
            maxRange
        };
    }
    
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
        .then(distance => {
            return {
                allowed: distance <= maxRange,
                distance,
                maxRange
            };
        });
};
