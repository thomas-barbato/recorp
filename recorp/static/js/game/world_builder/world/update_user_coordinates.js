function update_user_coord_display(x, y) {
    document.querySelector('#player-coord-x').textContent = x;
    document.querySelector('#player-coord-y').textContent = y;
}

function update_target_coord_display(element) {
    const targetData = extractTargetData(element);
    updateCoordinateDisplay(targetData);
    handleMobileInteraction(element);
}

function extractTargetData(element) {
    const span = element.querySelector('span');
    let targetName = span.getAttribute('data-title').split(' ')[0] || '';
    const coordX = element.cellIndex - 1;
    const coordY = element.parentNode.rowIndex - 1;
    
    return { targetName, coordX, coordY };
}

function updateCoordinateDisplay({ targetName, coordX, coordY }) {
    const elements = getCoordinateElements();
    
    elements.coordX.classList.remove('invisible');
    elements.coordY.classList.remove('invisible');
    elements.coordName.textContent = targetName;
    elements.coordX.textContent = coordX.toString();
    elements.coordY.textContent = coordY.toString();
}

function getCoordinateElements() {
    return {
        coordName: document.querySelector('#target-coord-name'),
        coordX: document.querySelector('#target-coord-x'),
        coordY: document.querySelector('#target-coord-y')
    };
}

function handleMobileInteraction(element) {
    if (!is_user_is_on_mobile_device()) return;
    
    const span = element.querySelector('span');
    
    if (element.classList.contains('ship-pos')) {
        reverse_player_ship_display();
    } else if (element.classList.contains('uncrossable') && span?.dataset.modalTarget) {
        open_close_modal(span.dataset.modalTarget);
    }
}