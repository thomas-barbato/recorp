class Sonar {
    constructor(observable_zone, coordinates, view_range) {
        this.boardSize = 40;
        this.observable_zone = observable_zone;
        this.mainPlayerPos = document.getElementsByClassName('player-ship-start-pos');
        this.playerSize = document.querySelectorAll('.ship-pos').length;
        this.playerPos = coordinates;
        this.range = view_range;
        this.sonarActive = false;
        this.sonarAngle = 0;
        this.sonarInterval = null;
        // Stocker les références des event listeners
        this.eventListeners = [];
        this.playerCells = [];
        
        // Détection des appareils mobiles
        this.isMobile = this.detectMobileDevice();
        
        // Nettoyer d'abord les anciens listeners s'ils existent
        this.cleanupAllSonarListeners();
        this.setupEventListeners();
    }

    // Méthode pour détecter si l'utilisateur est sur mobile
    detectMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Vérification par user agent
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUserAgent = mobileRegex.test(userAgent);
        
        // Vérification par taille d'écran
        const isMobileScreen = window.innerWidth <= 768;
        
        // Vérification du support tactile
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileUserAgent || (isMobileScreen && hasTouchSupport);
    }

    updateObservableZone(observable_zone){
        this.observable_zone = observable_zone;
    }

    updateMainPlayerPos(){
        this.mainPlayerPos = document.getElementsByClassName('player-ship-start-pos');
    }

    // Nouvelle méthode pour nettoyer tous les listeners sonar existants sur la grille
    cleanupAllSonarListeners() {
        // Récupérer TOUTES les cellules qui pourraient avoir des listeners sonar
        const allShipCells = document.querySelectorAll('.ship-pos');
        
        allShipCells.forEach(cell => {
            // Cloner l'élément pour supprimer tous ses event listeners
            const newCell = cell.cloneNode(true);
            cell.parentNode.replaceChild(newCell, cell);
        });
        
        // Nettoyer aussi le bouton radar s'il existe
        const radarButton = document.querySelector('#sonar-toggle-btn');
        if (radarButton) {
            const newButton = radarButton.cloneNode(true);
            radarButton.parentNode.replaceChild(newButton, radarButton);
        }
        
        // Vider le tableau des listeners
        this.eventListeners = [];
    }

    setupEventListeners() {
        if (this.isMobile) {
            this.setupMobileEventListeners();
        } else {
            this.setupDesktopEventListeners();
        }
    }

    setupDesktopEventListeners() {
        // Récupérer les cellules actuelles du joueur
        const playerCell = document.querySelectorAll('.ship-pos');
        this.playerCells = Array.from(playerCell);

        for(let i = 0; i < playerCell.length; i++){
            // Créer des fonctions nommées pour pouvoir les supprimer
            const mouseEnterHandler = () => {
                this.activateSonar();
            };
            
            const mouseLeaveHandler = () => {
                this.deactivateSonar();
            };

            // Ajouter les event listeners
            playerCell[i].addEventListener('mouseenter', mouseEnterHandler);
            playerCell[i].addEventListener('mouseleave', mouseLeaveHandler);

            // Stocker les références pour pouvoir les supprimer plus tard
            this.eventListeners.push({
                element: playerCell[i],
                type: 'mouseenter',
                handler: mouseEnterHandler
            });
            
            this.eventListeners.push({
                element: playerCell[i],
                type: 'mouseleave',
                handler: mouseLeaveHandler
            });
        }
    }

    setupMobileEventListeners() {
        // Sur mobile, utiliser le bouton sonar-toggle-btn
        const radarButton = document.querySelector('#sonar-toggle-btn');
        
        if (radarButton) {
            // Gestionnaire pour l'activation/désactivation du sonar par bouton
            const buttonClickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (this.sonarActive) {
                    this.deactivateSonar();
                } else {
                    this.activateSonar();
                }
            };

            // Ajouter l'event listener au bouton
            radarButton.addEventListener('click', buttonClickHandler);
            radarButton.addEventListener('touchend', buttonClickHandler);

            // Stocker les références
            this.eventListeners.push({
                element: radarButton,
                type: 'click',
                handler: buttonClickHandler
            });

            this.eventListeners.push({
                element: radarButton,
                type: 'touchend',
                handler: buttonClickHandler
            });

            // Optionnel : Ajouter une classe pour indiquer que le bouton est actif
            radarButton.classList.add('sonar-control-active');
        } else {
            console.warn('Bouton #radar-sweep non trouvé pour le contrôle mobile du sonar');
        }
    }

    removeEventListeners() {
        this.eventListeners.forEach(listener => {
            // Vérifier que l'élément existe encore dans le DOM
            if (listener.element && listener.element.parentNode) {
                listener.element.removeEventListener(listener.type, listener.handler);
            }
        });
        
        // Retirer la classe du bouton radar si elle existe
        const radarButton = document.querySelector('#sonar-toggle-btn');
        if (radarButton) {
            radarButton.classList.remove('sonar-control-active');
        }
        
        this.eventListeners = []; // Vider le tableau
    }

    // Méthode pour réinitialiser complètement le sonar
    reinitialize(observable_zone, coordinates, view_range) {
        // Désactiver le sonar en cours
        this.deactivateSonar();
        
        // Supprimer les anciens listeners
        this.removeEventListeners();
        
        // Mettre à jour les propriétés
        this.observable_zone = observable_zone;
        this.playerPos = coordinates;
        this.range = view_range;
        
        // Re-détecter le type d'appareil (au cas où l'utilisateur aurait changé d'orientation ou de device)
        this.isMobile = this.detectMobileDevice();
        
        // Nettoyer et reconfigurer
        this.cleanupAllSonarListeners();
        this.setupEventListeners();
    }

    // Méthode pour supprimer un event listener spécifique
    removeSonarEventListeners() {
        this.eventListeners = this.eventListeners.filter(listener => {
            if (listener.type === 'mouseenter' || listener.type === 'mouseleave' || 
                listener.type === 'click' || listener.type === 'touchend') {
                if (listener.element && listener.element.parentNode) {
                    listener.element.removeEventListener(listener.type, listener.handler);
                }
                return false; // Supprimer de la liste
            }
            return true; // Garder dans la liste
        });
    }

    activateSonar() {
        if (this.sonarActive) return;
        
        this.sonarActive = true;
        this.showRange();
        this.startSonarSweep();
        
        // Mettre à jour l'apparence du bouton sur mobile
        if (this.isMobile) {
            const radarButton = document.querySelector('#sonar-toggle-btn');
            if (radarButton) {
                radarButton.classList.add('sonar-active');
            }
        }
    }

    deactivateSonar() {
        this.sonarActive = false;
        this.hideRange();
        this.stopSonarSweep();
        
        // Mettre à jour l'apparence du bouton sur mobile
        if (this.isMobile) {
            const radarButton = document.querySelector('#sonar-toggle-btn');
            radarButton?.classList.remove('sonar-active');
        }
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
        for (let i = 0; i < this.observable_zone.length; i++){
            this.observable_zone[i].classList.remove('sonar-sweep')
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
                        let cell = document.getElementById(`${y}_${x}`);
                        if (cell && cell.querySelector('#field-of-view')) {
                            cell.querySelector('#field-of-view').classList.add('sonar-sweep');
                        }
                    }
                }
            }
        }
    }

    // Méthode pour forcer le mode mobile/desktop
    setMobileMode(isMobile) {
        if (this.isMobile !== isMobile) {
            this.isMobile = isMobile;
            // Réinitialiser les event listeners avec le nouveau mode
            this.removeEventListeners();
            this.setupEventListeners();
        }
    }

    // Méthode pour obtenir le statut du mode mobile
    getMobileMode() {
        return this.isMobile;
    }

    // Méthode de nettoyage à appeler avant de détruire l'instance
    destroy() {
        this.deactivateSonar();
        this.removeEventListeners();
        this.cleanupAllSonarListeners();
    }
}

let sonar = "";

function renderPlayerSonar(coordinates, viewRange){
    const coord = {y: coordinates.y - 1, x: coordinates.x - 1};
    
    // Si un sonar existe déjà, le nettoyer proprement
    if (sonar && typeof sonar.destroy === 'function') {
        sonar.destroy();
    }
    
    sonar = new Sonar(observable_zone, coord, viewRange);
}

// Fonction alternative pour réutiliser l'instance existante
function updatePlayerSonar(coordinates, viewRange) {
    const coord = {y: coordinates.y - 1, x: coordinates.x - 1};
    
    if (sonar && typeof sonar.reinitialize === 'function') {
        sonar.reinitialize(observable_zone, coord, viewRange);
    } else {
        renderPlayerSonar(coordinates, viewRange);
    }
}

// Fonction pour réinitialiser le sonar lors d'un mouvement
function onPlayerMoved(newCoordinates, viewRange) {
    if (typeof updatePlayerSonar === 'function') {
        updatePlayerSonar(newCoordinates, viewRange);
    }
}

// Fonction pour vérifier si le sonar est actif
function isSonarActive() {
    return sonar && sonar.sonarActive === true;
}

// Fonction pour forcer la désactivation du sonar
function forceSonarDeactivation() {
    if (sonar && typeof sonar.deactivateSonar === 'function') {
        sonar.deactivateSonar();
    }
}

// Fonction utilitaire pour basculer entre les modes mobile/desktop
function toggleSonarMobileMode(forceMobile = null) {
    if (sonar && typeof sonar.setMobileMode === 'function') {
        const newMode = forceMobile !== null ? forceMobile : !sonar.getMobileMode();
        sonar.setMobileMode(newMode);
        return newMode;
    }
    return false;
}

// Fonction pour vérifier le mode actuel
function getSonarMode() {
    if (sonar && typeof sonar.getMobileMode === 'function') {
        return sonar.getMobileMode() ? 'mobile' : 'desktop';
    }
    return 'unknown';
}