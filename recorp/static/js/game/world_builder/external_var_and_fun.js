const csrf_token = document.querySelector("meta[name=csrf-token]")?.getAttribute("content");

function _safeMatchMedia(query) {
    try {
        return !!(window.matchMedia && window.matchMedia(query).matches);
    } catch (e) {
        return false;
    }
}

function get_user_device_profile() {
    const nav = window.navigator || {};
    const ua = String(nav.userAgent || nav.vendor || window.opera || "");
    const platform = String(nav.platform || "");
    const maxTouchPoints = Number(nav.maxTouchPoints || 0);
    const coarsePointer = _safeMatchMedia("(pointer: coarse)");
    const isTouch = maxTouchPoints > 0 || coarsePointer;

    const isIpadOsDesktopUa = platform === "MacIntel" && maxTouchPoints > 1;
    const isTabletUa = /iPad|Tablet|PlayBook|Kindle|Silk/i.test(ua) ||
        isIpadOsDesktopUa ||
        (/Android/i.test(ua) && !/Mobile/i.test(ua));

    const isPhoneUa = /iPhone|iPod|Windows Phone|IEMobile/i.test(ua) ||
        (/Android/i.test(ua) && /Mobile/i.test(ua));

    const viewportWidth = Math.max(
        window.innerWidth || 0,
        document.documentElement?.clientWidth || 0
    );
    const isPhoneViewport = viewportWidth > 0 && viewportWidth < 640;
    const isTabletViewport = viewportWidth >= 640 && viewportWidth < 1024;

    const is_phone = isPhoneUa || (isTouch && isPhoneViewport && !isTabletUa);
    const is_tablet = !is_phone && (isTabletUa || (isTouch && isTabletViewport));
    const is_pc = !is_phone && !is_tablet;

    return {
        kind: is_phone ? "phone" : (is_tablet ? "tablet" : "pc"),
        is_phone,
        is_tablet,
        is_pc,
        is_touch: isTouch,
        is_phone_viewport: isPhoneViewport,
        is_tablet_viewport: isTabletViewport,
        is_emulated_phone_view: isPhoneViewport && !is_phone && !is_tablet,
    };
}

function apply_user_device_classes(profile = get_user_device_profile()) {
    const classNames = [
        "device-phone",
        "device-tablet",
        "device-pc",
        "device-touch",
        "device-non-touch",
        "device-emulated-phone-view",
    ];
    const root = document.documentElement;
    const body = document.body;

    if (root) {
        root.classList.remove(...classNames);
        root.classList.add(`device-${profile.kind}`);
        root.classList.add(profile.is_touch ? "device-touch" : "device-non-touch");
        if (profile.is_emulated_phone_view) {
            root.classList.add("device-emulated-phone-view");
        }
        root.dataset.deviceKind = profile.kind;
    }

    if (body) {
        body.classList.remove(...classNames);
        body.classList.add(`device-${profile.kind}`);
        body.classList.add(profile.is_touch ? "device-touch" : "device-non-touch");
        if (profile.is_emulated_phone_view) {
            body.classList.add("device-emulated-phone-view");
        }
        body.dataset.deviceKind = profile.kind;
    }

    return profile;
}

function is_user_is_on_mobile_device() {
    const profile = get_user_device_profile();
    return profile.is_phone || profile.is_tablet;
}

function is_user_is_on_tablet_device() {
    return get_user_device_profile().is_tablet;
}

function is_user_is_on_pc_device() {
    return get_user_device_profile().is_pc;
}

function refresh_user_device_profile() {
    return apply_user_device_classes(get_user_device_profile());
}

let _deviceProfileRaf = null;
function _scheduleDeviceProfileRefresh() {
    if (_deviceProfileRaf !== null) {
        cancelAnimationFrame(_deviceProfileRaf);
    }
    _deviceProfileRaf = requestAnimationFrame(() => {
        _deviceProfileRaf = null;
        refresh_user_device_profile();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh_user_device_profile, { once: true });
} else {
    refresh_user_device_profile();
}
window.addEventListener("resize", _scheduleDeviceProfileRefresh, { passive: true });

window.get_user_device_profile = get_user_device_profile;
window.apply_user_device_classes = apply_user_device_classes;
window.refresh_user_device_profile = refresh_user_device_profile;
window.is_user_is_on_mobile_device = is_user_is_on_mobile_device;
window.is_user_is_on_tablet_device = is_user_is_on_tablet_device;
window.is_user_is_on_pc_device = is_user_is_on_pc_device;

function fade_effect(target, timer) {
    var fadeTarget = target;
    var fadeEffect = setInterval(function () {
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 1;
        }
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity -= 0.05;
        } else {
            clearInterval(fadeEffect);
            fadeTarget.remove();
        }
    }, timer);
}

function color_per_percent(current_val, max_val){

    let current_percent =`${Math.round((current_val * 100) / (max_val))}`;
    let status = "";

    if(current_percent == 100){
        status = "FULL";
    }else if(current_percent < 100 && current_percent >= 75){
        status = "ALMOST FULL";
    }else if(current_percent < 75 && current_percent >= 50){
        status = "AVERAGE";
    }else if(current_percent < 50 && current_percent >= 25){
        status = "BELOW AVERAGE";
    }else{
        status = "LOW";
    }

    let actual_stat = {
        "FULL": "text-emerald-400",
        "ALMOST FULL": "text-lime-300",
        "AVERAGE": "text-yellow-400",
        "BELOW AVERAGE": "text-orange-400",
        "LOW": "text-red-600"
    };

    return {
        "status": status,
        "color": actual_stat[status]
    };
}
