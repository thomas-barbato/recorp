let logout = document.querySelectorAll('.logout');

console.log(logout)

for(const button of logout){
    button.addEventListener(action_listener_touch_click, function(){
        console.log("prout")
        let logout_submit_btn = button.querySelector('#logout-btn');
        logout_submit_btn.click();
    });
}

window.addEventListener("beforeunload", function (e) {
    let logout_submit_btn = button.querySelector('#logout-btn');
    logout_submit_btn.click(); 
});