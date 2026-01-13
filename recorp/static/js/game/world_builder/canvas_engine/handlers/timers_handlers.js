export function invalidateTimerEffect(event){

    if (!event) return;
    
    event.payload.forEach(e => {
        const key = `${e.target_type}_${e.target_id}`;

        if (e.effect === "scan") {
            window.clearScan(key);
        } else {
            window.unregisterEffect(e.effect, key);
        }

        refreshModalAfterScan?.(key);
        window.canvasEngine?.renderer?.requestRedraw();
    });
}