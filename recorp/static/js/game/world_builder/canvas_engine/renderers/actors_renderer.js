// world/actors_renderer.js
// dessine players/NPC, selection/halo pour le joueur courant et animations simples

export default class ActorsRenderer {
    constructor(ctx, camera, spriteManager, map) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
        this._time = 0;
    }

    render(delta = 0) {
        this._time += delta;
        const tilePx = this.camera.tileSize * this.camera.zoom;

        //
        // --- PLAYERS ---
        //
        this.map.players.forEach(p => {
            const scr = this.camera.worldToScreen(p.x, p.y);
            const pxW = p.sizeX * tilePx;
            const pxH = p.sizeY * tilePx;

            const src = this.spriteManager.makeUrl(p.spritePath);
            const img = this.spriteManager.get(src);
            const reversed = p.data?.ship?.is_reversed;

            if (!img) {
                this.ctx.fillStyle = '#f59e0b';
                this.ctx.fillRect(scr.x, scr.y, pxW, pxH);
                this.spriteManager.ensure(src).catch(()=>{});
            } else if (!reversed) {
                // normal
                this.ctx.drawImage(img, scr.x, scr.y, pxW, pxH);
            } else {
                // --- flip horizontal canvas ---
                this.ctx.save();
                this.ctx.translate(scr.x + pxW, scr.y);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(img, 0, 0, pxW, pxH);
                this.ctx.restore();
            }

            // halo si joueur actuel
            if (String(p.data.user.player) === String(window.current_player_id)) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(255,165,0,0.9)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                this.ctx.restore();
            }
        });

        //
        // --- NPC ---
        //
        this.map.worldObjects
            .filter(o => o.type === 'npc')
            .forEach(npc => {
                const scr = this.camera.worldToScreen(npc.x, npc.y);
                const pxW = npc.sizeX * tilePx;
                const pxH = npc.sizeY * tilePx;

                const src = this.spriteManager.makeUrl(npc.spritePath);
                const img = this.spriteManager.get(src);
                const reversed = npc.data?.ship?.is_reversed;

                if (!img) {
                    this.ctx.fillStyle = 'rgba(255,80,80,0.8)';
                    this.ctx.fillRect(scr.x, scr.y, pxW, pxH);
                    this.spriteManager.ensure(src).catch(()=>{});
                } else if (!reversed) {
                    this.ctx.drawImage(img, scr.x, scr.y, pxW, pxH);
                } else {
                    this.ctx.save();
                    this.ctx.translate(scr.x + pxW, scr.y);
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(img, 0, 0, pxW, pxH);
                    this.ctx.restore();
                }
            });
    }
}
