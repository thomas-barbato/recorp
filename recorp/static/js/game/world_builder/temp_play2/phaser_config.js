class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.CELL_SIZE = 32;
        this.MAX_GRID_SIZE = 40;
        this.MIN_GRID_SIZE = 10;
        this.SECTOR_DATA = map_informations;
        this.PATHS = {
            BACKGROUND: '/static/img/background/',
            FOREGROUND: '/static/img/foreground/',
            USERS: '/static/img/users/',
            SHIPS: '/static/img/foreground/SHIPS/',
            UX : '/static/img/ux/',
            IMG_NAME: '0.gif'
        }
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.player = null;
        this.gridCells = [];
        this.popover = null;
        this.popoverBackground = null;
        this.popoverText = null;
        this.popoverImage = null; // Nouvelle propriété pour l'image du popover
        this.otherPlayers = new Map(); // Map pour stocker les autres joueurs
        this.npcs = new Map(); // Map pour stocker les npc
        this.staticElements = new Map(); // Map pour stocker les éléments statiques
        this.lastMoveTime = 0; // Pour contrôler la vitesse de déplacement
        this.lastCollisionWarning = 0; // Pour éviter le spam de warnings
        this.playerSize = 1 // Taille du joueur principal (peut être modifiée)
    }

    calculateDistance(x1, y1, x2, y2) {
        // Calculer la distance Manhattan (plus appropriée pour une grille)
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    getPlayerSize(){
        this.SECTOR_DATA.pc.forEach(player => {
            if(player.user.user == current_user_id){
                return player.ship.size.x * player.ship.size.y;
            }
        })
    }

    getSizeFromValue(sizeValue) {
        const sizeMap = {
            1: { x: 1, y: 1 },
            2: { x: 2, y: 1 },
            3: { x: 3, y: 1 },
            4: { x: 2, y: 2 },
            6: { x: 2, y: 3 },
            9: { x: 3, y: 3 },
            16: { x: 4, y: 4 }
        };
        console.log(`sizeValue = ${sizeValue}`)
        return sizeMap[sizeValue] || { x: 1, y: 1 };
    }

    createSectorElements() {
        // Vérifier si les données des éléments statiques existent
        if (!this.SECTOR_DATA.sector_element || !Array.isArray(this.SECTOR_DATA.sector_element)) {
            console.log('Aucune donnée d\'élément statique trouvée');
            return;
        }

        console.log(this.SECTOR_DATA.sector_element)

        this.SECTOR_DATA.sector_element.forEach(elementData => {
            console.log(elementData)
            const elementId = `${elementData.data.type}_${elementData.item_id}`;
            const coordinates = elementData.data.coordinates;
            const elementSize = this.getSizeFromValue(elementData.size.x * elementData.size.y);
            const elementType = elementData.data.type; // 'planet', 'warpzone', 'asteroid'

            // Vérifier que les coordonnées sont valides
            if (coordinates && coordinates.x >= 0 && coordinates.x < this.MAX_GRID_SIZE && 
                coordinates.y >= 0 && coordinates.y < this.MAX_GRID_SIZE) {
                
                // Créer le sprite de l'élément
                const elementSprite = this.add.sprite(
                    coordinates.x * this.CELL_SIZE + this.CELL_SIZE / 2,
                    coordinates.y * this.CELL_SIZE + this.CELL_SIZE / 2,
                    `${elementData.animations}`
                );
                
                // Adapter la taille selon les dimensions calculées
                const displayWidth = elementSize.x * this.CELL_SIZE;
                const displayHeight = elementSize.y * this.CELL_SIZE;
                elementSprite.setDisplaySize(displayWidth, displayHeight);
                elementSprite.setDepth(400); // Sous les vaisseaux mais au-dessus de la grille
                
                // Rendre l'élément interactif
                elementSprite.setInteractive();
                
                // Ajouter les événements de survol
                elementSprite.on('pointerover', () => {
                    this.showStaticElementPopover(coordinates.x, coordinates.y, elementData);
                });
                
                elementSprite.on('pointerout', () => {
                    this.hidePopover();
                });
                
                // Stocker l'élément statique
                this.staticElements.set(elementId, {
                    sprite: elementSprite,
                    data: elementData,
                    gridX: coordinates.x,
                    gridY: coordinates.y,
                    size: elementSize,
                    type: elementType
                });
            }

            console.log(`Élément statique créé: ${elementType} à (${coordinates.x}, ${coordinates.y}) taille ${elementSize.x}x${elementSize.y}`);
        });
    }

    createPopover() {
        // Créer le popover (initialement invisible)
        this.popoverBackground = this.add.rectangle(0, 0, 120, 80, 0x2c3e50, 0.9);
        this.popoverBackground.setStrokeStyle(2, 0x34495e);
        this.popoverBackground.setVisible(false);
        this.popoverBackground.setDepth(1000); // Mettre au premier plan
        
        this.popoverText = this.add.text(0, 0, '', {
            fontSize: '12px',
            fill: '#ecf0f1',
            fontFamily: 'Arial',
            align: 'center'
        });
        this.popoverText.setOrigin(0.5);
        this.popoverText.setVisible(false);
        this.popoverText.setDepth(1001); // Mettre au-dessus du fond
        
        // Créer l'image du popover (pour les joueurs)
        this.popoverImage = this.add.image(0, 0, '');
        this.popoverImage.setVisible(false);
        this.popoverImage.setDepth(1002);
    }

    showPopover(x, y, cell, isPlayer = false, playerData = null) {
        // Calculer la position du popover
        const cellCenterX = x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const cellCenterY = y * this.CELL_SIZE + this.CELL_SIZE / 2;
        
        // Positionner le popover au-dessus de la cellule
        const popoverX = cellCenterX;
        const popoverY = cellCenterY - this.CELL_SIZE - 30;
        
        let popoverContent;
        let popoverWidth = 125;
        let popoverHeight = 125;
        
        if (isPlayer && playerData) {
            // Contenu pour un joueur
            popoverContent = `${playerData.user.name}\nCoord: (${playerData.user.coordinates.x}, ${playerData.user.coordinates.y})`;
            popoverWidth = Math.max(150, playerData.user.name.length * 8);
            popoverHeight = 150;
            
            // Afficher l'image du joueur si elle existe
            if (playerData.user.image) {
                this.popoverImage.setTexture(`player_${playerData.user.player}`);
                this.popoverImage.setPosition(popoverX, popoverY - 15);
                this.popoverImage.setDisplaySize(65,80)
                this.popoverImage.setVisible(true);
            }
        } else {
            // Contenu pour une cellule normale
            const distance = this.calculateDistance(x, y, this.player.gridX, this.player.gridY);
            popoverContent = `Cellule (${x}, ${y})\nDistance: ${distance}`;
        }
        
        // Ajuster la taille du fond selon le contenu
        this.popoverBackground.setSize(popoverWidth, popoverHeight);
        
        // Positionner et afficher le popover
        this.popoverBackground.setPosition(popoverX, popoverY);
        this.popoverText.setPosition(popoverX, isPlayer ? popoverY + 15 : popoverY);
        this.popoverText.setText(popoverContent);
        
        this.popoverBackground.setVisible(true);
        this.popoverText.setVisible(true);
        
        // Ajuster la position si le popover sort de l'écran
        this.adjustPopoverPosition(popoverX, popoverY);
    }

    showStaticElementPopover(x, y, elementData) {
        const cellCenterX = x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const cellCenterY = y * this.CELL_SIZE + this.CELL_SIZE / 2;
        
        const popoverX = cellCenterX;
        const popoverY = cellCenterY - this.CELL_SIZE - 30;
        
        const elementSize = this.getSizeFromValue(elementData.size);
        const popoverContent = `${elementData.data.name || elementData.data.type}\nTaille: ${elementSize.x}x${elementSize.y}\nCoord: (${x}, ${y})`;
        const popoverWidth = Math.max(150, (elementData.data.name || elementData.data.type).length * 8);
        const popoverHeight = 100;
        
        // Ajuster la taille du fond selon le contenu
        this.popoverBackground.setSize(popoverWidth, popoverHeight);
        
        // Positionner et afficher le popover
        this.popoverBackground.setPosition(popoverX, popoverY);
        this.popoverText.setPosition(popoverX, popoverY);
        this.popoverText.setText(popoverContent);
        
        this.popoverBackground.setVisible(true);
        this.popoverText.setVisible(true);
        
        // Ajuster la position si le popover sort de l'écran
        this.adjustPopoverPosition(popoverX, popoverY);
    }

    hidePopover() {
        if (this.popoverBackground && this.popoverText) {
            this.popoverBackground.setVisible(false);
            this.popoverText.setVisible(false);
            this.popoverImage.setVisible(false);
        }
    }

    adjustPopoverPosition(x, y) {
        // Obtenir les limites de la caméra
        const camera = this.cameras.main;
        const worldView = camera.worldView;
        
        let adjustedX = x;
        let adjustedY = y;
        
        // Ajuster X si le popover sort à droite
        if (x + 75 > worldView.right) {
            adjustedX = worldView.right - 75;
        }
        // Ajuster X si le popover sort à gauche
        if (x - 75 < worldView.left) {
            adjustedX = worldView.left + 75;
        }
        
        // Ajuster Y si le popover sort en haut
        if (y - 40 < worldView.top) {
            adjustedY = y + this.CELL_SIZE + 60; // Placer en dessous de la cellule
        }
        
        // Appliquer les ajustements
        this.popoverBackground.setPosition(adjustedX, adjustedY);
        this.popoverText.setPosition(adjustedX, adjustedY + (this.popoverImage.visible ? 15 : 0));
        if (this.popoverImage.visible) {
            this.popoverImage.setPosition(adjustedX, adjustedY - 25);
        }
    }

    calculateGridSize() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Calculer le nombre de cellules pouvant être affichées
        this.gridWidth = Math.min(Math.floor(gameWidth / this.CELL_SIZE), this.MAX_GRID_SIZE);
        this.gridHeight = Math.min(Math.floor(gameHeight / this.CELL_SIZE), this.MAX_GRID_SIZE);
        
        // S'assurer du minimum pour mobile
        this.gridWidth = Math.max(this.gridWidth, this.MIN_GRID_SIZE);
        this.gridHeight = Math.max(this.gridHeight, this.MIN_GRID_SIZE);
    }

    createGrid() {
        this.gridCells = [];
        
        for (let x = 0; x < this.MAX_GRID_SIZE; x++) {
            this.gridCells[x] = [];
            for (let y = 0; y < this.MAX_GRID_SIZE; y++) {
                // Créer une cellule de grille
                const cell = this.add.rectangle(
                    x * this.CELL_SIZE + this.CELL_SIZE / 2,
                    y * this.CELL_SIZE + this.CELL_SIZE / 2,
                    this.CELL_SIZE - 1,
                    this.CELL_SIZE - 1,
                    0x3498db,
                    0.0
                );
                
                // ajouter une couleur de bordures aux cases de la grille.
                cell.setStrokeStyle(0, 0x2980b9);
                cell.setInteractive();
                
                // Ajouter les événements de clic
                cell.on('pointerdown', () => {
                    console.log(`Cellule cliquée: X=${x}, Y=${y}`);
                    // Vérifier collision avant de bouger
                    const playerSize = this.playerSize || 1;
                    const collisionCheck = this.checkCollision(x, y, playerSize);
                    if (!collisionCheck.hasCollision && this.isValidPosition(x, y, playerSize)) {
                        this.movePlayerTo(x, y);
                    } else if (collisionCheck.hasCollision) {
                        this.showCollisionWarning(collisionCheck);
                    }
                });
                
                cell.on('pointerover', () => {
                    // Vérifier s'il y a un joueur sur cette cellule ou ses environs
                    let collisionInfo = null;
                    
                    // Vérifier contre tous les joueurs et leurs zones d'occupation
                    for (let [playerId, playerObj] of this.otherPlayers) {
                        const playerCells = this.getOccupiedCells(
                            playerObj.gridX, 
                            playerObj.gridY, 
                            playerObj.data.ship.size || 1
                        );
                        
                        if (playerCells.some(cell => cell.x === x && cell.y === y)) {
                            collisionInfo = {
                                hasCollision: true,
                                type: 'player',
                                player: playerObj.data,
                                playerId: playerId
                            };
                            break;
                        }
                    }
                    
                    // Vérifier contre les éléments statiques si pas de joueur trouvé
                    if (!collisionInfo) {
                        for (let [elementId, elementObj] of this.staticElements) {
                            const elementCells = this.getOccupiedCells(
                                elementObj.gridX, 
                                elementObj.gridY, 
                                elementObj.size.x * elementObj.size.y
                            );
                            
                            if (elementCells.some(cell => cell.x === x && cell.y === y)) {
                                collisionInfo = {
                                    hasCollision: true,
                                    type: 'static',
                                    element: elementObj.data,
                                    elementId: elementId
                                };
                                break;
                            }
                        }
                    }
                    
                    if (collisionInfo && collisionInfo.hasCollision) {
                        if (collisionInfo.type === 'player') {
                            cell.setFillStyle(0xe74c3c, 0.3); // Rouge pour joueur
                            this.showPopover(x, y, cell, true, collisionInfo.player);
                        } else if (collisionInfo.type === 'static') {
                            cell.setFillStyle(0x9b59b6, 0.3); // Violet pour élément statique
                            this.showStaticElementPopover(x, y, collisionInfo.element);
                        }
                    } else {
                        // Comportement normal pour cellule vide
                        cell.setFillStyle(0x3498db, 0.6);
                        this.showPopover(x, y, cell);
                    }
                });
                
                cell.on('pointerout', () => {
                    // supprime la couleur ajoutée au passage de la souris. 
                    cell.setFillStyle(0x3498db, 0.0);
                    this.hidePopover();
                });
                
                this.gridCells[x][y] = cell;
            }
        }
    }

    createPlayers() {
        // Vérifier si les données des joueurs existent
        if (!this.SECTOR_DATA.pc || !Array.isArray(this.SECTOR_DATA.pc)) {
            console.log('Aucune donnée de joueur trouvée ou format incorrect');
            return;
        }

        // Parcourir tous les joueurs dans les données du secteur
        this.SECTOR_DATA.pc.forEach(playerData => {

            const playerId = `pc_${playerData.player}`;
            const coordinates = playerData.user.coordinates;
            const shipId = playerData.ship.ship_id;
            const shipSize_x = playerData.ship.size.x * 32 || 1;
            const shipSize_y = playerData.ship.size.y * 32 || 1;

            if(current_user_id != playerData.user.user){

                // Vérifier que les coordonnées sont valides
                if (coordinates && coordinates.x >= 0 && coordinates.x < this.MAX_GRID_SIZE && 
                    coordinates.y >= 0 && coordinates.y < this.MAX_GRID_SIZE) {
                    
                    // Créer le vaisseau du joueur
                    const shipSprite = this.add.sprite(
                        coordinates.x * this.CELL_SIZE + this.CELL_SIZE / 2,
                        coordinates.y * this.CELL_SIZE + this.CELL_SIZE / 2,
                        `ship_${shipId}`
                    );
                    
                    // Adapter la taille du vaisseau selon ses caractéristiques
                    shipSprite.setDisplaySize(shipSize_x, shipSize_y);
                    shipSprite.setDepth(500); // Au-dessus de la grille mais sous le popover
                    
                    // Rendre le vaisseau interactif
                    shipSprite.setInteractive();
                    
                    // Ajouter les événements de survol
                    shipSprite.on('pointerover', () => {
                        this.showPopover(coordinates.x, coordinates.y, null, true, playerData);
                    });
                    
                    shipSprite.on('pointerout', () => {
                        this.hidePopover();
                    });
                    
                    // Ajouter le clic pour des interactions futures
                    shipSprite.on('pointerdown', () => {
                        console.log(`Joueur cliqué: ${playerData.user.name} (${playerId})`);
                        // Ici vous pouvez ajouter d'autres interactions avec le joueur
                    });
            
                    // Stocker le joueur avec son ID
                    this.otherPlayers.set(playerId, {
                        sprite: shipSprite,
                        data: playerData,
                        gridX: coordinates.x,
                        gridY: coordinates.y
                    });
                }
                
                console.log(`Joueur créé: ${playerData.user.name} à (${coordinates.x}, ${coordinates.y})`);
            }else{

                // Créer le vaisseau du joueur
                this.player = this.add.sprite(
                    coordinates.x * this.CELL_SIZE + this.CELL_SIZE / 2,
                    coordinates.y * this.CELL_SIZE + this.CELL_SIZE / 2,
                    `ship_${shipId}`
                );
                this.player.setDisplaySize(shipSize_x, shipSize_y);
                this.player.setDepth(500)
                this.player.gridX = coordinates.x;
                this.player.gridY = coordinates.y;
                
            }
        });
    }

    createNpcs() {
        // Vérifier si les données des joueurs existent
        if (!this.SECTOR_DATA.npc || !Array.isArray(this.SECTOR_DATA.npc)) {
            console.log('Aucune donnée de joueur trouvée ou format incorrect');
            return;
        }

        // Parcourir tous les joueurs dans les données du secteur
        this.SECTOR_DATA.npc.forEach(npcData => {
            const npcId = `npc_${npcData.npc.id}`;
            const coordinates = npcData.npc.coordinates;
            const shipSize_x = npcData.ship.size.x * 32 || 1;
            const shipSize_y = npcData.ship.size.y * 32 || 1;
            
            // Vérifier que les coordonnées sont valides
            if (coordinates && coordinates.x >= 0 && coordinates.x < this.MAX_GRID_SIZE && 
                coordinates.y >= 0 && coordinates.y < this.MAX_GRID_SIZE) {
                
                // Créer le vaisseau du joueur
                const shipSprite = this.add.sprite(
                    coordinates.x * this.CELL_SIZE + this.CELL_SIZE / 2,
                    coordinates.y * this.CELL_SIZE + this.CELL_SIZE / 2,
                    `ship_${npcData.ship.ship_id}`
                );
                
                // Adapter la taille du vaisseau selon ses caractéristiques
                shipSprite.setDisplaySize(shipSize_x, shipSize_y);
                shipSprite.setDepth(500); // Au-dessus de la grille mais sous le popover
                
                // Rendre le vaisseau interactif
                shipSprite.setInteractive();
                
                // Ajouter les événements de survol
                shipSprite.on('pointerover', () => {
                    this.showPopover(coordinates.x, coordinates.y, null, false, npcData);
                });
                
                shipSprite.on('pointerout', () => {
                    this.hidePopover();
                });
                
                // Ajouter le clic pour des interactions futures
                shipSprite.on('pointerdown', () => {
                    console.log(`npc cliqué`);
                    // Ici vous pouvez ajouter d'autres interactions avec le joueur
                });
                
                // Stocker le joueur avec son ID
                this.npcs.set(npcId, {
                    sprite: shipSprite,
                    data: npcData,
                    gridX: coordinates.x,
                    gridY: coordinates.y,
                    sizeX: shipSize_x,
                    sizeY: shipSize_y,
                });
            }
        });
    }

    setupCamera() {
        // Configurer la caméra pour suivre le joueur
        this.cameras.main.setBounds(
            -50, 
            -50, 
            this.MAX_GRID_SIZE * this.CELL_SIZE + 100, 
            this.MAX_GRID_SIZE * this.CELL_SIZE + 100
        );
        
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setFollowOffset(0, 0);
        
        // Ajuster le zoom selon la taille de l'écran
        this.updateCameraView();
    }

    updateCameraView() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Calculer le zoom pour afficher le bon nombre de cellules
        const zoomX = gameWidth / (this.gridWidth * this.CELL_SIZE);
        const zoomY = gameHeight / (this.gridHeight * this.CELL_SIZE);
        const zoom = Math.min(zoomX, zoomY);
        
        this.cameras.main.setZoom(zoom);
    }

    setupInput() {
        // Gérer les entrées clavier pour le déplacement
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Définit le curseur de base.
        this.input.manager.setCursor({ cursor: 'crosshair' });
        
        // Ajouter les touches WASD
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    }

    checkCollision(x, y, playerSize = 1) {
        // Calculer toutes les cases que le joueur occuperait
        const occupiedCells = this.getOccupiedCells(x, y, playerSize);
        
        // Vérifier contre tous les autres joueurs
        for (let [playerId, playerObj] of this.otherPlayers) {
            const otherPlayerCells = this.getOccupiedCells(
                playerObj.gridX, 
                playerObj.gridY, 
                playerObj.data.ship.size.x * playerObj.data.ship.size.y
            );
            
            // Vérifier s'il y a une intersection entre les cases
            for (let myCell of occupiedCells) {
                for (let otherCell of otherPlayerCells) {
                    if (myCell.x === otherCell.x && myCell.y === otherCell.y) {
                        return {
                            hasCollision: true,
                            type: 'player',
                            player: playerObj.data,
                            playerId: playerId,
                            collisionCell: myCell
                        };
                    }
                }
            }
        }
        
        // Vérifier contre tous les NPCs
        for (let [npcId, npcObj] of this.npcs) {
            const npcCells = this.getOccupiedCells(
                npcObj.gridX, 
                npcObj.gridY, 
                npcObj.data.ship.size.x * npcObj.data.ship.size.y
            );
            
            for (let myCell of occupiedCells) {
                for (let npcCell of npcCells) {
                    if (myCell.x === npcCell.x && myCell.y === npcCell.y) {
                        return {
                            hasCollision: true,
                            type: 'npc',
                            npc: npcObj.data,
                            npcId: npcId,
                            collisionCell: myCell
                        };
                    }
                }
            }
        }
        
        // Vérifier contre tous les éléments statiques
        for (let [elementId, elementObj] of this.staticElements) {
            const elementCells = this.getOccupiedCells(
                elementObj.gridX, 
                elementObj.gridY, 
                elementObj.size.x * elementObj.size.y
            );
            
            for (let myCell of occupiedCells) {
                for (let elementCell of elementCells) {
                    if (myCell.x === elementCell.x && myCell.y === elementCell.y) {
                        return {
                            hasCollision: true,
                            type: 'static',
                            element: elementObj.data,
                            elementId: elementId,
                            collisionCell: myCell
                        };
                    }
                }
            }
        }
        
        return { hasCollision: false };
    }

    getOccupiedCells(centerX, centerY, size) {
        const cells = [];
        const halfSize = Math.floor(size / 3);
        
        // Pour les tailles impaires, le centre est au milieu
        // Pour les tailles paires, on décale légèrement
        const startX = centerX - halfSize;
        const startY = centerY - halfSize;
        const endX = startX + size - 1;
        const endY = startY + size - 1;
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                // Vérifier que les coordonnées sont dans les limites de la grille
                if (x >= 0 && x < this.MAX_GRID_SIZE && y >= 0 && y < this.MAX_GRID_SIZE) {
                    cells.push({ x, y });
                }
            }
        }
        
        return cells;
    }

    isValidPosition(x, y, playerSize = 1) {
        // Vérifier que toutes les cases occupées sont dans les limites
        const occupiedCells = this.getOccupiedCells(x, y, playerSize);
        
        for (let cell of occupiedCells) {
            if (cell.x < 0 || cell.x >= this.MAX_GRID_SIZE || 
                cell.y < 0 || cell.y >= this.MAX_GRID_SIZE) {
                return false;
            }
        }
        
        return true;
    }

    showCollisionWarning(collisionData) {
        let warningMessage = '';
        
        switch(collisionData.type) {
            case 'player':
                warningMessage = `Collision avec ${collisionData.player.user.name}!`;
                break;
            case 'npc':
                warningMessage = `Collision avec NPC!`;
                break;
            case 'static':
                warningMessage = `Collision avec ${collisionData.element.name || collisionData.element.type}!`;
                break;
            default:
                warningMessage = 'Collision détectée!';
        }
        
        // Créer un message de collision temporaire
        const warningText = this.add.text(
            this.player.x,
            this.player.y - 40,
            warningMessage,
            {
                fontSize: '14px',
                fill: '#e74c3c',
                fontFamily: 'Arial',
                backgroundColor: '#2c3e50',
                padding: { x: 8, y: 4 }
            }
        );
        warningText.setOrigin(0.5);
        warningText.setDepth(2000);

        // Faire disparaître le message après 2 secondes
        this.tweens.add({
            targets: warningText,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                warningText.destroy();
            }
        });

        // Animation de secousse pour le joueur
        this.tweens.add({
            targets: this.player,
            x: this.player.x + 5,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Power2'
        });
    }

    movePlayerTo(targetX, targetY) {
        const playerSize = this.playerSize || 1;
        console.log("dans movePlayerTo");
        console.log(playerSize);
        console.log("=========");
        
        if (!this.isValidPosition(targetX, targetY, playerSize)) {
            console.log("Position invalide - sort des limites de la grille");
            return;
        }
        
        const collisionCheck = this.checkCollision(targetX, targetY, playerSize);
        
        if (collisionCheck.hasCollision) {
            console.log(`Collision détectée avec ${collisionCheck.type}`);
            this.showCollisionWarning(collisionCheck);
            return;
        }
        
        this.hidePopover();
        
        this.tweens.add({
            targets: this.player,
            x: targetX * this.CELL_SIZE + this.CELL_SIZE / 2,
            y: targetY * this.CELL_SIZE + this.CELL_SIZE / 2,
            duration: 300,
            ease: 'Power2'
        });
        
        this.player.gridX = targetX;
        this.player.gridY = targetY;
    }

    preload_sectorElements() {
        console.log(this.SECTOR_DATA.sector_element)
        if (this.SECTOR_DATA.sector_element && Array.isArray(this.SECTOR_DATA.sector_element)) {
            this.SECTOR_DATA.sector_element.forEach(elementData => {
                // Charger l'image de l'élément selon son type
                const imageKey = `${elementData.animations}`;
                const imagePath = `${this.PATHS.FOREGROUND}${elementData.data.type.toUpperCase()}/${elementData.animations}/0.gif`;
                this.load.image(imageKey, imagePath);
            });
        }
    }

    preload_npc(){
        if (this.SECTOR_DATA.npc && Array.isArray(this.SECTOR_DATA.npc)) {
            this.SECTOR_DATA.npc.forEach(npcData => {
                // Charger l'image du vaisseau
                if (npcData.ship && npcData.ship.image) {
                    this.load.image(`ship_${npcData.ship.ship_id}`,`${this.PATHS.SHIPS}${npcData.ship.image}.png`);
                }
            });
        }
    }

    preload_pc(){
        if (this.SECTOR_DATA.pc && Array.isArray(this.SECTOR_DATA.pc)) {
            this.SECTOR_DATA.pc.forEach(playerData => {
                // Charger l'image du vaisseau
                if (playerData.ship && playerData.ship.image) {
                    this.load.image(`ship_${playerData.ship.ship_id}`, `${this.PATHS.SHIPS}${playerData.ship.image}.png`);
                }
                
                // Charger l'image du joueur pour le popover
                if (playerData.user && playerData.user.image) {
                    this.load.image(`player_${playerData.user.player}`, `${this.PATHS.USERS}${playerData.user.player}/${playerData.user.image}`);
                }
            });
        }
    }

    preload() {
        // Créer des textures pour les cellules et le joueur
        this.load.image('background', `${this.PATHS.BACKGROUND}${this.SECTOR_DATA.sector.image}/${this.PATHS.IMG_NAME}`);
        this.playerSize = this.getPlayerSize();
        // Charger les images des npc
        this.preload_npc()
        // Charger les images des vaisseaux et des joueurs
        this.preload_pc();
        // Charger les elements autre du secteur
        this.preload_sectorElements()   
    }

    create() {
        // image(0, 0) pour que l'image commence à s'afficher en haut à gauche.
        // setOrigine(0, 0) pour que l'image se place en haut à gauche.
        this.add.image(0, 0, 'background').setOrigin(0, 0)
        this.calculateGridSize();
        this.createGrid();
        this.createSectorElements();
        this.createPlayers();
        this.createNpcs();
        this.createPopover();
        this.setupCamera();
        this.setupInput();
        
        // Gérer le redimensionnement
        this.scale.on('resize', this.handleResize, this);
    }

    update() {
        // Gérer le déplacement au clavier avec vérification de collision
        let newX = this.player.gridX;
        let newY = this.player.gridY;
        let shouldMove = false;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            newX = this.player.gridX - 1;
            shouldMove = true;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            newX = this.player.gridX + 1;
            shouldMove = true;
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            newY = this.player.gridY - 1;
            shouldMove = true;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            newY = this.player.gridY + 1;
            shouldMove = true;
        }

        // Si un mouvement est demandé, vérifier les collisions
        if (shouldMove) {
            if (!this.lastMoveTime || this.time.now - this.lastMoveTime > 200) {
                const collisionCheck = this.checkCollision(newX, newY, this.playerSize);
                
                if (!collisionCheck.hasCollision && this.isValidPosition(newX, newY, this.playerSize)) {
                    this.movePlayerTo(newX, newY);
                    this.lastMoveTime = this.time.now;
                } else {
                    if (!this.lastCollisionWarning || this.time.now - this.lastCollisionWarning > 1000) {
                        if (collisionCheck.hasCollision) {
                            this.showCollisionWarning(collisionCheck);
                        }
                        this.lastCollisionWarning = this.time.now;
                    }
                }
            }
        }
        
        // Mettre à jour la position du popover si il est visible
        if (this.popoverBackground && this.popoverBackground.visible) {
            // Le popover suit automatiquement la caméra grâce au système de coordonnées de Phaser
        }
    }

    handleResize() {
        this.calculateGridSize();
        this.updateCameraView();
    }
}

// Configuration du jeu

const game_canvas = document.querySelector("#gameCanvas");
const game_canvas_rect = game_canvas.getBoundingClientRect();
const config = {
    type: Phaser.AUTO,
    width: Math.min(game_canvas_rect.width, 1280),
    height: Math.min(game_canvas_rect.height, 736),
    parent: game_canvas,
    scene: GameScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Créer et lancer le jeu
const game = new Phaser.Game(config);

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    game.scale.resize(
        Math.min(window.innerWidth - 20, 1280),
        Math.min(window.innerHeight - 20, 736)
    );
});