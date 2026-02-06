function getSize(actor) {
    return {
        x: actor.sizeX ?? actor.size?.x ?? 1,
        y: actor.sizeY ?? actor.size?.y ?? 1
    };
}

function getCenter(actor) {
    const size = getSize(actor);
    return {
        x: actor.x + (size.x - 1) / 2,
        y: actor.y + (size.y - 1) / 2
    };
}

export function computeDistance({ from, to }) {
    if (!from || !to) {
        throw new Error("computeDistance: missing from/to");
    }

    const c1 = getCenter(from);
    const c2 = getCenter(to);

    const dx = Math.abs(c1.x - c2.x);
    const dy = Math.abs(c1.y - c2.y);

    return Math.max(dx, dy);
}
