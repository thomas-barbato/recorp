const csrf_token = document.querySelector("meta[name=csrf-token]").getAttribute('content');

function is_user_is_on_mobile_device() {
    return (
        /\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod|KFAPWI|KHTML|SAMSUNG|Samsung|SamsungBrowser)\b/i.test(window.navigator.userAgent)
    );
}