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

        this.worldObjects = [];
        this.players = [];
        this.foregrounds = [];

        const tryEnsure = (url) => {
            if (!url || !this.spriteManager || !this.spriteManager.ensure) return;
            try {
                this.spriteManager.ensure(this.spriteManager.makeUrl(url)).catch(()=>{ /* ignore */ });
            } catch (e) {
                // defensive
            }
        };

        // ------------ FOREGROUND (sector_element) ------------
        const fgList = Array.isArray(this.raw.sector_element) ? this.raw.sector_element : (this.raw.foreground || []);
        fgList.forEach(fg => {
            if (!fg || !fg.data) return;

            const anim = fg.animations || fg.data.animations || '';
            const type = fg.data.type || 'unknown';

            // defensive size parsing
            const sizeX = (fg.size && Number.isFinite(Number(fg.size.x))) ? Number(fg.size.x) : 1;
            const sizeY = (fg.size && Number.isFinite(Number(fg.size.y))) ? Number(fg.size.y) : 1;

            const obj = {
                id: `${type}_${fg.item_id}`,
                type: "foreground",
                subtype: type,
                x: Number.parseInt(fg.data.coordinates?.x ?? fg.data.x ?? 0, 10),
                y: Number.parseInt(fg.data.coordinates?.y ?? fg.data.y ?? 0, 10),
                sizeX,
                sizeY,
                image: anim || null,
                spritePath: anim ? `foreground/${type}/${anim}/0.gif` : null,
                data: fg
            };
            this.foregrounds.push(obj);
            this.worldObjects.push(obj);

            if (obj.spritePath) tryEnsure(obj.spritePath);
        });

        // ------------ PLAYERS (pc) ------------
        const pcList = Array.isArray(this.raw.pc) ? this.raw.pc : (this.raw.players || []);
        pcList.forEach(p => {
            if (!p || !p.user) return;

            const ship = p.ship || {};
            const shipImage = ship.image || null;
            const reversed = !!ship.is_reversed;

            const sizeX = (ship.size && Number.isFinite(Number(ship.size.x))) ? Number(ship.size.x) : 1;
            const sizeY = (ship.size && Number.isFinite(Number(ship.size.y))) ? Number(ship.size.y) : 1;

            const obj = {
                id: `pc_${p.user.player}`,
                type: 'player',
                data: p,
                subtype: ship.name || null,
                x: Number.parseInt(p.user.coordinates?.x ?? p.user.x ?? 0, 10),
                y: Number.parseInt(p.user.coordinates?.y ?? p.user.y ?? 0, 10),
                sizeX,
                sizeY,
                image: shipImage,
                spritePath: shipImage ? `foreground/SHIPS/${shipImage}.png` : null,
                reversedSprite: shipImage ? `foreground/SHIPS/${shipImage}-reversed.png` : null
            };

            this.players.push(obj);
            this.worldObjects.push(obj);

            if (obj.spritePath) tryEnsure(obj.spritePath);
            if (obj.reversedSprite) tryEnsure(obj.reversedSprite);
        });

        // ------------ NPCs ------------
        const npcList = Array.isArray(this.raw.npc) ? this.raw.npc : [];
        npcList.forEach(n => {
            if (!n || !n.npc) return;

            const ship = n.ship || {};
            const shipImage = ship.image || null;

            const sizeX = (ship.size && Number.isFinite(Number(ship.size.x))) ? Number(ship.size.x) : 1;
            const sizeY = (ship.size && Number.isFinite(Number(ship.size.y))) ? Number(ship.size.y) : 1;

            const obj = {
                id: `npc_${n.npc.id}`,
                type: 'npc',
                data: n,
                subtype: ship.name || null,
                x: Number.parseInt(n.npc.coordinates?.x ?? n.npc.x ?? 0, 10),
                y: Number.parseInt(n.npc.coordinates?.y ?? n.npc.y ?? 0, 10),
                sizeX,
                sizeY,
                image: shipImage,
                spritePath: shipImage ? `foreground/SHIPS/${shipImage}.png` : null,
                reversedSprite: shipImage ? `foreground/SHIPS/${shipImage}-reversed.png` : null
            };

            this.worldObjects.push(obj);
            if (obj.spritePath) tryEnsure(obj.spritePath);
            if (obj.reversedSprite) tryEnsure(obj.reversedSprite);
        });

        // ------------ MAP SIZE OVERRIDES ------------
        if (this.raw.map_width) this.mapWidth = Number(this.raw.map_width);
        if (this.raw.map_height) this.mapHeight = Number(this.raw.map_height);  
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