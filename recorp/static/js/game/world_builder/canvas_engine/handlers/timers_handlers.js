export function invalidateTimerEffect(event) {

    if (!event) return;

    const list = event.payload || event.effects || [];
    if (!Array.isArray(list) || list.length === 0) return;

    list.forEach(e => {
        const key = `${e.target_type}_${e.target_id}`;
        
        if (e.effect === "scan") {
            window.clearScan(key);
            window.scanExpiredLocal?.delete(key);
            window.scanExpiredLocal.delete(targetKey);
            // (optionnel) cleanup du timer visuel  
            const effect_key = `scan:${targetKey}`;
            if (window.effectVisualTimers?.has(effect_key)) {
                clearTimeout(window.effectVisualTimers.get(effect_key));
                window.effectVisualTimers.delete(effect_key);
            }
        } else {

            window.unregisterEffect(e.effect, key);
        }

        refreshModalAfterScan?.(key);
        window.canvasEngine?.renderer?.requestRedraw();
    });

}