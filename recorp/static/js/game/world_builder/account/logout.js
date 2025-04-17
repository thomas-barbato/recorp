
let user_is_on_mobile_bool = is_user_is_on_mobile_device()

let attribute_touch_mouseover = user_is_on_mobile_bool === true ? 'touchstart' : 'mouseover';
let attribute_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'onclick';
let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';

let logout = document.querySelectorAll('.logout');
for(const button of logout){
    button.addEventListener(action_listener_touch_click, function(){
        console.log("click")
        let logout_submit_btn = button.querySelector('#logout-btn');
        logout_submit_btn.click();
    });
}
