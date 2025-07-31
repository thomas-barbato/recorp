function getObservableZone(data = []) {
    // Utilise directement les données fournies ou la zone visible du joueur
    const ids = data.length > 0 ? data : currentPlayer.ship.visible_zone;
    // Utilise reduce pour construire le tableau en une seule passe
    const observable_zone = ids.reduce((zones, id) => {
        const element = document.getElementById(id);
        
        // Vérification optimisée avec early return
        if (!element?.classList.contains('ship-pos')) {
            const zone = element.querySelector('#field-of-view');
            if (zone) {
                zones.push(zone);
            }
        }
        
        return zones;
    }, []);
    
    return [observable_zone, ids];
}