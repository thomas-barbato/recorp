document.addEventListener('DOMContentLoaded', function() {

    // TOP PANEL
    const burger = document.querySelector('.navbar-burger');
    const menu = document.querySelector('.navbar-menu');

    burger.addEventListener('click', function() {
        if(menu.classList.contains('hidden')){
            document.querySelector('#info-container').classList.add('blur-sm');
            document.querySelector('.main-game-container').classList.add('blur-sm');
            document.querySelector('.disclaimer-container').classList.add('blur-sm');
        }else{
            document.querySelector('#info-container').classList.remove('blur-sm');
            document.querySelector('.main-game-container').classList.remove('blur-sm');
            document.querySelector('.disclaimer-container').classList.remove('blur-sm');
        }
    });
    burger.addEventListener('touchstart', function() {
        if(menu.classList.contains('hidden')){
            document.querySelector('#info-container').classList.add('blur-sm');
            document.querySelector('.main-game-container').classList.add('blur-sm');
            document.querySelector('.disclaimer-container').classList.add('blur-sm');
        }else{
            document.querySelector('#info-container').classList.remove('blur-sm');
            document.querySelector('.main-game-container').classList.remove('blur-sm');
            document.querySelector('.disclaimer-container').classList.remove('blur-sm');
        }
    });

    // Navbar buttons
    const navbar_element_list = document.querySelectorAll('.button-panel');
    navbar_element_list.forEach(function (element, index) {
        element.addEventListener("mouseover", function(){
            element.querySelector('.button-panel-text').classList.remove('hidden')
        })
        element.addEventListener("mouseout", function(){
            element.querySelector('.button-panel-text').classList.add('hidden')
        })
    });
});