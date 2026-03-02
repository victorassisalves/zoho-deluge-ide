// app/core/bus.js
// Message Bus for communication between Client (IDE), Host (Zoho Page), Background, and other IDE Instances

import { Logger } from '../utils/logger.js';

class EventBus extends EventTarget {
    constructor() {
        super();
        this.instanceId = crypto.randomUUID();
        this.channel = new BroadcastChannel('deluge_ide_sync');

        Logger.debug(`[Bus] Initialized with instanceId: ${this.instanceId}`);

        this._setupHorizontalSync();
        this._setupVerticalSync();
    }

    /**
     * Set up Horizontal Communication (IDE Instance <--> IDE Instance)
     * using the BroadcastChannel API for real-time state sync.
     */
    _setupHorizontalSync() {
        this.channel.onmessage = (event) => {
            const { instanceId, type, payload, timestamp } = event.data;

            // Ignore messages broadcasted by this very instance
            if (instanceId === this.instanceId) return;

            Logger.debug(`[Bus] Received (Horizontal): ${type} from ${instanceId}`);

            // Emit a local event for internal IDE components to react to remote state changes
            const localEvent = new CustomEvent(type, { detail: { payload, timestamp, instanceId } });
            this.dispatchEvent(localEvent);
        };
    }

    /**
     * Set up Vertical Communication (IDE <--> Background Worker / Host Page)
     * using window.addEventListener('message') and chrome.runtime.onMessage.
     */
    _setupVerticalSync() {
        // 1. Listen for postMessage (from Host via Iframe)
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type) {
                Logger.debug(`[Bus] Received (Vertical Iframe): ${event.data.type}`);
                const localEvent = new CustomEvent(event.data.type, {
                    detail: { payload: event.data.payload, source: event.source, isVertical: true }
                });
                this.dispatchEvent(localEvent);
            }
        });

        // 2. Listen for runtime messages (from Background in Standalone Mode)
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                const type = message.action || message.type;
                if (type) {
                    const payload = message.payload || message;
                    Logger.debug(`[Bus] Received (Vertical Runtime): ${type}`);

                    const localEvent = new CustomEvent(type, {
                        detail: { payload, sender, isVertical: true }
                    });
                    this.dispatchEvent(localEvent);
                }
            });
        }
    }

    /**
     * Subscribe to an event (Vertical or Horizontal)
     * @param {string} type - The event type
     * @param {function} callback - Callback function receiving the event detail
     */
    on(type, callback) {
        this.addEventListener(type, (e) => callback(e.detail));
    }

    /**
     * Listen for messages (alias for backwards compatibility before rewrite)
     */
    listen(type, callback) {
        this.addEventListener(type, (e) => {
            const detail = e.detail || {};
            const payload = detail.payload || detail;
            const source = detail.source || detail.sender || null;
            callback(payload, source);
        });
    }

    /**
     * Unsubscribe from an event
     * @param {string} type - The event type
     * @param {function} callback - The callback to remove
     */
    off(type, callback) {
        this.removeEventListener(type, callback);
    }

    /**
     * Broadcast a message Horizontally to all other open IDE instances.
     * @param {string} type - The action type (e.g., 'CODE_UPDATED')
     * @param {object} payload - The data to share
     */
    broadcast(type, payload = {}) {
        const message = {
            instanceId: this.instanceId,
            type,
            payload,
            timestamp: Date.now()
        };
        Logger.debug(`[Bus] Broadcasting (Horizontal): ${type}`);
        this.channel.postMessage(message);
    }

    /**
     * Send a message Vertically to the Background Script or Host Page.
     * @param {string} type - The action type (e.g., 'editor:pull')
     * @param {object} payload - The data to send
     */
    send(type, payload = {}) {
        const isIframe = window.parent !== window;
        Logger.debug(`[Bus] Sending (Vertical): ${type} (Mode: ${isIframe ? 'Iframe' : 'Standalone'})`);

        if (isIframe) {
            // Iframe Mode: Send to Host Page
            window.parent.postMessage({ type, payload }, '*');
        } else {
            // Standalone Mode: Send to Background Script
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: type, ...payload }, (response) => {
                    // Simulate receiving a response message
                    if (response) {
                        const responseType = type + ':response';
                        Logger.debug(`[Bus] Received (Standalone Callback): ${responseType}`);
                        this.dispatchEvent(new CustomEvent(responseType, {
                            detail: { payload: response, isVertical: true }
                        }));
                    }
                });
            } else {
                console.warn('[Bus] Failed to send message vertically: API unavailable', type);
            }
        }
    }
}

// Export a singleton instance
export const Bus = new EventBus();
