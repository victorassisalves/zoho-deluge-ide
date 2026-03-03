// app/core/bus.js
// Message Bus for communication between Client (IDE) and Host (Zoho Page) / Background

// Generate a unique instance ID for this context to prevent infinite broadcast loops
const INSTANCE_ID = Math.random().toString(36).substring(2, 15);

// Initialize the Reactive Event Bus
let reactiveBus;
try {
    reactiveBus = new BroadcastChannel('zoho_ide_bus');
} catch (e) {
    console.warn('BroadcastChannel not supported for reactive bus', e);
}

export const Bus = {
    /**
     * Listen for messages from Host, Background, or BroadcastChannel
     * @param {string} type - The message type (e.g., MSG.CODE_EXECUTE)
     * @param {function} callback - The callback function(payload, source)
     */
    listen(type, callback) {
        // 1. Listen for BroadcastChannel messages
        if (reactiveBus) {
            reactiveBus.addEventListener('message', (event) => {
                const { instanceId, type: msgType, payload } = event.data;

                // Drop self-generated messages to prevent loops
                if (instanceId === INSTANCE_ID) return;

                if (msgType === type) {
                    // Wrap the source to indicate it came from the broadcast channel
                    callback(payload, { isBroadcast: true, instanceId });
                }
            });
        }

        // 2. Listen for postMessage (from Host via Iframe)
        window.addEventListener('message', (event) => {
            // Check if message structure matches our protocol
            // Make sure not to conflict with BroadcastChannel events which aren't from window
            if (event.data && event.data.type === type) {
                // Ensure this isn't an echoed message from our own iframe
                if (event.data.instanceId === INSTANCE_ID) return;

                callback(event.data.payload, event.source);
            }
        });

        // 3. Listen for runtime messages (from Background in Standalone Mode)
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                // Runtime messages use 'action' instead of 'type' usually
                if (message.action === type || message.type === type) {
                    // Prevent looping runtime messages if applicable
                    if (message.instanceId === INSTANCE_ID) return;

                    const payload = message.payload || message; // Fallback if payload isn't separated
                    callback(payload, sender);
                }
            });
        }
    },

    /**
     * Send message to Host, Background, and other Reactive Windows
     * @param {string} type - The message type
     * @param {object} payload - The data to send
     */
    send(type, payload = {}) {
        const isIframe = typeof window !== 'undefined' && window.parent !== window;

        // Create the message package with the required instanceId
        const messagePackage = {
            instanceId: INSTANCE_ID,
            type,
            payload
        };

        // 1. Broadcast to all other reactive windows
        if (reactiveBus) {
            try {
                reactiveBus.postMessage(messagePackage);
            } catch (e) {
                console.warn(`[Bus] Failed to broadcast message: ${type}`, e);
            }
        }

        // 2. Send via Window postMessage (Iframe Mode)
        if (isIframe) {
            window.parent.postMessage(messagePackage, '*');
        }

        // 3. Send via Chrome Runtime (Standalone Mode)
        if (!isIframe && typeof chrome !== 'undefined' && chrome.runtime) {
            // Include action for backward compatibility with older listeners
            try {
                chrome.runtime.sendMessage({
                    action: type,
                    ...messagePackage
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        // It's normal for no listener to be present if background script isn't active
                        // Or if we're in a page context where the background doesn't care
                    }

                    // For Standalone mode, we bridge the callback to the event system if relevant
                    if (response && type === 'editor:pull') {
                        const responseType = type + ':response';
                        window.postMessage({ type: responseType, payload: response, instanceId: INSTANCE_ID }, '*');
                    }
                });
            } catch (e) {
                console.warn(`[Bus] Failed to send runtime message: ${type}`, e);
            }
        }
    }
};
