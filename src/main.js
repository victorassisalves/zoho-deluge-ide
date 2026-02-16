/**
 * src/main.js
 * Main Entry Point for both Content Script (Zoho Page) and IDE (Extension Page).
 */
import { bootstrapper } from './core/bootstrapper.js';
import { logger as Logger } from './utils/logger.js';
import { bridgeServer } from './bridge/server.js';
// We import these only for side-effects or if needed by specific contexts
import './services/bridge-client.js';

(function() {
    // Avoid double initialization
    if (window.__ZOHO_IDE_INITIALIZED__) {
        Logger.debug("[Main] Extension already running.");
        return;
    }
    window.__ZOHO_IDE_INITIALIZED__ = true;

    const init = () => {
        // DETECT CONTEXT
        const isExtensionContext = window.location.protocol === 'chrome-extension:';

        if (isExtensionContext) {
            // --- IDE MODE (Side Panel / Popup / Tab) ---
            // Context: 'standalone'
            Logger.info("[Main] Starting in IDE Mode (Standalone)...");

            // In Standalone mode:
            // 1. Run Migrations
            // 2. Init UI (maybe? ide.html handles most of it, but bootstrapper calls uiEngine.init('standalone') which skips ShadowDOM)
            // 3. Init BridgeClient (to talk to Content Script)

            bootstrapper.init('standalone');

            // Start Connection Verification (Client Side)
            import('./services/bridge-client.js').then(({ bridgeClient }) => {
                setTimeout(() => bridgeClient.ping(), 2000);
            });

        } else {
            // --- CONTENT SCRIPT MODE (Zoho Page) ---
            // Context: 'content'
            Logger.info("[Main] Starting in Content Script Mode...");

            // In Content Script mode:
            // 1. Run Migrations (Shared storage)
            // 2. Init Bridge Manager (Injects script)
            // 3. Init Bridge Server (RPC Listener)
            // 4. Init UI Engine (Overlay + FAB)

            // We use bootstrapper to keep it clean, but we also need BridgeServer which isn't in bootstrapper by default

            bootstrapper.init('content');

            // Init Bridge Server (RPC Listener for IDE <-> Page communication)
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
