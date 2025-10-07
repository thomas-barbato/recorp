function recreateTileStructure() {
    
    const tiles = document.querySelectorAll('.tile');
    let processedCount = 0;
    
    tiles.forEach(tile => {
        try {
            // Conserver l'ID de la tuile (format: "Y_X")
            const tileId = tile.id;
            
            // Nettoyer complètement le contenu
            tile.innerHTML = '';
            
            // Réinitialiser les classes et styles
            tile.className = 'relative w-[32px] h-[32px] m-0 p-0 tile z-10';
            tile.style.cssText = '';
            tile.id = tileId;
            
            // Recréer la structure div principale
            const coordZoneDiv = document.createElement('div');
            coordZoneDiv.className = 'relative w-[32px] h-[32px] z-20 coord-zone-div';
            
            // Créer le div field-of-view
            const fovDiv = document.createElement('div');
            fovDiv.className = 'absolute w-[32px] h-[32px] hidden';
            fovDiv.id = 'field-of-view';
            
            // Créer le span vide
            const span = document.createElement('span');
            span.className = 'absolute w-[32px] h-[32px]';
            
            // Assembler la structure
            coordZoneDiv.appendChild(fovDiv);
            coordZoneDiv.appendChild(span);
            tile.appendChild(coordZoneDiv);
            
            processedCount++;
            
        } catch (error) {
            console.error(`Erreur lors de la recréation de la tuile ${tile.id}:`, error);
        }
    });
    
    return processedCount;
}
