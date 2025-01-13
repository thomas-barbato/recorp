document.addEventListener('DOMContentLoaded', function() {

    const burger = document.querySelector('.navbar-burger');
    const menu = document.querySelectorAll('.navbar-menu');
    const nav_items = document.querySelectorAll('.nav-item');
    const side_nav_items = document.querySelectorAll('.nav-item-fullscreen');

    if (burger.length && menu.length) {
        burger.addEventListener('click', function() {
            for (var j = 0; j < menu.length; j++) {
                if(!menu[j].classList.contains('hidden')){
                    document.querySelector('.main-game-container').classList.add('blur-sm');
                    document.querySelector('.disclaimer-container').classList.add('blur-sm');
                }else{
                    document.querySelector('.main-game-container').classList.remove('blur-sm');
                    document.querySelector('.disclaimer-container').classList.remove('blur-sm');
                }
            }
        });
        burger.addEventListener('touchstart', function() {
            for (var j = 0; j < menu.length; j++) {
                if(!menu[j].classList.contains('hidden')){
                    document.querySelector('.main-game-container').classList.add('blur-sm');
                    document.querySelector('.disclaimer-container').classList.add('blur-sm');
                }else{
                    document.querySelector('.main-game-container').classList.remove('blur-sm');
                    document.querySelector('.disclaimer-container').classList.remove('blur-sm');
                }
            }
        });
    }

    nav_items.forEach(index => {
        index.addEventListener('mouseover', () => {
            for(let i = 0; i < nav_items.length; i++){
                if(nav_items[i] !== index){
                    nav_items[i].classList.add('blur-sm');
                }else{
                    index.classList.remove('blur-sm')}
            }
        }
        );
    });

    side_nav_items.forEach(index => {
        if(side_nav_items){
            index.addEventListener('mouseover', () => {
                for(let i = 0; i < side_nav_items.length; i++){
                    side_nav_items[i] !== index ? side_nav_items[i].querySelector('.side-panel-item-name').classList.add('hidden') : side_nav_items[i].querySelector('.side-panel-item-name').classList.remove('hidden');
                }
            });
            index.addEventListener('mouseout', () => {
                for(let i = 0; i < side_nav_items.length; i++){
                    side_nav_items[i].querySelector('.side-panel-item-name').classList.add('hidden');
                }
            });
        }
    });

    document.querySelector('.ul-nav').addEventListener('mouseleave', () => {
        nav_items.forEach(index => index.classList.remove('blur-sm'));
    })
});