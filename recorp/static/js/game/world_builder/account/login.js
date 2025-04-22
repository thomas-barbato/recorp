document.querySelector('#player-container').classList.remove('hidden');

let login_policy = document.querySelector('.login-policy');
login_policy.style.display = "none";

let login_btn = document.querySelector('#login-btn');
login_btn.disabled = true;

let username_value = document.querySelector('#id_username')
username_value.addEventListener('change', function(e){
    if(e.length > 3){
        login_btn.disabled = true;
    }else{
        login_btn.disabled = false;
    }
})

let password_value = document.querySelector('#id_password')
password_value.addEventListener('change', function(e){
    if(e.length > 8){
        login_btn.disabled = true;
    }else{
        login_btn.disabled = false;
    }
})

/*
login_btn.addEventListener('click', function(e){
    let data = {
        'username' : username_value.value,
        'password':  password_value.value
    }

    let url = "/"

    const headers = new Headers({
    'Content-Type': 'x-www-form-urlencoded',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRFToken': csrf_token
    });
    fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
            'data': data,
        })
    }).then(() => {
        window.location.reload();
    });
});*/
