// Affichage du chemin de pathfinding sur canvas-ui (style C SF + numéros)

export function renderPathfinding(ctx, camera, pathfinder) {
    if (!pathfinder || !pathfinder.path || pathfinder.path.length === 0) {
        return;
    }

    const tilePx = camera.tileSize * (camera.zoom || 1);

    const isLast = (idx, len) => idx === len - 1;

    ctx.save();
    ctx.font = "12px Orbitron, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    pathfinder.path.forEach((node, idx) => {
        const screen = camera.worldToScreen(node.x, node.y);
        const x = screen.x;
        const y = screen.y;
        const w = tilePx;
        const h = tilePx;

        const centerX = x + w / 2;
        const centerY = y + h / 2;

        const isTarget = isLast(idx, pathfinder.path.length);

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
