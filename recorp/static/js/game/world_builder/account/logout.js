let logout = document.querySelectorAll('.logout');

for(const button of logout){
    button.addEventListener(action_listener_touch_click, function(){
        let logout_submit_btn = button.querySelector('#logout-btn');
        logout_submit_btn.click();
    });
}