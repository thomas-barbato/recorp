function occured_event_display_on_map(event_type, is_using_timer, user_id, value=0){ 

    let element = document.querySelector(`#tooltip-pc_${user_id}`);
    
    if (!element) {
        console.warn(`Tooltip container not found for user ${user_id}`);
        return;
    }
    
    let tooltipContainer = document.createElement('li');
    let tooltipContainerValue = document.createElement('span');
    
    tooltipContainer.classList.add(
        'absolute', 'z-[9999]', 'px-1', 'py-1',
        'text-xs', 'inline-block', 'font-bold', 'text-white', 
        'rounded-sm', 'shadow-sm', 'text-center', 'list-none', 
        'text-justify', 'm-w-[200px]', 'tooltip');

    // Positionnement explicite au-dessus de la cellule
    tooltipContainer.style.top = '-30px';  // Au-dessus de la cellule
    tooltipContainer.style.left = '0px';   // Aligné à gauche de la cellule
    tooltipContainer.style.transform = 'translateY(-100%)';
    tooltipContainer.style.pointerEvents = 'none'; // Évite les conflits d'événements
    tooltipContainer.style.zIndex = '10000';
    
    // Remove existing tooltips if there are too many
    const existingTooltips = element.querySelectorAll('ul');
    if (existingTooltips.length >= 3) {
        existingTooltips[0].remove();
    }
        
    tooltipContainer.id = `${event_type}-information-display`;
    
    if(event_type == "movement"){
        occured_movement_on_map(tooltipContainerValue, value)
    }


    tooltipContainer.append(tooltipContainerValue);

    element.append(tooltipContainer);
    fade_effect(element.querySelector('#'+tooltipContainer.id), 100)
}

function occured_movement_on_map(tooltipContainerValue, value){
    tooltipContainerValue.classList.add('text-teal-300', 'text-lg', 'p-1', 'w-full', 'font-shadow', 'text-center');
    tooltipContainerValue.textContent = `-${value}`;
}



function createTooltipContainer(cell, playerId) {
    const tooltipContainer = document.createElement('ul');
    tooltipContainer.id = `tooltip-pc_${playerId}`;
    tooltipContainer.classList.add(
        'absolute', 'z-[9999]', 'px-1', 'py-1', 'text-xs',
        'font-bold', 'text-white', 'rounded-sm', 'shadow-sm', 'text-center',
        'list-none', 'text-justify', 'm-w-[100%]', 'tooltip'
    );

    // Positionnement explicite au-dessus de la cellule
    tooltipContainer.style.top = '30px';  // En dessous de la cellule
    tooltipContainer.style.left = '0px';   // Aligné à gauche de la cellule
    tooltipContainer.style.transform = 'translateY(-100%)';
    tooltipContainer.style.pointerEvents = 'none'; // Évite les conflits d'événements
    tooltipContainer.style.zIndex = '10000';
    
    // Remove existing tooltips if there are too many
    const existingTooltips = cell.querySelectorAll('ul');
    if (existingTooltips.length >= 3) {
        existingTooltips[0].remove();
    }
    cell.append(tooltipContainer);
}