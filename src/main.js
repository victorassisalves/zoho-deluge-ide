/**
 * src/main.js
 * Main Content Script Entry Point.
 */
import { bootstrapper } from './core/bootstrapper.js';
import { logger as Logger } from './utils/logger.js';
import { eventBus } from './core/bus.js';
import { EVENTS } from './core/events.js';

(function() {
    // Avoid double initialization in case of re-injection
    if (window.__ZOHO_IDE_INITIALIZED__) {
        Logger.debug("[Main] Extension already running.");
        return;
    }
    window.__ZOHO_IDE_INITIALIZED__ = true;

    // Expose EventBus for Legacy Scripts (ide.js)
    window.ZideEventBus = eventBus;
    window.ZideEvents = EVENTS;

    /**
     * Start the system once the DOM is sufficiently ready.
     * We don't necessarily wait for full load because Zoho is an SPA;
     * the Sentinel handles late-loading editors.
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => bootstrapper.init());
    } else {
        bootstrapper.init();
    }
})();
