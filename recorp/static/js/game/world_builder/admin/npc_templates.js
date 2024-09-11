const csrf_token = document.getElementById('csrf_token').value;
let dict = [];
const ship_select = document.querySelector('#ship-select');
const ship_img = document.querySelector('#spaceship-img');


// CHANGE CHARACTER IMG ZONE

ship_select.addEventListener('change', function() {
    let selected_element = ship_select.options[ship_select.selectedIndex];
    ship_img.src = "";
    if (selected_element.value != "none") {
        let img_name = `${selected_element.dataset.imagename}.png`;
        ship_img.src = `/static/js/game/assets/ships/${img_name}`;
        ship_img.classList.remove('hidden')
    }
});