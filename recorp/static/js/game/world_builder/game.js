let map_info = {
  tile_size: 32,
  cols: 20,
  rows: 15,
  ratio: 1,
};

function ship_stationary_animation() {
  let ship = document.querySelectorAll(".ship");
  for (let i = 0; i < ship.length; i++) {
    if (ship[i].style.top === "2px") {
      ship[i].style.top = "0px";
    } else {
      ship[i].style.top = "2px";
    }
  }
}

setInterval(ship_stationary_animation, "1000");

let tabletop = document.querySelector(".tabletop-view");
updateSize();

function updateSize() {
  if (window.innerWidth <= 320 || window.innerWidth > 320) {
    map_info.ratio = 1;
  }
  if (window.innerWidth >= 760) {
    map_info.ratio = 1.5;
  }
  if (window.innerWidth >= 1024) {
    map_info.ratio = 1.5;
  }
  if (window.innerWidth >= 1280) {
    map_info.ratio = 1.5;
  }

  if (window.innerWidth >= 1920) {
    map_info.ratio = 2;
  }

  if (window.innerWidth >= 2550) {
    map_info.ratio = 4;
  }

  let newWidth = map_info.tile_size * map_info.cols * map_info.ratio;
  let newHeight = map_info.tile_size * map_info.rows * map_info.ratio;

  tabletop.style.width = newWidth;
  tabletop.style.height = "auto";
}
