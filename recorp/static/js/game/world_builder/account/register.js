submit_button.addEventListener(action_listener_touch_click, function() {
    submit_button.disabled = true;

    let data = {
        first_name: document.querySelector("#id_first_name").value || "None",
        last_name: document.querySelector("#id_last_name").value || "None",
        username: document.querySelector("#id_username").value,
        password: document.querySelector("#id_password").value,
        password2: document.querySelector("#id_password2").value,
        email: document.querySelector("#id_email").value,
    };

    fetch("/create_account/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrf_token,
        },
        credentials: "include",
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        submit_button.disabled = false;

        if (data.errors && data.errors.length > 0) {
            // Affiche les messages d'erreur pour chaque champ
            let container_array = [];
            for (let i in data.errors) {
                let help_text_container = document.querySelector(`#${data.errors[i]}_help_text`);
                if(help_text_container){
                    help_text_container.classList.remove('hidden');
                    container_array.push(help_text_container);
                }
            }
            setTimeout(() => {
                container_array.forEach(c => c.classList.add('hidden'));
            }, 5000);
        } else if (data.redirect_url) {
            // Redirection vers index
            window.location.replace(data.redirect_url);
        }
    })
    .catch(error => {
        submit_button.disabled = false;
        console.error(error);
    });
});