class ContextualMenuManager {
    
    constructor(){
        this.currentTarget = null;
        this.gridContainer = document.querySelector('.tabletop-view');
        this.menu = null;
        this.init();
    }

    init() {
        // Créer le menu s'il n'existe pas
        this.menu = document.getElementById('contextual-menu');
        if (!this.menu) {
            this.createMenu();
        }
        
        // Événements globaux
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        document.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Événements sur les tuiles
        this.attachTileEvents();
    }

    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'contextual-menu';
        menu.className = 'contextual-menu';
        menu.innerHTML = `
            <div id="contextual-menu-header" class="contextual-menu-header"></div>
            <div id="contextual-menu-content"></div>
        `;
        document.body.appendChild(menu);
        this.menu = menu;
    }

    attachTileEvents() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            // Clic gauche
            tile.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleTileClick(tile, e);
            });

            // Clic droit (menu contextuel alternatif)
            tile.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleTileClick(tile, e);
            });
        });
    }

    handleTileClick(tile, event) {
        const elements = this.getElementsInTile(tile);
        
        if (elements.length === 0) {
            this.hideMenu();
            return;
        }

        // Si une seule entité, afficher son menu directement
        if (elements.length === 1) {
            this.showMenuForElement(elements[0], event.clientX, event.clientY);
        } else {
            // Plusieurs entités, afficher un menu de sélection
            this.showSelectionMenu(elements, event.clientX, event.clientY);
        }

        this.selectTile(tile);
    }

    getElementsInTile(tile) {
        const elements = [];
        const tileId = tile.id;
        
        // Rechercher les joueurs (PC)
        const players = tile.querySelectorAll('[class*="player"], [class*="pc"]');
        players.forEach(player => {
            elements.push({
                type: 'player',
                element: player,
                name: this.getPlayerName(player),
                actions: this.getPlayerActions(player)
            });
        });

        // Rechercher les NPCs
        const npcs = tile.querySelectorAll('[class*="npc"]');
        npcs.forEach(npc => {
            elements.push({
                type: 'npc',
                element: npc,
                name: this.getNpcName(npc),
                actions: this.getNpcActions(npc)
            });
        });

        // Rechercher les éléments statiques
        const staticElements = tile.querySelectorAll(
            '[data-type="planet"], [data-type="asteroid"], [data-type="station"],[data-type="warpzone"], [data-type="star"], [data-type="satellite"]'
        );
        staticElements.forEach(elem => {
            elements.push({
                type: 'static',
                element: elem,
                name: this.getStaticElementName(elem),
                actions: this.getStaticElementActions(elem)
            });
        });

        return elements;
    }

}