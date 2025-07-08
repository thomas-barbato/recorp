CONFIG = {
    source : document.querySelector('#warpzone-source'),
    destination : document.querySelector('#warpzone-destination'),
    wayback : document.querySelector('#warpzone-wayback'),
    warpzone : JSON.parse(document.getElementById('warpzone_script').textContent),
    saveButton : document.querySelector('#save'),
    alreadyExistingWarpzone : document.querySelector('#alrady-existing-warpzone'),
    csrf_token: document.querySelector("#csrf_token").value,
}


CONFIG.source.addEventListener('change', (event) => {
    defineDestinationWarpzone(event.target.value);
})

function resetDestinationWarpzone(){
    return CONFIG.destination.options.length = 1;
}

function defineDestinationWarpzone(value){
    resetDestinationWarpzone()
    if(value != "none"){
        for(let i in CONFIG.warpzone){
            if(CONFIG.warpzone[i].id != value){
                CONFIG.destination.add(new Option(
                    `${CONFIG.warpzone[i].data__name} - ${CONFIG.warpzone[i].sector_id__name} - {x : ${CONFIG.warpzone[i].coordinates.x}, y : ${CONFIG.warpzone[i].coordinates.y}}`, 
                    CONFIG.warpzone[i].id));
            }
        }
    }
}

function createNewDisplaySource(data){
    let new_paragraph = document.createElement('p')
    new_paragraph.textContent = `Source: ${data.warp_home_id__data__name} - ${data.warp_home_id__sector_id__name} - {x : ${data.warp_home_id__coordinates.x}, y: ${data.warp_home_id__coordinates.y}}`
    return new_paragraph;
}

function createNewDisplayDestination(data){
    let new_paragraph = document.createElement('p')
    new_paragraph.textContent = `Destination: ${data.warp_destination_id__data__name} - ${data.warp_destination_id__sector_id__name} - {x : ${data.warp_destination_id__coordinates.x}, y: ${data.warp_destination_id__coordinates.y}}`
    return new_paragraph;
}

function createTrash(data){
    let new_trash = document.createElement('i');
    new_trash.className = "fa-solid fa-trash fa-2x cursor-pointer";
    new_trash.id = data.id
    return new_trash;
}

function createNewDisplayContainer(data){
    let container = document.createElement('div');
    let container_data = document.createElement('div');
    let container_trash = document.createElement('div');

    container.className = "flex flex-row gap-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm justify-between";
    container_data.className = "flex flex-col";
    container_trash.className = "flex justify-end items-center";

    container.id = data.id;
    container.setAttribute('source-id', data.id)
    container_trash.id = `trash-${data.id}`;

    container_data.append(createNewDisplaySource(data));
    container_data.append(createNewDisplayDestination(data));
    container_trash.append(createTrash(data));
    container.append(container_data);
    container.append(container_trash);

    return container;
}

function displayNewLink(data){
    CONFIG.alreadyExistingWarpzone.append(
        createNewDisplayContainer(data)
    );
}

CONFIG.saveButton.addEventListener('click', (event) => {

    const baseHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': CONFIG.csrf_token
    };

    data = JSON.stringify({
        source : CONFIG.source.value,
        destination : CONFIG.destination.value,
        wayback : CONFIG.wayback.checked,
    })

    try {
        fetch('warpzone_link_add', {
            method: 'POST',
            headers: baseHeaders,
            credentials: 'include',
            body: data
        }).then(response => response.json())
        .then(data => {
            location.reload();
        });
    } catch (error) {
        console.error('Erreur dans fetchSelectedData:', error);
        throw error;
    }
})

let trash = document.querySelectorAll('.fa-trash');

trash.forEach(t => {
    t.addEventListener('click', (event) => {

        const baseHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': CONFIG.csrf_token
        };

        data = JSON.stringify({
            'id' : t.parentNode.id.split('-')[1]
        })

        try {
            fetch('warpzone_link_delete', {
                method: 'POST',
                headers: baseHeaders,
                credentials: 'include',
                body: data
            }).then(response => response.json())
            .then(data => {
                location.reload();
            });
        } catch (error) {
            console.error('Erreur dans fetchSelectedData:', error);
            throw error;
        }
    })
})
