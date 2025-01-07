document.addEventListener('DOMContentLoaded', function() {

    const burger = document.querySelectorAll('.navbar-burger');
    const menu = document.querySelectorAll('.navbar-menu');

    if (burger.length && menu.length) {
        for (var i = 0; i < burger.length; i++) {
            burger[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                    if(!menu[j].classList.contains('hidden')){
                        document.querySelector('.main-info-container').classList.add('blur-sm');
                        document.querySelector('.main-game-container').classList.add('blur-sm');
                    }else{

                        document.querySelector('.main-info-container').classList.remove('blur-sm');
                        document.querySelector('.main-game-container').classList.remove('blur-sm');
                    }
                }
            });
        }
    }
});