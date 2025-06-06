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
            SHIPS: '/static/img/foreground/SHIPS/',
            IMG_NAME: '0.gif'
        }
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.player = null;
        this.gridCells = [];
        this.popover = null;
        this.popoverBackground = null;
        this.popoverText = null;
    }

    createPopover() {
        // Créer le popover (initialement invisible)
        this.popoverBackground = this.add.rectangle(0, 0, 120, 60, 0x2c3e50, 0.9);
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
    }

    showPopover(x, y, cell) {
        // Calculer la position du popover
        const cellCenterX = x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const cellCenterY = y * this.CELL_SIZE + this.CELL_SIZE / 2;
        
        // Positionner le popover au-dessus de la cellule
        const popoverX = cellCenterX;
        const popoverY = cellCenterY - this.CELL_SIZE - 20;
        
        // Contenu du popover avec informations sur la cellule
        const distance = this.calculateDistance(x, y, this.player.gridX, this.player.gridY);
        const popoverContent = `Cellule (${x}, ${y})\nDistance: ${distance}`;
        
        // Ajuster la taille du fond selon le contenu
        const textWidth = Math.max(100, popoverContent.length * 6);
        this.popoverBackground.setSize(textWidth, 50);
        
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
        }
    }

    adjustPopoverPosition(x, y) {
        // Obtenir les limites de la caméra
        const camera = this.cameras.main;
        const worldView = camera.worldView;
        
        let adjustedX = x;
        let adjustedY = y;
        
        // Ajuster X si le popover sort à droite
        if (x + 60 > worldView.right) {
            adjustedX = worldView.right - 60;
        }
        // Ajuster X si le popover sort à gauche
        if (x - 60 < worldView.left) {
            adjustedX = worldView.left + 60;
        }
        
        // Ajuster Y si le popover sort en haut
        if (y - 25 < worldView.top) {
            adjustedY = y + this.CELL_SIZE + 45; // Placer en dessous de la cellule
        }
        
        // Appliquer les ajustements
        this.popoverBackground.setPosition(adjustedX, adjustedY);
        this.popoverText.setPosition(adjustedX, adjustedY);
    }

    calculateDistance(x1, y1, x2, y2) {
        // Calculer la distance Manhattan (plus appropriée pour une grille)
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    preload() {
        // Créer des textures pour les cellules et le joueur
        this.load.image('background', `${this.PATHS.BACKGROUND}${this.SECTOR_DATA.sector.image}/${this.PATHS.IMG_NAME}`);
    }

    create() {
        console.log( this.game.config.backgroundColor)
        // image(0, 0) pour que l'image commence à s'afficher en haut à gauche.
        // setOrigine(0, 0) pour que l'image se place en haut à gauche.
        this.add.image(0, 0, 'background').setOrigin(0, 0)
        this.calculateGridSize();
        this.createGrid();
        this.createPlayer();
        this.createPopover();
        this.setupCamera();
        this.setupInput();
        
        // Gérer le redimensionnement
        this.scale.on('resize', this.handleResize, this);
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
                    this.movePlayerTo(x, y);
                });
                
                cell.on('pointerover', () => {
                    // ajouter une couleur sur la case au passage de la souris.
                    cell.setFillStyle(0x3498db, 0.6);
                    this.showPopover(x, y, cell);
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
    createPlayer() {
        // Créer le joueur aux coordonnées spécifiées (10, 19)
        const playerX = 10;
        const playerY = 19;
        
        this.player = this.add.circle(
            playerX * this.CELL_SIZE + this.CELL_SIZE / 2,
            playerY * this.CELL_SIZE + this.CELL_SIZE / 2,
            this.CELL_SIZE / 3,
            0xe74c3c
        );
        
        this.player.setStrokeStyle(2, 0xc0392b);
        this.player.gridX = playerX;
        this.player.gridY = playerY;
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

    movePlayerTo(targetX, targetY) {
        // Vérifier que les coordonnées sont valides
        if (targetX >= 0 && targetX < this.MAX_GRID_SIZE && 
            targetY >= 0 && targetY < this.MAX_GRID_SIZE) {
            
            // Cacher le popover pendant le déplacement
            this.hidePopover();
            
            // Animer le déplacement du joueur
            this.tweens.add({
                targets: this.player,
                x: targetX * this.CELL_SIZE + this.CELL_SIZE / 2,
                y: targetY * this.CELL_SIZE + this.CELL_SIZE / 2,
                duration: 300,
                ease: 'Power2'
            });
            
            // Mettre à jour les coordonnées du joueur
            this.player.gridX = targetX;
            this.player.gridY = targetY;
        }
    }

    update() {
        // Gérer le déplacement au clavier
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.movePlayerTo(this.player.gridX - 1, this.player.gridY);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.movePlayerTo(this.player.gridX + 1, this.player.gridY);
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.movePlayerTo(this.player.gridX, this.player.gridY - 1);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.movePlayerTo(this.player.gridX, this.player.gridY + 1);
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
    transparent: true,
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