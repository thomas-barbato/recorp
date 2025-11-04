/**
 * SYSTÈME DE MISE À JOUR DES JOUEURS APRÈS MOUVEMENT
 * Évite les affichages multiples en gérant proprement les mises à jour
 */

// Extension de la classe PostMovementDetectionSystem pour gérer les mises à jour de joueurs
class EnhancedPostMovementDetectionSystem extends PostMovementDetectionSystem {
    constructor() {
        super();
        this.playerPositionsCache = new Map();
        this.pendingUpdates = new Set();
        this.isProcessingMove = false; // Flag pour éviter les doubles traitements
    }

    /**
     * Met à jour un joueur spécifique après son mouvement (VERSION CORRIGÉE)
     * @param {Object} moveData - Données de mouvement du joueur
     */
    updateOtherPlayerAfterMove(moveData) {
        if (this.isProcessingMove) return; // Éviter les doublons
        this.isProcessingMove = true;

        try {
            const {
                user_id: targetUserId,
                player_id: targetPlayerId,
                start_id_array: startPosArray,
                destination_id_array: endPosArray,
                size,
                end_x,
                end_y,
                movement_remaining,
                max_movement,
                modules_range,
                is_reversed
            } = moveData;

            // 1. Calculer les positions
            const oldPosition = this.calculatePositionFromId(startPosArray[0]);
            const newPosition = { x: parseInt(end_x), y: parseInt(end_y) };

            // 2. Nettoyer COMPLÈTEMENT l'ancienne position
            this.cleanupCompleteOldPosition(targetPlayerId, startPosArray, size);

            // 3. Mettre à jour les données dans le cache
            this.updatePlayerDataInCache(moveData);

            // 4. Traiter le mouvement via la méthode DOM existante (SANS duplication)
            this.processDOMMovement(startPosArray, endPosArray, targetPlayerId, size, newPosition);

            // 5. Mettre à jour l'interface utilisateur du modal
            this.updatePlayerMovementModal(targetPlayerId, movement_remaining, max_movement, modules_range);

            // 6. Recalculer UNIQUEMENT la visibilité (sans replacer les joueurs)
            this.performDetectionCheckWithoutReplacement();

        } finally {
            this.isProcessingMove = false;
        }
    }

    /**
     * Nettoie complètement l'ancienne position d'un joueur
     * @param {string} playerId - ID du joueur
     * @param {Array} startPosArray - Tableau des positions de départ
     * @param {Object} size - Taille du vaisseau
     */
    cleanupCompleteOldPosition(playerId, startPosArray, size) {
        startPosArray.forEach(startId => {
            const element = document.getElementById(startId);
            if (element) {
                // Supprimer TOUS les éléments de vaisseau
                this.removeAllShipElements(element);
                
                // Remettre en état de secteur vide
                this.resetToEmptySpace(element, startId);
                
                // Supprimer les classes de joueur
                element.classList.remove('pc', 'uncrossable', 'ship-pos', 'bg-orange-400/30');
                element.removeAttribute('size_x');
                element.removeAttribute('size_y');
            }
        });
    }

    /**
     * Supprime TOUS les éléments de vaisseau d'une cellule
     * @param {HTMLElement} element - La cellule
     */
    removeAllShipElements(element) {
        const elementsToRemove = [
            '.ship', '.ship-reversed', '.player-ship', '.player-ship-reversed',
            '.pc', '#unknown-ship', 'ul'
        ];
        
        elementsToRemove.forEach(selector => {
            const elements = element.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
    }

    /**
     * Remet une cellule en état de secteur vide
     * @param {HTMLElement} element - La cellule
     * @param {string} cellId - ID de la cellule
     */
    resetToEmptySpace(element, cellId) {
        const [y, x] = cellId.split('_');
        const cellDiv = element.querySelector('div');
        
        if (cellDiv) {
            // Nettoyer complètement le div
            cellDiv.innerHTML = '';
            cellDiv.className = "relative w-[32px] h-[32px] coord-zone-div";
            
            // Recréer le span de pathfinding
            const pathfindingSpan = document.createElement('span');
            pathfindingSpan.className = "absolute hover:box-border block z-10 w-[32px] h-[32px] pathfinding-zone cursor-crosshair z-1 foreground-element";
            pathfindingSpan.setAttribute('title', 
                `${map_informations?.sector?.name || 'Secteur'} [y: ${y} ; x: ${x}]`
            );
            
            // Ajouter les événements de pathfinding SEULEMENT si pas mobile
            if (!is_user_is_on_mobile_device()) {
                pathfindingSpan.setAttribute(attribute_touch_mouseover, 'get_pathfinding(this)');
                pathfindingSpan.setAttribute(attribute_touch_click, 'display_pathfinding()');
            }
            
            cellDiv.appendChild(pathfindingSpan);
        }
    }

    /**
     * Traite le mouvement DOM avec création d'image de vaisseau
     * @param {Array} startPosArray - Positions de départ
     * @param {Array} endPosArray - Positions d'arrivée
     * @param {string} targetPlayerId - ID du joueur
     * @param {Object} size - Taille du vaisseau
     * @param {Object} newPosition - Nouvelle position
     */
    processDOMMovement(startPosArray, endPosArray, targetPlayerId, size, newPosition) {
        // Récupérer les données du joueur pour l'image
        const playerData = this.getPlayerDataById(targetPlayerId);
        if (!playerData) {
            console.warn(`Données joueur non trouvées pour ID: ${targetPlayerId}`);
            return;
        }

        const playerInfo = this.extractPlayerInfo(playerData);
        const shipImageUrl = `/static/img/foreground/SHIPS/${playerInfo.ship.image}.png`;
        const shipReversedImageUrl = `/static/img/foreground/SHIPS/${playerInfo.ship.image}-reversed.png`;

        // Traiter chaque cellule individuellement
        startPosArray.forEach((startId, index) => {
            const endId = endPosArray[index];
            const entryPoint = document.getElementById(startId);
            const endPoint = document.getElementById(endId);
            
            if (entryPoint && endPoint) {
                // Déplacer le contenu existant
                const tempContent = endPoint.innerHTML;
                endPoint.innerHTML = entryPoint.innerHTML;
                entryPoint.innerHTML = tempContent;
                
                // Calculer les offsets pour l'image (position relative dans le vaisseau)
                const { colOffset, rowOffset } = this.calculateImageOffsets(index, size);
                
                // Créer et ajouter l'image du vaisseau à la nouvelle position
                this.addShipImageToCell(endPoint, shipImageUrl, shipReversedImageUrl, 
                                    colOffset, rowOffset, playerInfo.ship.isReversed);
                
                // Configurer la nouvelle position
                this.setupNewPlayerPosition(endPoint, targetPlayerId, size, newPosition);
                
                // Nettoyer l'ancienne position
                this.finalizeOldPosition(entryPoint, startId);
            }
        });
    }

    /**
     * Configure la nouvelle position du joueur
     * @param {HTMLElement} endPoint - Élément de destination
     * @param {string} targetPlayerId - ID du joueur
     * @param {Object} size - Taille du vaisseau
     * @param {Object} newPosition - Nouvelle position
     */
    setupNewPlayerPosition(endPoint, targetPlayerId, size, newPosition) {
        // Ajouter les classes nécessaires
        endPoint.classList.add('pc', 'uncrossable');
        
        // Configurer les événements de clic
        const newEndPoint = endPoint.cloneNode(true);
        endPoint.parentNode.replaceChild(newEndPoint, endPoint);
        
        newEndPoint.addEventListener(attribute_touch_click, function(event) {
            event.preventDefault();
            open_close_modal(`modal-pc_${targetPlayerId}`);
        });
        
        // Configurer les événements de survol
        this.setupHoverEvents(newEndPoint, size, newPosition);
    }

    /**
     * Configure les événements de survol
     * @param {HTMLElement} element - Élément DOM
     * @param {Object} size - Taille du vaisseau
     * @param {Object} position - Position du vaisseau
     */
    setupHoverEvents(element, size, position) {
        const border = element.querySelector('span');
        if (!border) return;
        
        const adjustedY = parseInt(position.y) + 1;
        const adjustedX = parseInt(position.x) + 1;
        const sizeY = parseInt(size.y);
        const sizeX = parseInt(size.x);
        
        border.addEventListener("mouseover", () => {
            generate_border(sizeY, sizeX, adjustedY, adjustedX, 'border-cyan-400');
        });
        
        border.addEventListener("mouseout", () => {
            remove_border(sizeY, sizeX, adjustedY, adjustedX, 'border-cyan-400');
        });
    }

    /**
     * Finalise l'ancienne position
     * @param {HTMLElement} entryPoint - Ancienne position
     * @param {string} startId - ID de l'ancienne position
     */
    finalizeOldPosition(entryPoint, startId) {
        const pathfindingZone = entryPoint.querySelector('.pathfinding-zone');
        if (pathfindingZone) {
            const coordinates = startId.split('_');
            pathfindingZone.setAttribute('title',
                `${map_informations?.sector?.name || 'Secteur'} [y: ${coordinates[0]} ; x: ${coordinates[1]}]`);
        }
        
        entryPoint.classList.remove('pc', 'uncrossable');
    }

    /**
     * Met à jour les données du joueur dans le cache
     * @param {Object} moveData - Données de mouvement
     */
    updatePlayerDataInCache(moveData) {
        const playerId = moveData.player_id;
        
        // Mettre à jour dans allPlayersData
        const playerIndex = this.allPlayersData.findIndex(p => p.user.player === playerId);
        if (playerIndex !== -1) {
            // Mettre à jour les coordonnées et stats de mouvement
            this.allPlayersData[playerIndex].user.coordinates = {
                x: moveData.end_x,
                y: moveData.end_y
            };
            this.allPlayersData[playerIndex].ship.current_movement = moveData.movement_remaining;
            this.allPlayersData[playerIndex].ship.max_movement = moveData.max_movement;
            if (moveData.is_reversed !== undefined) {
                this.allPlayersData[playerIndex].ship.is_reversed = moveData.is_reversed;
            }
        }
        
        // Mettre à jour dans map_informations.pc si disponible
        if (typeof map_informations !== 'undefined' && map_informations.pc) {
            const mapPlayerIndex = map_informations.pc.findIndex(p => p.user.player === playerId);
            if (mapPlayerIndex !== -1) {
                map_informations.pc[mapPlayerIndex].user.coordinates = {
                    x: moveData.end_x,
                    y: moveData.end_y
                };
                map_informations.pc[mapPlayerIndex].ship.current_movement = moveData.movement_remaining;
                map_informations.pc[mapPlayerIndex].ship.max_movement = moveData.max_movement;
                if (moveData.is_reversed !== undefined) {
                    map_informations.pc[mapPlayerIndex].ship.is_reversed = moveData.is_reversed;
                }
            }
        }
    }

    /**
     * Récupère les données d'un joueur par son ID
     * @param {string} playerId - ID du joueur
     * @returns {Object|null} Données du joueur
     */
    getPlayerDataById(playerId) {
        // Chercher dans allPlayersData
        let playerData = this.allPlayersData.find(p => p.user.player === playerId);
        
        // Si pas trouvé, chercher dans map_informations.pc
        if (!playerData && typeof map_informations !== 'undefined' && map_informations.pc) {
            playerData = map_informations.pc.find(p => p.user.player === playerId);
        }
        
        return playerData;
    }

    /**
     * Calcule les offsets d'image selon la position dans le vaisseau
     * @param {number} cellIndex - Index de la cellule dans le tableau
     * @param {Object} size - Taille du vaisseau
     * @returns {Object} Offsets {colOffset, rowOffset}
     */
    calculateImageOffsets(cellIndex, size) {
        const sizeX = parseInt(size.x);
        const sizeY = parseInt(size.y);
        
        // Calculer la position relative dans le vaisseau (0-based)
        const row = Math.floor(cellIndex / sizeX);
        const col = cellIndex % sizeX;
        
        return {
            colOffset: col * 32,
            rowOffset: row * 32
        };
    }

    /**
     * Ajoute l'image du vaisseau à une cellule
     * @param {HTMLElement} cell - La cellule
     * @param {string} shipImageUrl - URL de l'image du vaisseau
     * @param {string} shipReversedImageUrl - URL de l'image inversée
     * @param {number} colOffset - Offset horizontal
     * @param {number} rowOffset - Offset vertical
     * @param {boolean} isReversed - Si le vaisseau est inversé
     */
    addShipImageToCell(cell, shipImageUrl, shipReversedImageUrl, colOffset, rowOffset, isReversed) {
        const cellDiv = cell.querySelector('div');
        if (!cellDiv) return;

        // Supprimer les anciennes images de vaisseau s'il y en a
        const existingShips = cellDiv.querySelectorAll('.ship, .ship-reversed, .player-ship, .player-ship-reversed');
        existingShips.forEach(ship => ship.remove());

        // Créer les éléments de vaisseau
        const spaceShip = this.createShipElement(shipImageUrl, colOffset, rowOffset, 'ship player-ship');
        const spaceShipReversed = this.createShipElement(shipReversedImageUrl, colOffset, rowOffset, 'ship-reversed player-ship-reversed');

        // Gérer l'affichage selon l'orientation
        if (isReversed) {
            spaceShip.classList.add('hidden');
            spaceShipReversed.classList.remove('hidden');
        } else {
            spaceShip.classList.remove('hidden');
            spaceShipReversed.classList.add('hidden');
        }

        // Ajouter au DOM
        cellDiv.appendChild(spaceShip);
        cellDiv.appendChild(spaceShipReversed);
    }

    /**
     * Crée un élément de vaisseau avec les styles appropriés
     * @param {string} imageUrl - URL de l'image
     * @param {number} colOffset - Offset horizontal
     * @param {number} rowOffset - Offset vertical
     * @param {string} className - Classes CSS à appliquer
     * @returns {HTMLElement} Élément créé
     */
    createShipElement(imageUrl, colOffset, rowOffset, className) {
        const element = document.createElement('div');
        element.style.backgroundImage = `url('${imageUrl}')`;
        element.className = `${className} absolute w-[32px] h-[32px] cursor-pointer z-1`;
        element.style.backgroundPositionX = `-${colOffset}px`;
        element.style.backgroundPositionY = `-${rowOffset}px`;
        return element;
    }

    /**
     * Met à jour l'interface utilisateur du modal d'un joueur
     * @param {string} playerId - ID du joueur
     * @param {number} movementRemaining - Mouvement restant
     * @param {number} maxMovement - Mouvement maximum
     * @param {Object} modulesRange - Portées des modules
     */
    updatePlayerMovementModal(playerId, movementRemaining, maxMovement, modulesRange) {
        const modalElement = document.getElementById(`modal-pc_${playerId}`);
        if (!modalElement) return;
        
        try {
            // Mise à jour de la barre de progression détaillée
            const detailedContainer = modalElement.querySelector('#movement-container-detailed');
            if (detailedContainer) {
                const progressBar = detailedContainer.querySelector('div');
                const progressText = detailedContainer.querySelector('span');
                
                if (progressBar && progressText) {
                    const percentage = Math.round((movementRemaining * 100) / maxMovement);
                    progressBar.style.width = `${percentage}%`;
                    progressText.textContent = `${movementRemaining} / ${maxMovement}`;
                }
            }
            
            // Mise à jour du statut de mouvement
            const movementContainer = modalElement.querySelector('#movement-container');
            if (movementContainer) {
                const movementText = movementContainer.querySelector('p');
                if (movementText && typeof color_per_percent === 'function') {
                    const movementValue = color_per_percent(movementRemaining, maxMovement);
                    movementText.className = `text-xs ${movementValue.color} font-shadow`;
                    movementText.textContent = movementValue.status;
                }
            }
            
            // Mise à jour des portées des modules
            if (modulesRange && typeof update_player_range_in_modal === 'function') {
                update_player_range_in_modal(modulesRange);
            }
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour du modal du joueur:', error);
        }
    }

    /**
     * Effectue la vérification de détection SANS replacer les joueurs (évite les doublons)
     */
    performDetectionCheckWithoutReplacement() {
        if (!this.isInitialized) {
            return;
        }

        // Vérifier tous les autres joueurs (UNIQUEMENT pour la visibilité, pas le placement)
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
            
            // SEULEMENT mettre à jour la visibilité des event listeners, 
            // PAS replacer le joueur
            this.updatePlayerVisibilityOnly(playerData, isVisible);
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

    /**
     * Calcule la position à partir d'un ID de cellule
     * @param {string} cellId - ID de la cellule (format: "y_x")
     * @returns {Object} Position {x, y}
     */
    calculatePositionFromId(cellId) {
        const [y, x] = cellId.split('_').map(Number);
        return { x, y };
    }

    /**
     * Met à jour UNIQUEMENT la visibilité d'un joueur (pas son placement)
     * @param {Object} playerData - Données du joueur
     * @param {boolean} isVisible - Si le joueur est visible
     */
    updatePlayerVisibilityOnly(playerData, isVisible) {
        const playerInfo = this.extractPlayerInfo(playerData);

        // Parcourir toutes les cellules du vaisseau pour mettre à jour les event listeners
        let coordX = playerInfo.coordinates.x;
        let coordY = playerInfo.coordinates.y;

        for (let rowOffset = 0; rowOffset < playerInfo.ship.sizeY; rowOffset++) {
            for (let colOffset = 0; colOffset < playerInfo.ship.sizeX; colOffset++) {
                const cell = this.getTableCell(coordY, coordX);
                if (cell && cell.classList.contains('pc')) { // Seulement si c'est bien une cellule joueur
                    // Mettre à jour UNIQUEMENT les event listeners
                    this.removeEventListeners(cell);
                    this.setupEventListeners(cell, playerInfo, isVisible, false);
                    
                    // Gérer l'affichage selon la visibilité
                    if (isVisible) {
                        // S'assurer que l'image du vaisseau est visible
                        this.ensureShipImageVisible(cell, playerInfo, colOffset, rowOffset);
                    } else {
                        // Remplacer par le cercle jaune
                        this.replaceWithUnknownDisplay(cell);
                    }
                }
                coordX++;
            }
            coordY++;
            coordX = playerInfo.coordinates.x;
        }
    }

    /**
     * S'assure que l'image du vaisseau est visible dans la cellule
     * @param {HTMLElement} cell - La cellule
     * @param {Object} playerInfo - Informations du joueur
     * @param {number} colOffset - Offset de colonne
     * @param {number} rowOffset - Offset de ligne
     */
    ensureShipImageVisible(cell, playerInfo, colOffset, rowOffset) {
        const cellDiv = cell.querySelector('div');
        if (!cellDiv) return;

        // Vérifier si l'image du vaisseau existe déjà
        const existingShip = cellDiv.querySelector('.ship, .ship-reversed');

        // Supprimer le cercle jaune s'il existe
        const unknownElement = cellDiv.querySelector('#unknown-ship');
        if (unknownElement) {
            unknownElement.remove();
        }
        
        if (!existingShip) {
            // Créer et ajouter l'image du vaisseau
            const shipImageUrl = `/static/img/foreground/SHIPS/${playerInfo.ship.image}.png`;
            const shipReversedImageUrl = `/static/img/foreground/SHIPS/${playerInfo.ship.image}-reversed.png`;
            
            this.addShipImageToCell(cell, shipImageUrl, shipReversedImageUrl, 
                                  colOffset * 32, rowOffset * 32, playerInfo.ship.isReversed);
        } else {
            // S'assurer que la bonne orientation est affichée
            const shipElement = cellDiv.querySelector('.ship');
            const shipReversedElement = cellDiv.querySelector('.ship-reversed');
            
            if (shipElement && shipReversedElement) {
                if (playerInfo.ship.isReversed) {
                    shipElement.classList.add('hidden');
                    shipReversedElement.classList.remove('hidden');
                } else {
                    shipElement.classList.remove('hidden');
                    shipReversedElement.classList.add('hidden');
                }
            }
        }
    }

    /**
     * Remplace l'affichage du joueur par un cercle jaune (unknown)
     * @param {HTMLElement} cell - La cellule
     */
    replaceWithUnknownDisplay(cell) {
        const cellDiv = cell.querySelector('div');
        if (cellDiv) {
            // Supprimer les éléments de vaisseau visible
            const shipElements = cellDiv.querySelectorAll('.ship, .ship-reversed, .player-ship, .player-ship-reversed');
            const unknownElement = cellDiv.querySelector('#unknown-ship');
            
            shipElements.forEach(el => el.remove());
            
            if (!unknownElement) {
                cellDiv.appendChild(this.createUnknownElement());
                unknownElement.remove();
            }
            
        }
    }
}

// Instance globale améliorée
let enhancedDetectionSystem = new EnhancedPostMovementDetectionSystem();


function update_player_coord_fixed(data) {
    clear_path();
    const {
        size,
        user_id: targetUserId,
        player_id: targetPlayerId,
        start_id_array: startPosArray,
        destination_id_array: endPosArray,
        movement_remaining: movementRemaining,
        max_movement: maxMovement,
        end_x,
        end_y,
        modules_range
    } = data;
    
    // Détermination du type de traitement selon l'utilisateur
    if (current_player_id !== targetUserId) {
        // *** UTILISER LE SYSTÈME AMÉLIORÉ POUR LES AUTRES JOUEURS ***
        enhancedDetectionSystem.updateOtherPlayerAfterMove(data);
    } else {
        // Joueur actuel : utiliser la fonction existante
        update_player_pos_display_after_move(data);
    }
}

/**
 * FONCTIONS D'INITIALISATION
 */
function initializeEnhancedDetectionSystem(currentPlayerData, allPlayersData, allNpcsData) {
    enhancedDetectionSystem.initialize(currentPlayerData);
    enhancedDetectionSystem.updatePlayersData(allPlayersData);
    enhancedDetectionSystem.updateNpcsData(allNpcsData);
    enhancedDetectionSystem.performDetectionCheck();
}

function updateAllPlayersData(updatedPlayersData) {
    enhancedDetectionSystem.updatePlayersData(updatedPlayersData);
    enhancedDetectionSystem.performDetectionCheckWithoutReplacement();
}

function refreshDetectionSystem() {
    enhancedDetectionSystem.performDetectionCheckWithoutReplacement();
}

// Export pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnhancedPostMovementDetectionSystem,
        enhancedDetectionSystem,
        update_player_coord_fixed,
        initializeEnhancedDetectionSystem,
        updateAllPlayersData,
        refreshDetectionSystem
    };
}