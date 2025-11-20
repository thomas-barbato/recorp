// Filtre les points teal qui NE SONT PAS dans la zone jaune
function computeLastValidStep(path, destX, destY, sizeX, sizeY) {
    let last = 0;

    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const x = p.x;
        const y = p.y;

        const inside =
            x >= destX &&
            x < destX + sizeX &&
            y >= destY &&
            y < destY + sizeY;

        if (!inside) {
            last = i + 1; // step = index+1
        }
    }
    return last;
}

export function renderPathfinding(ctx, camera, pathfinder) {
    
    if (pathfinder.invalidPreview) {
        return; // on laisse UIRenderer gérer la preview rouge
    }
    if (!pathfinder || !pathfinder.path || pathfinder.path.length === 0) {
        return;
    }

    const tilePx = camera.tileSize * (camera.zoom || 1);

    const dest = pathfinder.path[pathfinder.path.length - 1];
    const shipW = pathfinder.shipSizeX || 1;
    const shipH = pathfinder.shipSizeY || 1;

    const lastTealStep = computeLastValidStep(
        pathfinder.path,
        dest.x,
        dest.y,
        shipW,
        shipH
    );

    const isLast = (idx, len) => idx === len - 1;

    ctx.save();
    ctx.font = "12px Orbitron, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    pathfinder.path.forEach((node, idx) => {
        const insideYellow =
            node.x >= dest.x &&
            node.x < dest.x + shipW &&
            node.y >= dest.y &&
            node.y < dest.y + shipH;

        if (insideYellow && idx !== pathfinder.path.length - 1) {
            return; // on ne dessine pas cette tuile teal
        }
        const screen = camera.worldToScreen(node.x, node.y);
        const x = screen.x;
        const y = screen.y;
        const w = tilePx;
        const h = tilePx;

        const centerX = x + w / 2;
        const centerY = y + h / 2;

        const isTarget = isLast(idx, pathfinder.path.length);
        if (isTarget) {
            const rectW = w * shipW;
            const rectH = h * shipH;

            // Rectangle jaune à la place d’un carré 1×1
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(251, 191, 36, 0.9)";
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "rgba(251, 191, 36, 0.95)";
            ctx.fillStyle = "rgba(251, 191, 36, 0.45)";

            // Rectangle arrondi
            roundedRectPath(ctx, x + 3, y + 3, rectW - 6, rectH - 6, 6);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // NUMÉRO FINAL AU CENTRE DU RECTANGLE JAUNE
            const centerX = x + rectW / 2;
            const centerY = y + rectH / 2;

            const finalLabel = lastTealStep + 1; // numérique final

            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(250, 250, 250, 0.9)";
            ctx.fillStyle = "#FEFCE8";
            ctx.strokeStyle = "rgba(15,23,42,0.9)";
            ctx.lineWidth = 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `${Math.floor(tilePx * 0.55)}px Orbitron, sans-serif`;

            ctx.strokeText(finalLabel, centerX, centerY);
            ctx.fillText(finalLabel, centerX, centerY);

            ctx.restore();

            return; // IMPORTANT → éviter que le reste du code redessine
        }

        // -----------------------
        // Fond SF + glow
        // -----------------------
        const baseAlpha = isTarget ? 0.45 : 0.30;
        const borderAlpha = isTarget ? 0.95 : 0.7;

        ctx.save();
        ctx.shadowBlur = isTarget ? 20 : 12;
        ctx.shadowColor = isTarget
            ? "rgba(251, 191, 36, 0.9)"    // amber pour la destination
            : "rgba(45, 212, 191, 0.6)";  // teal pour le chemin

        ctx.lineWidth = isTarget ? 2.5 : 1.5;
        ctx.strokeStyle = isTarget
            ? `rgba(251, 191, 36, ${borderAlpha})` // amber-400
            : `rgba(45, 212, 191, ${borderAlpha})`; // teal-400

        ctx.fillStyle = isTarget
            ? `rgba(251, 191, 36, ${baseAlpha})`
            : `rgba(45, 212, 191, ${baseAlpha})`;

        const radius = 6;

        roundedRectPath(ctx, x + 3, y + 3, w - 6, h - 6, radius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // -----------------------
        // Numéro du step
        // -----------------------
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = isTarget
            ? "rgba(250, 250, 250, 0.9)"
            : "rgba(34, 197, 94, 0.9)";

        ctx.fillStyle = isTarget ? "#FEFCE8" : "#ECFEFF"; // texte clair
        ctx.strokeStyle = "rgba(15,23,42,0.9)"; // outline sombre (slate-900)
        ctx.lineWidth = 2;

        const label = String(node.index ?? idx + 1);

        // Outline
        ctx.strokeText(label, centerX, centerY);
        // Texte
        ctx.fillText(label, centerX, centerY);

        ctx.restore();
    });

    ctx.restore();
}

// Petit utilitaire pour faire des rectangles arrondis
function roundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
