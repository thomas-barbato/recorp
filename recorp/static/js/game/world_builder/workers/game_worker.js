import { systems } from "./systems/index.js";

self.onmessage = (event) => {
    const { type, payload, requestId } = event.data;
    
    if (!type || !systems[type]) {
        self.postMessage({
            requestId,
            error: `Unknown worker action: ${type}`
        });
        return;
    }

    try {
        const result = systems[type](payload);
        self.postMessage({
            requestId,
            result
        });
    } catch (e) {
        self.postMessage({
            requestId,
            error: e.message
        });
    }
};
