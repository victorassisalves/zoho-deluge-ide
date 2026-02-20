// app/core/bus.js
// Message Bus for communication between Client (IDE) and Host (Zoho Page) / Background

import { Logger } from '../utils/logger.js';

export const Bus = {
    /**
     * Listen for messages from Host or Background
     * @param {string} type - The message type (e.g., MSG.CODE_EXECUTE)
     * @param {function} callback - The callback function(payload, source)
     */
    listen(type, callback) {
        Logger.debug(`[Bus] Listening for: ${type}`);
        // 1. Listen for postMessage (from Host via Iframe)
        window.addEventListener('message', (event) => {
            // Check if message structure matches our protocol
            if (event.data && event.data.type === type) {
                Logger.debug(`[Bus] Received (Iframe): ${type}`);
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
        Logger.debug(`[Bus] Sending: ${type} (Mode: ${isIframe ? 'Iframe' : 'Standalone'})`);

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
                chrome.runtime.sendMessage({ action: type, ...payload }, (response) => {
                    // For Standalone mode, we need to bridge the callback to the event system
                    // if the response is relevant (e.g. Pull code)
                    if (response && type === 'editor:pull') {
                         // Simulate receiving a response message
                         const responseType = type + ':response';
                         Logger.debug(`[Bus] Received (Standalone Callback): ${responseType}`);
                         // Dispatch event so listeners can pick it up
                         // Bus.listen uses window.addEventListener('message') or runtime.onMessage
                         // Ideally we should just call the listener directly?
                         // No, listeners are registered via Bus.listen.
                         // But Bus.listen for standalone listens to runtime.onMessage.
                         // The callback is distinct.
                         // We can postMessage to self to trigger the window listener?
                         window.postMessage({ type: responseType, payload: response }, '*');
                    }
                });
            } else {
                console.warn('[Bus] Failed to send message in standalone mode: API unavailable', type);
            }
        }
    }
};
