// app/core/bus.js
// Message Bus for communication between Client (IDE) and Host (Zoho Page) / Background

export const Bus = {
    /**
     * Listen for messages from Host or Background
     * @param {string} type - The message type (e.g., MSG.CODE_EXECUTE)
     * @param {function} callback - The callback function(payload, source)
     */
    listen(type, callback) {
        console.debug(`[Bus] Listening for: ${type}`);
        // 1. Listen for postMessage (from Host via Iframe)
        window.addEventListener('message', (event) => {
            // Check if message structure matches our protocol
            if (event.data && event.data.type === type) {
                console.debug(`[Bus] Received (Iframe): ${type}`, event.data.payload);
                callback(event.data.payload, event.source);
            }
        });

        // 2. Listen for runtime messages (from Background in Standalone Mode)
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                // Runtime messages use 'action' instead of 'type' usually
                if (message.action === type || message.type === type) {
                    const payload = message.payload || message; // Fallback if payload isn't separated
                    callback(payload, sender);
                }
                // We don't return true here; async handling is up to specific handlers if they need it
                // but Bus doesn't support sendResponse callback directly in this simple design yet.
            });
        }
    },

    /**
     * Send message to Host or Background
     * @param {string} type - The message type
     * @param {object} payload - The data to send
     */
    send(type, payload = {}) {
        const isIframe = window.parent !== window;
        console.debug(`[Bus] Sending: ${type} (Mode: ${isIframe ? 'Iframe' : 'Standalone'})`, payload);

        if (isIframe) {
            // Iframe Mode: Send to Host Page
            // The Host content script listens for this specific structure
            window.parent.postMessage({ type, payload }, '*');
        } else {
            // Standalone Mode: Send to Background Script
            // Background script will proxy this to the active Zoho tab content script
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                // We flatten the payload into the message for runtime compatibility if needed,
                // or keep it structured. Existing content script expects { action, ... }
                // So we map 'type' to 'action'.
                chrome.runtime.sendMessage({ action: type, ...payload });
            } else {
                console.warn('[Bus] Failed to send message in standalone mode: API unavailable', type);
            }
        }
    }
};
