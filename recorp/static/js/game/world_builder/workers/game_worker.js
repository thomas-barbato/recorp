const workerUrl = new URL(import.meta.url);
const version = workerUrl.searchParams.get("v");
const suffix = version ? `?v=${encodeURIComponent(version)}` : "";
const { systems } = await import(`./systems/index.js${suffix}`);

self.onmessage = async (event) => {
    const { type, payload, requestId } = event.data;

    if (!type || !systems[type]) {
        self.postMessage({
            requestId,
            error: `Unknown worker action: ${type}`
        });
        return;
    }

    try {
        const result = await systems[type](payload);
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