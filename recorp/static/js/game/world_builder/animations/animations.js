export function display_animation(timer="500"){
        let temporary_class_len = animation_set.size;
        let current_elements = "";
        let previous_elements = "";
        let index = 0;
        setInterval( function(){
            if(index === 0){
                current_elements = document.querySelectorAll('.animation-'+index);
                previous_elements = document.querySelectorAll('.animation-'+parseInt(temporary_class_len-1));
                for(let i = 0; i < current_elements.length; i++){
                    previous_elements[i].style.display = "none";
                    current_elements[i].style.display = "block";
                }
            }else{
                current_elements = document.querySelectorAll('.animation-'+index);
                previous_elements = document.querySelectorAll('.animation-'+parseInt(index-1));
                for(let i = 0; i < current_elements.length; i++){
                    previous_elements[i].style.display = "none";
                    current_elements[i].style.display = "block";
                }
            }
            if(index < animation_set.size){
                index++;
            }else{
                index = 0;
            }
        }, timer);

    }