/**
 * Classe de détection automatique après déplacement du joueur
 * Vérifie si les joueurs/NPCs sont dans la zone du sonar et met à jour leur affichage
 */
class PostMovementDetectionSystem {
    constructor() {
        this.currentPlayerData = null;
        this.allPlayersData = [];
        this.allNpcsData = [];
        this.detectionRange = 0;
        this.currentPlayerPosition = { x: 0, y: 0 };
        this.isInitialized = false;
    }

    /**
     * Initialise le système de détection avec les données du joueur actuel
     * @param {Object} playerData - Données du joueur principal
     */
    initialize(playerData) {
        if (!playerData || !playerData.ship || !playerData.user) {
            return;
        }

        this.currentPlayerData = playerData;
        this.detectionRange = playerData.ship.view_range || 0;
        this.currentPlayerPosition = {
            x: parseInt(playerData.user.coordinates.x),
            y: parseInt(playerData.user.coordinates.y)
        };
        this.isInitialized = true;
    }

    /**
     * Met à jour les données de tous les joueurs
     * @param {Array} playersData - Tableau des données de tous les joueurs
     */
    updatePlayersData(playersData) {
        if (!Array.isArray(playersData)) {
            return;
        }
        this.allPlayersData = playersData.filter(player => 
            player.user.user !== current_player_id
        );
    }

    /**
     * Met à jour les données de tous les NPCs
     * @param {Array} npcsData - Tableau des données de tous les NPCs
     */
    updateNpcsData(npcsData) {
        if (!Array.isArray(npcsData)) {
            return;
        }
        this.allNpcsData = npcsData;
    }

    /**
     * Met à jour la position du joueur principal après un déplacement
     * @param {Object} newPosition - Nouvelles coordonnées {x, y}
     * @param {number} newRange - Nouvelle portée de détection
     */
    updatePlayerPosition(newPosition, newRange = null) {
        if (!newPosition || typeof newPosition.x === 'undefined' || typeof newPosition.y === 'undefined') {
            return;
        }

        this.currentPlayerPosition = {
            x: parseInt(newPosition.x),
            y: parseInt(newPosition.y)
        };

        if (newRange !== null) {
            this.detectionRange = newRange;
        }

        // Déclencher la vérification de détection
        this.performDetectionCheck();
    }

    /**
     * Calcule la distance entre deux points
     * @param {Object} pos1 - Position 1 {x, y}
     * @param {Object} pos2 - Position 2 {x, y}
     * @returns {number} Distance euclidienne
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Vérifie si un vaisseau est visible selon les règles du jeu
     * @param {Object} targetPosition - Position du vaisseau cible {x, y}
     * @param {Object} targetSize - Taille du vaisseau {x, y}
     * @returns {boolean} True si visible
     */
    isShipVisible(targetPosition, targetSize) {
        // Utilisation de la fonction existante ship_is_visible si disponible
        if (typeof ship_is_visible === 'function') {
            return ship_is_visible(
                targetPosition.y + 1, // +1 car ship_is_visible attend les coordonnées ajustées
                targetPosition.x + 1,
                targetSize.y,
                targetSize.x
            );
        }

        // Fallback: vérification basique de distance
        return this.isInDetectionRange(targetPosition, targetSize);
    }

    /**
     * Vérifie si un vaisseau est dans la portée de détection
     * @param {Object} targetPosition - Position du vaisseau {x, y}
     * @param {Object} targetSize - Taille du vaisseau {x, y}
     * @returns {boolean} True si dans la portée
     */
    isInDetectionRange(targetPosition, targetSize) {
        // Vérifier si au moins une partie du vaisseau est dans la portée
        for (let dy = 0; dy < targetSize.y; dy++) {
            for (let dx = 0; dx < targetSize.x; dx++) {
                const cellPosition = {
                    x: targetPosition.x + dx,
                    y: targetPosition.y + dy
                };
                
                const distance = this.calculateDistance(this.currentPlayerPosition, cellPosition);
                if (distance <= this.detectionRange) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Supprime tous les event listeners d'une cellule
     * @param {HTMLElement} cell - La cellule DOM
     */
    removeEventListeners(cell) {
        const border = cell.querySelector('span');
        if (border) {
            // Cloner l'élément pour supprimer tous les event listeners
            border.replaceWith(border.cloneNode(true));
            /*
            const newBorder = border.cloneNode(true);
            border.parentNode.replaceChild(newBorder, border);
            */
        }
    }

    /**
     * Ajoute les event listeners appropriés selon la visibilité
     * @param {HTMLElement} cell - La cellule DOM
     * @param {Object} entityInfo - Informations sur l'entité (joueur ou NPC)
     * @param {boolean} isVisible - Si l'entité est visible
     * @param {boolean} isNpc - Si c'est un NPC
     */
    setupEventListeners(cell, entityInfo, isVisible, isNpc = false) {
        const border = cell.querySelector('span');
        const pathfindingZoneSpan = cell.querySelector('.pathfinding-zone')
        if (!border) return;

        // Configuration de base commune
        border.className = "absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer";
        
        if (isVisible) {
            // Entité visible - configuration complète
            if (isNpc) {
                this.setupVisibleNpcEventListeners(border, entityInfo);
                pathfindingZoneSpan.title = `${entityInfo.npc.displayed_name} [x: ${entityInfo.coordinates.baseX}, y: ${entityInfo.coordinates.baseY}]`;
            } else {
                this.setupVisiblePlayerEventListeners(border, entityInfo);
                pathfindingZoneSpan.title = `${entityInfo.user.name} [x: ${entityInfo.coordinates.baseX}, y: ${entityInfo.coordinates.baseY}]`;
            }
        } else {
            // Entité non visible - configuration "unknown"
            this.setupUnknownEntityEventListeners(border, entityInfo);
            pathfindingZoneSpan.title = `${"Unknown"} [x: ${entityInfo.coordinates.baseX}, y: ${entityInfo.coordinates.baseY}]`;
        }
    }

    /**
     * Configure les event listeners pour un joueur visible
     */
    setupVisiblePlayerEventListeners(border, playerInfo) {

        border.setAttribute('data-modal-target', `modal-pc_${playerInfo.user.id}`);

        function handleBorderGeneration() {
            generate_border(
                playerInfo.ship.sizeY, 
                playerInfo.ship.sizeX, 
                playerInfo.coordinates.baseY + 1, 
                playerInfo.coordinates.baseX + 1,
                'border-cyan-400'
            );
            border.classList.remove('border-yellow-300');
            border.classList.add('border-cyan-400');
        }

        function handleBorderRemove() {
            remove_border(
                playerInfo.ship.sizeY, 
                playerInfo.ship.sizeX, 
                playerInfo.coordinates.baseY + 1, 
                playerInfo.coordinates.baseX + 1,
                'border-cyan-400'
            );
            border.classList.remove('border-yellow-300');
            border.classList.add('border-cyan-400');
            // Configuration du clic pour non-mobile
            if (!is_user_is_on_mobile_device()) {
                border.setAttribute(attribute_touch_click, `open_close_modal('modal-pc_${playerInfo.user.id}')`);
            }
        }

    
        // Événements optimisés avec les valeurs pré-calculées

        // Add event listeners
        border.addEventListener("mouseover", handleBorderGeneration);
        border.addEventListener("mouseout", handleBorderRemove);
    }

    /**
     * Configure les event listeners pour un NPC visible
     */
    setupVisibleNpcEventListeners(border, npcInfo) {
        
        border.setAttribute('data-modal-target', `modal-npc_${npcInfo.npc.id}`);
        
        // Event listeners pour NPC visible
        border.addEventListener("mouseover", () => {
            generate_border(
                npcInfo.ship.sizeY, 
                npcInfo.ship.sizeX, 
                npcInfo.coordinates.baseY + 1, 
                npcInfo.coordinates.baseX + 1,
                'border-red-600'
            );
            border.classList.remove('border-yellow-300');
            border.classList.add('border-red-600');
        });
        
        border.addEventListener("mouseout", () => {
            remove_border(
                npcInfo.ship.sizeY, 
                npcInfo.ship.sizeX, 
                npcInfo.coordinates.baseY + 1, 
                npcInfo.coordinates.baseX + 1,
                'border-red-600'
            );
        });

        // Configuration du clic pour non-mobile
        if (!is_user_is_on_mobile_device()) {
            border.setAttribute(attribute_touch_click, `open_close_modal('modal-npc_${npcInfo.npc.id}')`);
        }
    }

    /**
     * Configure les event listeners pour une entité non visible (unknown)
     */
    setupUnknownEntityEventListeners(border, entityInfo) {
        console.log("TEST")
        console.log(entityInfo)
        
        // Supprimer les attributs de modal pour les entités inconnues
        border.removeAttribute('data-modal-target');
        border.removeAttribute('onmouseover');
        
        // Event listeners pour entité inconnue
        border.addEventListener("mouseover", () => {
            generate_border(
                entityInfo.ship.sizeY, 
                entityInfo.ship.sizeX, 
                entityInfo.coordinates.baseY + 1, 
                entityInfo.coordinates.baseX + 1,
                'border-yellow-300'
            );
            border.classList.remove('border-cyan-400', 'border-red-600');
            border.classList.add('border-yellow-300');
        });
        
        border.addEventListener("mouseout", () => {
            remove_border(
                entityInfo.ship.sizeY, 
                entityInfo.ship.sizeX, 
                entityInfo.coordinates.baseY + 1, 
                entityInfo.coordinates.baseX + 1,
                'border-yellow-300'
            );
            border.classList.remove('border-cyan-400', 'border-red-600');
            border.classList.add('border-yellow-300');
        });
    }

    /**
     * Met à jour l'affichage d'un joueur selon sa visibilité
     * @param {Object} playerData - Données du joueur
     * @param {boolean} isVisible - Si le joueur est visible
     */
    updatePlayerDisplay(playerData, isVisible) {
        const playerInfo = this.extractPlayerInfo(playerData);

        // Parcourir toutes les cellules du vaisseau
        let coordX = playerInfo.coordinates.x;
        let coordY = playerInfo.coordinates.y;

        for (let rowOffset = 0; rowOffset < playerInfo.ship.sizeY; rowOffset++) {
            for (let colOffset = 0; colOffset < playerInfo.ship.sizeX; colOffset++) {
                const cell = this.getTableCell(coordY, coordX);
                if (!cell) {
                    coordX++;
                    continue;
                }
                
                // Supprimer les anciens event listeners
                this.removeEventListeners(cell);
                
                // Supprimer l'ancien contenu visuel
                this.removeOldContent(cell);

                // Configurer les nouveaux event listeners
                this.setupEventListeners(cell, playerInfo, isVisible, false);

                if (isVisible) {
                    // Afficher l'image du vaisseau
                    this.displayShipImage(cell, playerInfo, colOffset * 32, rowOffset * 32);
                } else {
                    // Afficher le cercle jaune
                    this.displayUnknownShip(cell, playerInfo.coordinates);
                }

                coordX++;
            }
            coordY++;
            coordX = playerInfo.coordinates.x;
        }
    }

    /**
     * Met à jour l'affichage d'un NPC selon sa visibilité
     * @param {Object} npcData - Données du NPC
     * @param {boolean} isVisible - Si le NPC est visible
     */
    updateNpcDisplay(npcData, isVisible) {
        const npcInfo = this.extractNpcInfo(npcData);

        // Parcourir toutes les cellules du vaisseau NPC
        let coordX = npcInfo.coordinates.x;
        let coordY = npcInfo.coordinates.y;

        for (let rowOffset = 0; rowOffset < npcInfo.ship.sizeY; rowOffset++) {
            for (let colOffset = 0; colOffset < npcInfo.ship.sizeX; colOffset++) {
                const cell = this.getTableCell(coordY, coordX);
                if (!cell) {
                    coordX++;
                    continue;
                }

                // Supprimer les anciens event listeners
                this.removeEventListeners(cell);
                
                // Supprimer l'ancien contenu visuel
                this.removeOldContent(cell);

                // Configurer les nouveaux event listeners
                this.setupEventListeners(cell, npcInfo, isVisible, true);

                if (isVisible) {
                    // Afficher l'image du vaisseau NPC
                    this.displayNpcImage(cell, npcInfo, colOffset * 32, rowOffset * 32);
                } else {
                    // Afficher le cercle jaune
                    this.displayUnknownShip(cell, npcInfo.coordinates);
                }

                coordX++;
            }
            coordY++;
            coordX = npcInfo.coordinates.x;
        }
    }

    /**
     * Affiche l'image d'un vaisseau joueur
     */
    displayShipImage(cell, playerInfo, colOffset, rowOffset) {
        const cellDiv = cell.querySelector('div');

        // Créer les éléments de vaisseau
        const { spaceShip, spaceShipReversed } = this.createShipElements(
            playerInfo.ship.image, colOffset, rowOffset
        );

        // Gérer l'affichage selon l'orientation
        if (playerInfo.ship.isReversed) {
            spaceShip.classList.add('hidden');
            spaceShipReversed.classList.remove('hidden');
        } else {
            spaceShip.classList.remove('hidden');
            spaceShipReversed.classList.add('hidden');
        }

        cellDiv.appendChild(spaceShip);
        cellDiv.appendChild(spaceShipReversed);
    }

    /**
     * Affiche l'image d'un vaisseau NPC
     */
    displayNpcImage(cell, npcInfo, colOffset, rowOffset) {
        const cellDiv = cell.querySelector('div');

        // Créer l'élément de vaisseau NPC
        const bgUrl = `/static/img/foreground/SHIPS/${npcInfo.ship.image}.png`;
        const spaceShip = this.createSpaceShipElement(bgUrl, colOffset, rowOffset);

        cellDiv.appendChild(spaceShip);
    }

    /**
     * Affiche un cercle jaune pour un joueur / personnage non joueur non identifié
     */
    displayUnknownShip(cell, coordinates) {
        const cellDiv = cell.querySelector('div');

        let unknownShip = cellDiv.querySelector('#unknown-ship')

        if(!unknownShip){
            // Créer le cercle jaune
            const unknownElement = this.createUnknownElement();
            cellDiv.appendChild(unknownElement);
        }
        
    }

    /**
     * Effectue la vérification de détection pour tous les joueurs et NPCs
     */
    performDetectionCheck() {
        if (!this.isInitialized) {
            console.warn('Système de détection non initialisé');
            return;
        }

        // Vérifier tous les autres joueurs
        this.allPlayersData.forEach(playerData => {
            const playerInfo = this.extractPlayerInfo(playerData);
            const targetPosition = {
                x: playerInfo.coordinates.baseX,
                y: playerInfo.coordinates.baseY
            };
            const targetSize = {
                x: playerInfo.ship.sizeX,
                y: playerInfo.ship.sizeY
            };

            const isVisible = this.isShipVisible(targetPosition, targetSize);
            this.updatePlayerDisplay(playerData, isVisible);
        });

        // Vérifier tous les NPCs
        this.allNpcsData.forEach(npcData => {
            const npcInfo = this.extractNpcInfo(npcData);
            const targetPosition = {
                x: npcInfo.coordinates.baseX,
                y: npcInfo.coordinates.baseY
            };
            const targetSize = {
                x: npcInfo.ship.sizeX,
                y: npcInfo.ship.sizeY
            };

            const isVisible = this.isShipVisible(targetPosition, targetSize);
            this.updateNpcDisplay(npcData, isVisible);
        });
    }

    // ========== FONCTIONS UTILITAIRES (reprises de votre code existant) ==========

    extractPlayerInfo(playerData) {
        const baseCoordX = parseInt(playerData.user.coordinates.x);
        const baseCoordY = parseInt(playerData.user.coordinates.y);
        const isCurrentUser = playerData.user.user === current_player_id;
        
        return {
            coordinates: {
                x: baseCoordX + 1,
                y: baseCoordY + 1,
                baseX: baseCoordX,
                baseY: baseCoordY
            },
            ship: {
                sizeX: playerData.ship.size.x,
                sizeY: playerData.ship.size.y,
                image: playerData.ship.image,
                isReversed: playerData.ship.is_reversed,
                currentMovement: playerData.ship.current_movement,
                viewRange: playerData.ship.view_range
            },
            user: {
                id: playerData.user.player,
                name: playerData.user.name
            },
            isCurrentUser,
            borderColor: isCurrentUser ? "border-orange-400" : "border-cyan-400",
        };
    }

    extractNpcInfo(npcData) {
        const baseCoordX = parseInt(npcData.npc.coordinates.x);
        const baseCoordY = parseInt(npcData.npc.coordinates.y);
        return {
            coordinates: {
                x: baseCoordX + 1,
                y: baseCoordY + 1,
                baseX: baseCoordX,
                baseY: baseCoordY
            },
            ship: {
                sizeX: npcData.ship.size.x,
                sizeY: npcData.ship.size.y,
                image: npcData.ship.image
            },
            npc: {
                id: npcData.npc.id,
                name: npcData.npc.name,
                displayed_name: npcData.npc.displayed_name
            },
        };
    }

    getTableCell(rowIndex, colIndex) {
        const tabletopView = document.querySelector('.tabletop-view');
        if (!tabletopView || !tabletopView.rows[rowIndex]) return null;
        return tabletopView.rows[rowIndex].cells[colIndex];
    }

    createShipElements(shipImage, colOffset, rowOffset) {
        const bgUrl = `/static/img/foreground/SHIPS/${shipImage}.png`;
        const bgUrlReversed = `/static/img/foreground/SHIPS/${shipImage}-reversed.png`;
        
        const spaceShip = this.createShipElement(bgUrl, colOffset, rowOffset, 'ship');
        const spaceShipReversed = this.createShipElement(bgUrlReversed, colOffset, rowOffset, 'ship-reversed');
        
        return { spaceShip, spaceShipReversed };
    }

    createShipElement(bgUrl, colOffset, rowOffset, className) {
        const element = document.createElement('div');
        element.style.backgroundImage = `url('${bgUrl}')`;
        element.classList.add(className, 'absolute', 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'pc', 'z-1');
        element.style.backgroundPositionX = `-${colOffset}px`;
        element.style.backgroundPositionY = `-${rowOffset}px`;
        return element;
    }

    createSpaceShipElement(bgUrl, colOffset, rowOffset) {
        const spaceShip = document.createElement('div');
        spaceShip.style.backgroundImage = `url('${bgUrl}')`;
        spaceShip.classList.add('ship', 'absolute', 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'z-1');
        spaceShip.style.backgroundPositionX = `-${colOffset}px`;
        spaceShip.style.backgroundPositionY = `-${rowOffset}px`;
        return spaceShip;
    }

    createUnknownElement() {
        const spaceShip = document.createElement('div');
        spaceShip.classList.add(
            'ship', 'absolute', 'inline-block', 'w-[8px]', 'h-[8px]', 'rounded-full',
            'animate-ping', 'bg-yellow-300', 'top-1/2', 'left-1/2', 'transform', 
            '-translate-x-1/2', '-translate-y-1/2', 'z-1'
        );
        spaceShip.id = "unknown-ship";
        return spaceShip;
    }

    removeOldContent(cell) {
        const cellDiv = cell.querySelector('div');
        if (!cellDiv) return;
        
        // Supprimer tous les anciens éléments de vaisseau
        const existingShip = cellDiv.querySelector('.ship');
        const existingShipReversed = cellDiv.querySelector('.ship-reversed');
        const existingPc = cellDiv.querySelector('.pc');
        const existingPulse = cellDiv.querySelector('#unknown-ship');
        
        if (existingShip) existingShip.remove();
        if (existingShipReversed) existingShipReversed.remove();
        if (existingPc) existingPc.remove();
        if (existingPulse) existingPulse.remove();
    }
}

// ========== INTÉGRATION AVEC LE SYSTÈME EXISTANT ==========

// Instance globale du système de détection
let detectionSystem = new PostMovementDetectionSystem();

/**
 * Fonction à appeler après le chargement initial des données
 * @param {Object} currentPlayerData - Données du joueur principal
 * @param {Array} allPlayersData - Données de tous les joueurs
 * @param {Array} allNpcsData - Données de tous les NPCs
 */
function initializeDetectionSystem(currentPlayerData, allPlayersData, allNpcsData) {
    detectionSystem.initialize(currentPlayerData);
    detectionSystem.updatePlayersData(allPlayersData);
    detectionSystem.updateNpcsData(allNpcsData);
    detectionSystem.performDetectionCheck();
}

/**
 * Fonction à appeler après chaque déplacement du joueur
 * @param {Object} newPosition - Nouvelles coordonnées {x, y}
 * @param {number} newRange - Nouvelle portée de détection (optionnel)
 */
function onPlayerMoved(newPosition, newRange = null) {
    console.log("Mise à jour position joueur et event listeners");
    detectionSystem.updatePlayerPosition(newPosition, newRange);
}