
let user_is_on_mobile_bool = is_user_is_on_mobile_device()

let attribute_touch_mouseover = user_is_on_mobile_bool === true ? 'touchstart' : 'mouseover';
let attribute_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'onclick';
let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';

let submit_button = document.querySelector("#create-account-submit-button");

submit_button.addEventListener('click', function(){
    console.log("prout")
    let first_name = document.querySelector('#first_name_id').value;
    let last_name = document.querySelector('#last_name_id').value;
    let user_name = document.querySelector("#username_id").value;
    let password = document.querySelector("#password_id").value;
    let password2 = document.querySelector("#password2_id").value;
    let email = document.querySelector("#email_id").value;

    let data = JSON.stringify({
        first_name : first_name,
        last_name : last_name,
        user_name : user_name,
        password : password,
        password2 : password2,
        email: email,
    });

    url = "create_account";
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
            body: data
        }).then(response => response.json())
        .then(data => {})
        .catch(error => console.error(error));
});