
function generate_border_className(size_y, size_x, isForegroundTooFar){
    let backgroundColor = isForegroundTooFar ? ["border-dashed", "bg-red-600/30"] : ["border-dashed"];
    switch(size_y){
        case 1:
            if(size_x == 1){
                return {
                    0: ["border-2", ...backgroundColor]
                };
            }else if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-b-2", ...backgroundColor], 
                    1: ["border-r-2", "border-t-2", "border-b-2", "border-dashed", ...backgroundColor]
                };
            }else if(size_x == 3){
                return {
                    0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed", ...backgroundColor], 
                    2: ["border-t-2", "border-b-2", "border-dashed", ...backgroundColor],
                    3: ["border-r-2", "border-t-2", "border-b-2", "border-dashed", ...backgroundColor],
                };
            }
            break;
        case 2:
            if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed", ...backgroundColor], 
                    1: ["border-r-2", "border-t-2", "border-dashed", ...backgroundColor],
                    2: ["border-l-2", "border-b-2", "border-dashed", ...backgroundColor],
                    3: ["border-r-2", "border-b-2", "border-dashed", ...backgroundColor]
                };
            }
            break;
        case 3:
            if(size_x == 2){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed", ...backgroundColor], 
                    1: ["border-r-2", "border-t-2", "border-dashed", ...backgroundColor],
                    2: ["border-l-2", "border-dashed", ...backgroundColor],
                    3: ["border-r-2", "border-dashed", ...backgroundColor],
                    4: ["border-l-2", "border-b-2", "border-dashed", ...backgroundColor],
                    5: ["border-r-2", "border-b-2", "border-dashed", ...backgroundColor]
                };
            }
            if(size_x == 3){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed", ...backgroundColor],
                    1: ["border-t-2", "border-dashed", ...backgroundColor], 
                    2: ["border-r-2", "border-t-2", "border-dashed", ...backgroundColor],
                    3: ["border-l-2", "border-dashed", ...backgroundColor],
                    4: ["none", ...backgroundColor],
                    5: ["border-r-2", "border-dashed", ...backgroundColor],
                    6: ["border-l-2", "border-b-2", "border-dashed", ...backgroundColor],
                    7: ["border-b-2", "border-dashed", ...backgroundColor],
                    8: ["border-r-2", "border-b-2", "border-dashed", ...backgroundColor]
                };
            }
            break;
        case 4:
            if(size_x == 4){
                return {
                    0: ["border-l-2", "border-t-2", "border-dashed", ...backgroundColor],
                    1: ["border-t-2", "border-dashed", ...backgroundColor], 
                    2: ["border-t-2", "border-dashed", ...backgroundColor], 
                    3: ["border-r-2", "border-t-2", "border-dashed", ...backgroundColor],
                    4: ["border-l-2", "border-dashed", ...backgroundColor],
                    5: ["none", ...backgroundColor],
                    6: ["none", ...backgroundColor],
                    7: ["border-r-2", "border-dashed", ...backgroundColor],
                    8: ["border-l-2", "border-dashed", ...backgroundColor],
                    9: ["none", ...backgroundColor],
                    10: ["none", ...backgroundColor],
                    11: ["border-r-2", "border-dashed", ...backgroundColor],
                    12: ["border-l-2","border-b-2", "border-dashed", ...backgroundColor],
                    13: ["border-b-2", "border-dashed", ...backgroundColor],
                    14: ["border-b-2", "border-dashed", ...backgroundColor],
                    15: ["border-r-2", "border-b-2", "border-dashed", ...backgroundColor],
                };
            }
            break;
        default:
            break;
    }
}

function remove_border(size_y, size_x, coord_y, coord_x, colorClass, isForegroundTooFar=false){
    let c_y = coord_y;
    let c_x = coord_x;
    let full_size_y = atlas.tilesize * size_y;
    let full_size_x = atlas.tilesize * size_x;

    let cursorType = isForegroundTooFar == true ? "cursor-not-allowed" : "cursor-pointer"

    for (let row_i = 0; row_i < full_size_y; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < full_size_x; col_i += atlas.tilesize) {
            let parent_e = document.querySelector('.tabletop-view').rows[c_y].cells[c_x];
            let child_e = parent_e.querySelector('span');
            child_e.className = `absolute block z-10 w-[32px] h-[32px] pathfinding-zone ${cursorType} ${colorClass}`;
            c_x++;
        }
        c_y++;
        c_x = coord_x;
    }
}

function generate_border(size_y, size_x, coord_y, coord_x, colorClass, isForegroundTooFar=false){
    let c_y = coord_y;
    let c_x = coord_x;
    let classList = generate_border_className(size_y, size_x, isForegroundTooFar);
    let element_list = [];
    let full_size_y = atlas.tilesize * size_y;
    let full_size_x = atlas.tilesize * size_x;

    for (let row_i = 0; row_i < full_size_y; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < full_size_x; col_i += atlas.tilesize) {
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