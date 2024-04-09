const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);
let end_coord_x = 0;
let end_coord_y = 0;
let start_coord_x = 0;
let start_coord_y = 0;

(function(){
    function set_path_coord(e){
        let id = e.parentNode.parentNode.id.split('_');
        end_coord_x = id[1];
        end_coord_y = id[0];
        for(let i = 0; i < map_informations['pc_npc'].length; i++){
            if(map_informations['pc_npc'][i]['user_id'] == current_user_id){
                start_coord_x = map_informations['pc_npc'][i]['coordinates']['coord_x'];
                start_coord_y = map_informations['pc_npc'][i]['coordinates']['coord_y'];
                break;
            }
        }

        return get_path_coord(end_coord_x, end_coord_y, start_coord_x, start_coord_y);
    }

    function get_path_coord(s_x, s_y, e_x, e_y){
        console.log(s_x, s_y, e_x, e_y);
    }
})



function pathTo(node) {
  let curr = node;
  let path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  return path;
}

function getHeap() {
  return new BinaryHeap(function(node) {
    return node.f;
  });
}




