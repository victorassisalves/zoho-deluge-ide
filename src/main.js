/**
 * src/main.js
 * Main Entry Point for both Content Script (Zoho Page) and IDE (Extension Page).
 */
import { bootstrapper } from './core/bootstrapper.js';
import { logger as Logger } from './utils/logger.js';
import { bridgeServer } from './bridge/server.js';
import { bridgeManager } from './bridge/manager.js';
import { interfaceManager } from './bridge/interface.js';

(function() {
    // Avoid double initialization
    if (window.__ZOHO_IDE_INITIALIZED__) {
        Logger.debug("[Main] Extension already running.");
        return;
    }
    window.__ZOHO_IDE_INITIALIZED__ = true;

    const init = () => {
        // DETECT CONTEXT
        // If we are in an extension page (popup, options, sidepanel), protocol is chrome-extension:
        // If we are injected into Zoho, protocol is https:
        const isExtensionContext = window.location.protocol === 'chrome-extension:';

        if (isExtensionContext) {
            // --- IDE MODE (Side Panel / Popup / Tab) ---
            Logger.info("[Main] Starting in IDE Mode...");

            // Full Bootstrap (Migration, Bridge, UI)
            bootstrapper.init();

            // In IDE mode, we also need to start the Bridge Client verification
            // ideally this should be part of bootstrapper or uiEngine, but for now we add it here
            import('./services/bridge-client.js').then(({ bridgeClient }) => {
                setTimeout(() => bridgeClient.ping(), 2000);
            });

        } else {
            // --- CONTENT SCRIPT MODE (Zoho Page) ---
            Logger.info("[Main] Starting in Content Script Mode...");

            // In Content Script, we need:
            // 1. Bridge Manager (to inject Main World Bridge and hold Strategy)
            // 2. Interface Manager (for F2 shortcut)
            // 3. Bridge Server (to listen for IDE commands)

            // We do NOT want UI Engine (Sidebars, Resizers) here as they are for IDE DOM.

            // Init Bridge Manager (Injects script)
            bridgeManager.init();

            // Init Interface Manager (F2 listener)
            interfaceManager.init();

            // Init Bridge Server (RPC Listener)
            bridgeServer.init();

            Logger.info("[Main] Content Script Ready.");
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
