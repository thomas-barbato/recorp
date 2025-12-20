export function getScanResult(msg) {
    if (!msg?.target_key || !msg?.data) return;
    const { target_key, data} = msg;
    const remaning_ap = msg?.remaining_ap

    window.scannedTargets ??= new Set();
    window.scannedModalData ??= {};

    window.scannedTargets.add(target_key);
    window.scannedModalData[target_key] = data;

    window.canvasEngine?.renderer?.requestRedraw();
    let progressBarApRemaining = document.getElementById("actionPoint-container-value-min");
    let progressBarApMax = document.getElementById("actionPoint-container-value-max").textContent;
    let progressBarApWidth = document.getElementById("ap-percent");
    let apRemaningText = document.getElementById("ap-container-value-min");

    if(progressBarApRemaining){
        progressBarApRemaining.textContent = remaning_ap;
    }

    if(progressBarApMax){
        if(progressBarApWidth){
            let ap_percent = Math.max(0, Math.min(100, (remaning_ap / parseInt(progressBarApMax)) * 100));
            progressBarApWidth.style.width = `${ap_percent}%`; 
        }
    }

    if(apRemaningText){
        apRemaningText.textContent = remaning_ap;
    }

    refreshModalAfterScan(target_key);
}

export function sendScanResultToGroup(msg){
    if (!msg.recipients.includes(window.current_player_id)) return;

    window.scannedTargets.add(msg.target_key);
    window.sharedTargets.add(msg.target_key);

    rebuildPcNpcModal(`modal-${msg.target_key}`, msg.data);
    window.canvasEngine?.renderer?.requestRedraw();
}

export function handleScanStateSync(msg) {
    const targets = msg?.targets || [];

    window.scannedTargets ??= new Set();
    window.sharedTargets ??= new Set();
    window.scannedModalData ??= {};

    targets.forEach(t => {
        if (t?.target_key) {
            window.scannedTargets.add(t.target_key);
            console.log(window.scannedModalData)
            window.scannedModalData[t.target_key] = t.data;
            refreshModalAfterScan(t.target_key);
        }
    });

    window.canvasEngine?.renderer?.requestRedraw();
}