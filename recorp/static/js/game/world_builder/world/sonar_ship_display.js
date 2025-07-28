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
            player.user.user !== current_user_id
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
     * Met à jour l'affichage d'un joueur selon sa visibilité
     * @param {Object} playerData - Données du joueur
     * @param {boolean} isVisible - Si le joueur est visible
     */
    updatePlayerDisplay(playerData, isVisible) {
        const playerInfo = this.extractPlayerInfo(playerData);
        const playerId = playerInfo.user.id;

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

                const border = cell.querySelector('span');
                const cellDiv = cell.querySelector('div');

                if (isVisible) {
                    // Afficher l'image du vaisseau
                    this.displayShipImage(cell, playerData, playerInfo, colOffset * 32, rowOffset * 32);
                } else {
                    // Afficher le cercle jaune
                    this.displayUnknownShip(cell, border, playerInfo);
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
        const npcId = npcInfo.npc.id;

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

                const border = cell.querySelector('span');
                const cellDiv = cell.querySelector('div');

                if (isVisible) {
                    // Afficher l'image du vaisseau NPC
                    this.displayNpcImage(cell, border, npcData, npcInfo, colOffset * 32, rowOffset * 32);
                } else {
                    // Afficher le cercle jaune
                    this.displayUnknownNpc(cell, border, npcInfo);
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
    displayShipImage(cell, playerData, playerInfo, colOffset, rowOffset) {
        const cellDiv = cell.querySelector('div');
        
        // Supprimer tous les anciens éléments de vaisseau (ship, ship-reversed, pc)
        this.removeOldContent(cellDiv)

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
    displayNpcImage(cell, border, npcData, npcInfo, colOffset, rowOffset) {
        const cellDiv = cell.querySelector('div');
        
        // Supprimer tous les anciens éléments de vaisseau (ship, ship-reversed, pc)
        this.removeOldContent(cellDiv)

        // Créer l'élément de vaisseau NPC
        const bgUrl = `/static/img/foreground/SHIPS/${npcInfo.ship.image}.png`;
        const spaceShip = this.createSpaceShipElement(bgUrl, colOffset, rowOffset);

        // Mettre à jour les attributs du border
        if (border) {
            border.setAttribute('data-title', 
                `${npcInfo.npc.displayed_name} [x : ${npcInfo.coordinates.y}, y: ${npcInfo.coordinates.x}]`
            );
            border.classList.add('hover:border-red-600');
        }    

        cellDiv.appendChild(spaceShip);
    }

    /**
     * Affiche un cercle jaune pour un joueur non identifié
     */
    displayUnknownShip(cell, border, playerInfo) {
        const cellDiv = cell.querySelector('div');
        
        // Supprimer tous les anciens éléments de vaisseau (ship, ship-reversed, pc)
        this.removeOldContent(cellDiv)

        // Créer le cercle jaune
        const unknownElement = this.createUnknownElement();
        cellDiv.appendChild(unknownElement);

        // Mettre à jour les attributs du border
        if (border) {
            border.setAttribute('data-title', 
                `Unknown [x : ${playerInfo.coordinates.baseY}, y: ${playerInfo.coordinates.baseX}]`
            );
            border.classList.add('hover:border-yellow-600');
        }
    }

    /**
     * Affiche un cercle jaune pour un NPC non identifié
     */
    displayUnknownNpc(cell, border, npcInfo) {
        const cellDiv = cell.querySelector('div');
        
        // Supprimer tous les anciens éléments de vaisseau (ship, ship-reversed, pc)
        this.removeOldContent(cellDiv)

        // Créer le cercle jaune
        const unknownElement = this.createUnknownElement();
        cellDiv.appendChild(unknownElement);

        // Mettre à jour les attributs du border
        if (border) {
            border.setAttribute('data-title', 
                `Unknown [x : ${npcInfo.coordinates.baseY}, y: ${npcInfo.coordinates.baseX}]`
            );
            border.classList.add('hover:border-yellow-600');
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
        const isCurrentUser = playerData.user.user === current_user_id;
        
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
            borderColor: isCurrentUser ? "border-orange-400" : "border-cyan-400"
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
            }
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
        return spaceShip;
    }

    removeOldContent(cellDiv){
        // Supprimer tous les anciens éléments de vaisseau (ship, ship-reversed, pc)
        const existingShip = cellDiv.querySelector('.ship');
        const existingShipReversed = cellDiv.querySelector('.ship-reversed');
        const existingPc = cellDiv.querySelector('.pc');
        const existingPulse = cellDiv.querySelector('.animate-ping');
        
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
    detectionSystem.updatePlayerPosition(newPosition, newRange);
}
