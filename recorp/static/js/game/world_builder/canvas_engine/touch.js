// touch.js
// centralise la detection mobile/desktop et expose les variables legacy
export function is_user_is_on_mobile_device() {
    try {
        if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) return true;
        const ua = navigator.userAgent || navigator.vendor || window.opera || '';
        return /android|iphone|ipad|ipod|windows phone/i.test(ua.toLowerCase());
    } catch (e) {
        return false;
    }
}

export const user_is_on_mobile_bool = is_user_is_on_mobile_device();

export const attribute_touch_mouseover = user_is_on_mobile_bool ? 'touchstart' : 'mouseover';
export const attribute_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'onclick';
export const action_listener_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'click';

// expose legacy globals on window for backward compatibility
window.attribute_touch_mouseover = attribute_touch_mouseover;
window.attribute_touch_click = attribute_touch_click;
window.action_listener_touch_click = action_listener_touch_click;
window.user_is_on_mobile_bool = user_is_on_mobile_bool;
