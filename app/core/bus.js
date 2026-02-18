import { MSG } from '../../shared/protocol.js';

class MessageBus {
    constructor() {
        this.listeners = {};
        window.addEventListener('message', (event) => this.handleMessage(event));
    }

    send(type, payload = {}) {
        const msg = { type, ...payload };
        // Determine target: parent window (Host)
        // If we are in a tab (not iframe), window.parent === window.
        // But for Side Panel/Content Script injection, parent is Host.
        // For Tab mode, we rely on chrome.runtime.sendMessage usually, but the plan asks for postMessage bridge.
        // If we are in a tab, postMessage to self won't reach the Host page content script unless we are the content script (we are not).
        // However, the prompt implies "Separate Host from Client".
        // If running as a Tab, there is no Host page. The Extension Background is the "Host" in a way.
        // But let's follow the prompt: "use window.parent.postMessage".
        window.parent.postMessage(msg, '*');
    }

    listen(type, callback) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(callback);
    }

    handleMessage(event) {
        const data = event.data;
        if (!data || !data.type) return;
        if (this.listeners[data.type]) {
            this.listeners[data.type].forEach(cb => cb(data));
        }
    }
}

export const Bus = new MessageBus();
window.Bus = Bus;
window.MSG = MSG;
