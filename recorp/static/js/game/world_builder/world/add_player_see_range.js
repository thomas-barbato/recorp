class FogOfWar {
    constructor() {
        this.initializePlayer();
        this.map = document.querySelectorAll('td.tile:not(.hidden)');
        this.init();
    }

    initializePlayer() {
        const playerElement = document.querySelector('.player-ship-start-pos');
        if (!playerElement) {
            throw new Error('Player element not found');
        }
        
        const playerCoords = playerElement.id.split('_');
        this.player_y = parseInt(playerCoords[0]);
        this.player_x = parseInt(playerCoords[1]);
        this.square_size = 5;
    }

    init() {
        this.addFogOfWar();
    }

    // Fonction pour vérifier si une cellule est dans le carré de vision
    calculateSquareBounds() {
        const halfSize = Math.ceil(this.square_size / 2);
        
        return {
            minRow: this.player_y - halfSize,
            maxRow: this.player_y + halfSize,
            minCol: this.player_x - halfSize,
            maxCol: this.player_x + halfSize
        };
    }

    isInsideSquare(cellRow, cellCol) {
        const bounds = this.calculateSquareBounds();
        
        return cellRow >= bounds.minRow && 
            cellRow <= bounds.maxRow && 
            cellCol >= bounds.minCol && 
            cellCol <= bounds.maxCol;
    }

    addFogOfWar() {
        this.map.forEach(cell => {
            const coords = this.parseCoordinates(cell.id);
            if (!coords) return;

            const { row, col } = coords;
            
            if (this.isInsideSquare(row, col)) {
                this.displayVisibleZone(cell);
            } else {
                this.defineElementToHide(cell);
            }
        });
    }

    parseCoordinates(id) {
        const parts = id.split('_');
        if (parts.length < 2) return null;
        
        return {
            row: parseInt(parts[0]),
            col: parseInt(parts[1])
        };
    }

    displayVisibleZone(cell) {
        const fogElement = cell.querySelector('#fog-of-war');
        const visibilityZone = cell.querySelector('#field-of-view');

        if (fogElement) {
            fogElement.classList.add('hidden');
        }
        
        if (visibilityZone) {
            visibilityZone.classList.add('bg-zinc-300/30');
        }
    }

    hasTypeAttribute(cell) {
        return cell.hasAttribute('type');
    }

    defineElementToHide(cell) {
        const fogCell = cell.querySelector('#fog-of-war');
        const fogCellSpan = fogCell?.querySelector('span');
        const element = cell.querySelector('.coord-zone-div');
        const visibilityZone = cell.querySelector('#field-of-view');

        // Masquer la zone de visibilité
        if (visibilityZone) {
            visibilityZone.classList.add('hidden');
        }

        if (!this.hasTypeAttribute(cell)) {
            this.hideDefaultElements(fogCell, fogCellSpan, element);
        } else {
            this.handleTypedElement(cell, fogCell, fogCellSpan, element);
        }
    }

    hideDefaultElements(fogCell, fogCellSpan, element) {
        if (fogCell) {
            fogCell.classList.remove('hidden');
        }
        if (fogCellSpan) {
            fogCellSpan.classList.add('hidden');
        }
        if (element) {
            element.classList.add('hidden');
        }
    }

    handleTypedElement(cell, fogCell, fogCellSpan, element) {
        const cellType = cell.getAttribute('type');
        
        switch (cellType) {
            case 'npc':
            case 'pc':
                if (element) element.classList.add('hidden');
                if (fogCell) fogCell.classList.remove('hidden');
                break;
                
            case 'foreground':
                if (fogCell) fogCell.classList.add('hidden');
                if (fogCellSpan) fogCellSpan.classList.add('hidden');
                if (element) element.classList.remove('hidden');
                break;
        }
    }

    // Méthode utilitaire pour mettre à jour la position du joueur
    updatePlayerPosition(newY, newX) {
        this.player_y = parseInt(newY);
        this.player_x = parseInt(newX);
        this.addFogOfWar(); // Recalculer le fog of war
    }

    // Méthode utilitaire pour changer la taille du carré
    setSquareSize(newSize) {
        this.square_size = newSize;
        this.addFogOfWar(); // Recalculer le fog of war
    }
}