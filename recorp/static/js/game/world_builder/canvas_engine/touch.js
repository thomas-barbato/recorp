// touch.js
// centralise la detection mobile/desktop et expose les variables legacy
function getDeviceProfile() {
    try {
        if (typeof window.get_user_device_profile === "function") {
            return window.get_user_device_profile();
        }
    } catch (e) {
        // fallback below
    }

    try {
        const ua = String(navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
        const isTablet = /ipad|tablet|kindle|silk/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua));
        const isPhone = /iphone|ipod|windows phone/.test(ua) || (/android/.test(ua) && /mobile/.test(ua));
        return {
            is_phone: isPhone,
            is_tablet: isTablet,
            is_pc: !isPhone && !isTablet,
        };
    } catch (e) {
        return { is_phone: false, is_tablet: false, is_pc: true };
    }
}

export function is_user_is_on_mobile_device() {
    const profile = getDeviceProfile();
    return !!(profile.is_phone || profile.is_tablet);
}

export function is_user_is_on_tablet_device() {
    return !!getDeviceProfile().is_tablet;
}

export function is_user_is_on_pc_device() {
    return !!getDeviceProfile().is_pc;
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
