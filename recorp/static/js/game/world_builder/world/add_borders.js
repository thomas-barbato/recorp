
function generate_border_className(size_y, size_x){
    switch(size_y){
        case 1:
            if(size_x == 1){
                return {
                    0: ["border-2", "border-dashed"]
                };
            }else if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed"], 
                    1: ["border-r-2", "border-t-2", "border-b-2", "border-dashed"]
                };
            }else if(size_x == 3){
                return {
                    0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed"], 
                    2: ["border-t-2", "border-b-2", "border-dashed"],
                    3: ["border-r-2", "border-t-2", "border-b-2", "border-dashed"],
                };
            }
            break;
        case 2:
            if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"], 
                    1: ["border-r-2", "border-t-2", "border-dashed"],
                    2: ["border-l-2", "border-b-2", "border-dashed"],
                    3: ["border-r-2", "border-b-2", "border-dashed"]
                };
            }
            break;
        case 3:
            if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"], 
                    1: ["border-r-2", "border-t-2", "border-dashed"],
                    2: ["border-l-2", "border-dashed"],
                    3: ["border-r-2", "border-dashed"],
                    4: ["border-l-2", "border-b-2", "border-dashed"],
                    5: ["border-r-2", "border-b-2", "border-dashed"]
                };
            }
            if(size_x == 3){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"],
                    1: ["border-t-2", "border-dashed"], 
                    2: ["border-r-2", "border-t-2", "border-dashed"],
                    3: ["border-l-2", "border-dashed"],
                    4: ["none"],
                    5: ["border-r-2", "border-dashed"],
                    6: ["border-l-2", "border-b-2", "border-dashed"],
                    7: ["border-b-2", "border-dashed"],
                    8: ["border-r-2", "border-b-2", "border-dashed"]
                };
            }
            break;
        case 4:
            if(size_x == 4){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed"],
                    1: ["border-t-2", "border-dashed"], 
                    2: ["border-t-2", "border-dashed"], 
                    3: ["border-r-2", "border-t-2", "border-dashed"],
                    4: ["border-l-2", "border-dashed"],
                    5: ["none"],
                    6: ["none"],
                    7: ["border-r-2", "border-dashed"],
                    8: ["border-l-2", "border-dashed"],
                    9: ["none"],
                    10: ["none"],
                    11: ["border-r-2", "border-dashed"],
                    12: ["border-l-2","border-b-2", "border-dashed"],
                    13: ["border-b-2", "border-dashed"],
                    14: ["border-b-2", "border-dashed"],
                    15: ["border-r-2", "border-b-2", "border-dashed"],
                };
            }
            break;
        default:
            break;
    }
}

function remove_border(size_y, size_x, coord_y, coord_x, colorClass){
    let c_y = coord_y;
    let c_x = coord_x;

    for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
            let parent_e = document.querySelector('.tabletop-view').rows[c_y].cells[c_x];
            let child_e = parent_e.querySelector('span');
            child_e.className = `absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer ${colorClass}`;
            c_x++;
        }
        c_y++;
        c_x = coord_x;
    }
}

function generate_border(size_y, size_x, coord_y, coord_x, colorClass){
    let c_y = coord_y;
    let c_x = coord_x;
    let classList = generate_border_className(size_y, size_x);
    let element_list = [];
    for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
            let parent_e = document.querySelector('.tabletop-view').rows[c_y].cells[c_x];
            element_list.push(parent_e);
            c_x++;
        }
        c_y++;
        c_x = coord_x;
    }

    for(index = 0 ; index < element_list.length; index++){
        let child_e = element_list[index].querySelector('span');
        for(border_class in classList[index]){
            if(classList[index][border_class] != "none"){
                child_e.classList.add(classList[index][border_class]);
                child_e.classList.add(colorClass);
            }
        }
    }
}