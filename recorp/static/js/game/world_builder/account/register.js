
let user_is_on_mobile_bool = is_user_is_on_mobile_device()

let attribute_touch_mouseover = user_is_on_mobile_bool === true ? 'touchstart' : 'mouseover';
let attribute_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'onclick';
let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';

let submit_button = document.querySelector("#create-account-submit-button");

submit_button.addEventListener(action_listener_touch_click, function(){

    let first_name = document.querySelector("#id_first_name").value;
    let last_name = document.querySelector("#id_last_name").value;
    let user_name = document.querySelector("#id_username").value;
    let password = document.querySelector("#id_password").value;
    let password2 = document.querySelector("#id_password2").value;
    let email = document.querySelector("#id_email").value;

    let data = {
        'first_name' : first_name.length > 0 ? first_name : "None",
        'last_name': last_name.length > 0 ? last_name : "None",
        'username' : user_name,
        'password' : password,
        'password2' : password2,
        'email': email,
    };
    
    url = "create";
    method = "POST"

    const headers = new Headers({
        'Content-Type': 'x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': csrf_token
    });
    
    fetch(url, {
            method: method,
            headers,
            credentials: 'include',
            body: JSON.stringify(data),
        }).then(response => response.json())
        .then(data => {
            submit_button.disabled = false;
            if(data.missing){
                let incorrect_data = [...new Set(data.errors)]
                let container_array = [];
                for(let i in incorrect_data){
                    let help_text_container = document.querySelector(`#${incorrect_data[i]}_help_text`);
                    help_text_container.classList.remove('hidden');
                    container_array.push(help_text_container)
                }

                setTimeout(() => {
                    for(let i = 0; i < container_array.length ; i++){
                        container_array[i].classList.add('hidden')
                    }
                }, 5000);
            }else{
                window.location.replace('/');
            }
            

        }).catch(error => console.error(error));
});
