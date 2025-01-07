document.addEventListener('DOMContentLoaded', function() {

    const burger = document.querySelectorAll('.navbar-burger');
    const menu = document.querySelectorAll('.navbar-menu');
    const nav_items = document.querySelectorAll('.nav-item');

    if (burger.length && menu.length) {
        for (var i = 0; i < burger.length; i++) {
            burger[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }

    nav_items.forEach(index => {
        console.log("dedans ok ok ok")
        index.addEventListener('mouseover', () => {
            for(let i = 0; i < nav_items.length; i++){
                nav_items[i] !== index ? nav_items[i].classList.add('blur-sm') : index.classList.remove('blur-sm');
            }
        }
        );
    });


    document.querySelector('.ul-nav').addEventListener('mouseleave', () => {
        nav_items.forEach(index => index.classList.remove('blur-sm'));
    })
});