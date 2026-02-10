import { computeDistance } from "./distance.js";

export function computeModuleRangeCheck({
    actor,
    target,
    module
}) {
    if (!actor || !target || !module) {
        throw new Error("computeModuleRangeCheck: missing data");
    }

    const distance = computeDistance({
        from: actor,
        to: target
    });

    const baseRange = module.range ?? 0;

    // règle actuelle
    const targetSize = target.sizeX ?? 1;
    const sizePenalty = Math.floor((targetSize - 1) / 2);

    const effectiveRange = Math.max(0, baseRange - sizePenalty);

    return {
        distance,
        effectiveRange,
        inRange: distance <= effectiveRange
    };
}