const csrf_token = document.querySelector("meta[name=csrf-token]").getAttribute('content');

function is_user_is_on_mobile_device() {
    return (
        /\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod|KFAPWI|SAMSUNG|Samsung|SamsungBrowser)\b/i.test(window.navigator.userAgent)
    );
}

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
    }
}