
    let x = 1;

    function updateSize(){
        let ratio = 1;
        if(window.innerWidth <= 320 || window.innerWidth > 320){
            ratio = 1;
        }
        if(window.innerWidth >= 760){
            ratio = 1.5;
        }
        if(window.innerWidth >= 1024){
            ratio = 1.5;
        }
        if(window.innerWidth >= 1280){
            ratio = 1.5;
        }

        if(window.innerWidth >= 1920){
            ratio = 2;
        }
        if(window.innerWidth >= 2550){
            ratio = 4;
        }
    }

    updateSize();
