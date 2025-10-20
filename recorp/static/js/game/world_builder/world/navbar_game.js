document.addEventListener('DOMContentLoaded', function() {

    // TOP PANEL
    const burger = document.querySelector('.navbar-burger');
    const menu = document.querySelector('.navbar-menu');

    burger.addEventListener('click', function() {
        if(menu.classList.contains('hidden')){
            document.querySelector('#info-container').classList.add('blur-sm');
            document.querySelector('.main-game-container').classList.add('blur-sm');
        }else{
            document.querySelector('#info-container').classList.remove('blur-sm');
            document.querySelector('.main-game-container').classList.remove('blur-sm');
        }
    });
    burger.addEventListener('touchstart', function() {
        if(menu.classList.contains('hidden')){
            document.querySelector('#info-container').classList.add('blur-sm');
            document.querySelector('.main-game-container').classList.add('blur-sm');
        }else{
            document.querySelector('#info-container').classList.remove('blur-sm');
            document.querySelector('.main-game-container').classList.remove('blur-sm');
        }
    });
    
});