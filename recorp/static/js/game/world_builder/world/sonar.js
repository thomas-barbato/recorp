class Sonar {
    constructor(observable_zone, coordinates, view_range) {
        this.boardSize = 40;
        this.observable_zone = observable_zone;
        this.mainPlayerPos = document.getElementsByClassName('player-ship-start-pos');
        this.playerPos = coordinates;
        this.range = view_range;
        this.sonarActive = false;
        this.sonarAngle = 0;
        this.sonarInterval = null;
        this.oldY = 0;
        this.oldX = 0;
        
        this.initBoard();
        this.setupEventListeners();
    }

    initBoard() {
        
    }

    setupEventListeners() {
        const playerCell = document.querySelectorAll('.ship-pos');

        for(let i = 0 ; i < playerCell.length; i++){
            playerCell[i].addEventListener('mouseenter', () => {
                this.activateSonar();
            });
            playerCell[i].addEventListener('mouseleave', () => {
                this.deactivateSonar();
            });
        }
    }

    activateSonar() {
        if (this.sonarActive) return;
        
        this.sonarActive = true;
        this.showRange();
        this.startSonarSweep();
    }

    deactivateSonar() {
        this.sonarActive = false;
        this.hideRange();
        this.stopSonarSweep();
    }

    showRange() {
        this.observable_zone.forEach(zone => {
            zone.classList.add('in-range')
            zone.classList.remove('hidden');
        });
    }

    hideRange() {
        this.observable_zone.forEach(zone => {
            zone.classList.remove('in-range', 'sonar-sweep')
            zone.classList.add('hidden');
        });
    }

    startSonarSweep() {
        this.sonarAngle = 0;
        this.sonarInterval = setInterval(() => {
            this.updateSonarSweep();
            this.sonarAngle += 15; // Vitesse de rotation
            if (this.sonarAngle >= 360) {
                this.sonarAngle = 0;
            }
        }, 50);
    }

    stopSonarSweep() {
        if (this.sonarInterval) {
            clearInterval(this.sonarInterval);
            this.sonarInterval = null;
        }
    }

    updateSonarSweep() {
        // Retirer l'effet sonar de toutes les cellules
        for (let i = 0 ; i < observable_zone.length; i++){
            observable_zone[i].classList.remove('sonar-sweep')
        }

        const { x: px, y: py } = this.playerPos;
        const angleRad = (this.sonarAngle * Math.PI) / 180;
        const sweepWidth = 30; // Largeur du faisceau en degrés

        // Appliquer l'effet sonar aux cellules dans le faisceau
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (x === px && y === py) continue;
                
                const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
                if (distance <= this.range) {
                    const cellAngle = Math.atan2(y - py, x - px) * 180 / Math.PI;
                    let normalizedAngle = cellAngle < 0 ? cellAngle + 360 : cellAngle;
                    let normalizedSonarAngle = this.sonarAngle;
                    
                    // Calculer la différence d'angle
                    let angleDiff = Math.abs(normalizedAngle - normalizedSonarAngle);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;
                    
                    if (angleDiff <= sweepWidth / 2) {
                        let cell = document.getElementById(`${y}_${x}`)
                        cell.querySelector('#field-of-view').classList.add('sonar-sweep');
                    }
                }
            }
        }
    }

    setOldPositions(oldY, oldX){
        this.oldY = oldY;
        this.oldX = oldX;
    }
}