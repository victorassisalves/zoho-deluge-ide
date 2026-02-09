/**
 * Diagnostics System
 * Tracks module loading and health.
 */
import logger from '../utils/logger.js';

class Diagnostics {
    constructor() {
        this.modules = {};
        this.startTime = Date.now();
    }

    report(moduleName, status, details = null) {
        this.modules[moduleName] = {
            status,
            timestamp: Date.now() - this.startTime,
            details
        };
        logger.info('Module ' + moduleName + ': ' + status);

        // Broadcast for UI
        window.dispatchEvent(new CustomEvent('zide-diagnostic-update', {
            detail: { moduleName, status, details }
        }));
    }

    getSummary() {
        return this.modules;
    }
}

const diagnostics = new Diagnostics();
export default diagnostics;
