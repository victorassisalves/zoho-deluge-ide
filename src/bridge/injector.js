/**
 * src/bridge/injector.js
 * Bridges the gap between the Isolated World (Extension) and Main World (Zoho).
 * Injects a script to access 'window.ace' and other protected globals.
 */
import { logger as Logger } from '../utils/logger.js';

export const mainWorldInjector = {
    inject() {
        try {
            const script = document.createElement('script');
            // Use external file to comply with MV3 CSP
            script.src = chrome.runtime.getURL('assets/injected-bridge.js');
            (document.head || document.documentElement).appendChild(script);
            script.onload = () => {
                script.remove();
                Logger.info("[Injector] Main World script injected.");
            };
        } catch (e) {
            Logger.error("[Injector] Failed to inject:", e);
        }
    }
};
