// map_data.js
export default class MapData {
    constructor(raw, spriteManager, tileSize) {
        this.raw = raw || window.map_informations || {};
        this.spriteManager = spriteManager;
        this.tileSize = tileSize || 32;

        this.mapWidth = this.raw.map_width || 40;
        this.mapHeight = this.raw.map_height || 40;

        this.worldObjects = []; // includes foreground, players, npcs
        this.players = [];
        this.foregrounds = [];
        this.background = this.raw.sector?.background || null;
    }

    async prepare() {
        if (!this.raw) throw new Error('MapData.prepare: raw undefined');

        // foreground elements (sector_element)
        const fgList = Array.isArray(this.raw.sector_element) ? this.raw.sector_element : (this.raw.foreground || []);
        fgList.forEach(fg => {
            const coords = fg?.data?.coordinates || { x: 0, y: 0 };
            const size = fg?.size || { x: 1, y: 1 };
            const anim = fg?.animations || 0;
            const type = fg?.data?.type || 'unknown';
            const name = fg?.data?.name || `fg_${coords.x}_${coords.y}`;

            const obj = {
                id: `fg_${name}_${coords.x}_${coords.y}`,
                type: 'foreground',
                data: fg,
                x: parseInt(coords.x, 10) || 0,
                y: parseInt(coords.y, 10) || 0,
                sizeX: parseInt(size.x, 10) || 1,
                sizeY: parseInt(size.y, 10) || 1,
                spritePath: `foreground/${type}/${anim}/0.gif`
            };
            this.foregrounds.push(obj);
            this.worldObjects.push(obj);
            if (this.spriteManager?.ensure) this.spriteManager.ensure(this.spriteManager.makeUrl(obj.spritePath)).catch(()=>{});
        });

        // players
        const pcList = Array.isArray(this.raw.pc) ? this.raw.pc : (this.raw.players || []);
        pcList.forEach(p => {
            if (!p || !p.user) return;
            const coords = p.user.coordinates || { x: 0, y: 0 };
            const shipSize = p.ship?.size || { x: 1, y: 1 };
            const shipImage = p.ship?.image || 'default';
            const reversed = p.ship?.is_reversed || false;
            const obj = {
                id: `pc_${p.user.player}`,
                type: 'player',
                data: p,
                x: parseInt(coords.x, 10) || 0,
                y: parseInt(coords.y, 10) || 0,
                sizeX: parseInt(shipSize.x, 10) || 1,
                sizeY: parseInt(shipSize.y, 10) || 1,
                spritePath: `foreground/SHIPS/${shipImage}.png`,
                reversedSprite: `foreground/SHIPS/${shipImage}-reversed.png`
            };
            this.players.push(obj);
            this.worldObjects.push(obj);
            if (this.spriteManager?.ensure) {
                this.spriteManager.ensure(this.spriteManager.makeUrl(obj.spritePath)).catch(()=>{});
                this.spriteManager.ensure(this.spriteManager.makeUrl(obj.reversedSprite)).catch(()=>{});
            }
        });

        // NPCs
        const npcList = Array.isArray(this.raw.npc) ? this.raw.npc : [];
        npcList.forEach(n => {
            const coords = n.npc?.coordinates || { x: 0, y: 0 };
            const size = n.ship?.size || { x: 1, y: 1 };
            const shipImage = n.ship?.image || 'default';
            const obj = {
                id: `npc_${n.npc.id}`,
                type: 'npc',
                data: n,
                x: parseInt(coords.x, 10) || 0,
                y: parseInt(coords.y, 10) || 0,
                sizeX: parseInt(size.x, 10) || 1,
                sizeY: parseInt(size.y, 10) || 1,
                spritePath: `foreground/SHIPS/${shipImage}.png`,
                reversedSprite: `foreground/SHIPS/${shipImage}-reversed.png`
            };
            this.worldObjects.push(obj);
            if (this.spriteManager?.ensure) this.spriteManager.ensure(this.spriteManager.makeUrl(obj.spritePath)).catch(()=>{});
        });

        if (this.raw.map_width) this.mapWidth = this.raw.map_width;
        if (this.raw.map_height) this.mapHeight = this.raw.map_height;
    }

    findPlayerById(id) {
        return this.players.find(p => String(p.data.user.player) === String(id)) || null;
    }

    getObjectsAtTile(tileX, tileY) {
        return this.worldObjects.filter(o =>
        tileX >= o.x && tileX < (o.x + o.sizeX) &&
        tileY >= o.y && tileY < (o.y + o.sizeY)
        ).sort((a, b) => {
        const pri = { player: 3, npc: 3, foreground: 2, background: 1 };
        return (pri[b.type] || 0) - (pri[a.type] || 0);
        });
    }

    getTopObjectAt(tileX, tileY) {
        const arr = this.getObjectsAtTile(tileX, tileY);
        return arr.length ? arr[0] : null;
    }
}