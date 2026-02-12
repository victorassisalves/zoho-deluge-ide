import diagnostics from './services/diagnostics.js';
import store from './services/store.js';
import logger from './utils/logger.js';
import bridgeClient from './services/bridge-client.js';
import migrationService from './services/MigrationService.js';
import fileManager from './services/FileManager.js';
import db from './services/db.js';
import interfaceManager from './services/InterfaceManager.js';
import syncService from './services/SyncService.js';
import { initAutocomplete } from './features/autocomplete/index.js';
import { initLinter } from './features/linter/index.js';
import { initResizers } from './ui/resizers.js';
import { initSidebars } from './ui/sidebars.js';

async function bootstrap() {
    logger.info('Modular Framework Bootstrapping...');
    diagnostics.report('Main', 'bootstrapping');

    // Expose services to global scope for monolithic ide.js
    window.FileManager = fileManager;
    window.DB = db;
    window.InterfaceManager = interfaceManager;
    window.SyncService = syncService;

    // Run Migration
    try {
        await migrationService.migrate();
    } catch (e) {
        logger.error('Migration failed:', e);
    }

    if (typeof monaco !== 'undefined') {
        // Autocomplete is now handled by deluge-lang.js for better Zoho integration
        // initAutocomplete(monaco);
        initLinter(monaco);
    }

    initResizers();
    initSidebars();

    // Verify Bridge Connection
    setTimeout(() => bridgeClient.ping(), 2000);

    diagnostics.report('Main', 'ready');
}

if (document.readyState === 'complete') {
    bootstrap();
} else {
    window.addEventListener('load', bootstrap);
}
