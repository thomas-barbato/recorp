class FogOfWar {
    constructor() {
        this.initializePlayer();
        this.square_size = 6; // Taille du carré de vision
        this.map = document.querySelectorAll('td.tile:not(.hidden)');
        this.isObserving = false;
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
    }

    init() {
        this.addFogOfWar();
        this.startObservingPlayerMovement();
    }

    // Fonction pour vérifier si une cellule est dans le carré de vision
    calculateSquareBounds() {
        const halfSize = Math.floor(this.square_size / 2);
        
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
        const visibilityZone = cell.querySelector('#background-out-of-fow');

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
        const visibilityZone = cell.querySelector('#background-out-of-fow');

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
        const oldY = this.player_y;
        const oldX = this.player_x;
        
        this.player_y = parseInt(newY);
        this.player_x = parseInt(newX);
        
        // Ne recalculer que si la position a vraiment changé
        if (oldY !== this.player_y || oldX !== this.player_x) {
            this.addFogOfWar();
        }
    }

    // Observer les changements de position du joueur
    startObservingPlayerMovement() {
        if (this.isObserving) return;
        
        const playerElement = document.querySelector('.player-ship-start-pos');
        if (!playerElement) return;

        // Observer les changements d'attribut ID
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'id') {
                    this.handlePlayerMovement();
                }
            });
        });

        observer.observe(playerElement, {
            attributes: true,
            attributeFilter: ['id']
        });

        // Observer les changements de classe (si le joueur change d'élément)
        const mapContainer = document.querySelector('table') || document.body;
        const classObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('player-ship-start-pos')) {
                        this.handlePlayerMovement();
                    }
                }
            });
        });

        classObserver.observe(mapContainer, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });

        this.isObserving = true;
        this.observer = observer;
        this.classObserver = classObserver;
    }

    // Gérer le mouvement du joueur détecté
    handlePlayerMovement() {
        try {
            const playerElement = document.querySelector('.player-ship-start-pos');
            if (!playerElement) return;

            const playerCoords = playerElement.id.split('_');
            const newY = parseInt(playerCoords[0]);
            const newX = parseInt(playerCoords[1]);

            // Mettre à jour seulement si les coordonnées ont changé
            if (newY !== this.player_y || newX !== this.player_x) {
                this.player_y = newY;
                this.player_x = newX;
                this.addFogOfWar();
            }
        } catch (error) {
            console.warn('Erreur lors de la mise à jour de la position du joueur:', error);
        }
    }

    // Méthode pour arrêter l'observation (utile pour le nettoyage)
    stopObservingPlayerMovement() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.classObserver) {
            this.classObserver.disconnect();
            this.classObserver = null;
        }
        this.isObserving = false;
    }

    // Méthode utilitaire pour changer la taille du carré
    setSquareSize(newSize) {
        this.square_size = newSize;
        this.addFogOfWar(); // Recalculer le fog of war
    }

    // Méthode de nettoyage pour éviter les fuites mémoire
    destroy() {
        this.stopObservingPlayerMovement();
    }
}