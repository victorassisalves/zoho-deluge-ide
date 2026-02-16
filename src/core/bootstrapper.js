/**
 * src/core/bootstrapper.js
 * The Bootstrapper: Ensures dependencies load in the correct order.
 * 1. Migration (Data) -> 2. Bridge (Coordination) -> 3. UI Shell (Presentation)
 */
import { logger as Logger } from '../utils/logger.js';
import { migrateLocalStorage } from '../data/migrator.js';
import { bridgeManager } from '../bridge/manager.js';
import { interfaceManager } from '../bridge/interface.js';
import { uiEngine } from '../ui/index.js';

class Bootstrapper {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Executes the primary startup sequence.
     */
    async init() {
        if (this.isInitialized) return;

        try {
            Logger.info("[Boot] Initializing Zoho Deluge IDE V1...");

            // Stage 1: Persistence (Ensure data is ready before UI)
            Logger.debug("[Boot] Stage 1: Running migrations...");
            await migrateLocalStorage();

            // Stage 2: Coordination (Start Sentinel & Event Routing)
            Logger.debug("[Boot] Stage 2: Starting Bridge Manager...");
            bridgeManager.init();
            interfaceManager.init();

            // Stage 3: Presentation (Mount the Face of the IDE)
            Logger.debug("[Boot] Stage 3: Mounting UI Shell...");
            uiEngine.init();

            this.isInitialized = true;
            Logger.info("[Boot] Extension fully operational.");
        } catch (error) {
            Logger.error("[Boot] Critical initialization failure:", error);
        }
    }
}

export const bootstrapper = new Bootstrapper();
