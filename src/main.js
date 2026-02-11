import diagnostics from './services/diagnostics.js';
import store from './services/store.js';
import logger from './utils/logger.js';
import bridgeClient from './services/bridge-client.js';
import { migrateFromLegacy } from './core/db.js';
import FileManager from './services/FileManager.js';
import InterfaceManager from './services/InterfaceManager.js';

window.FileManager = FileManager;
window.InterfaceManager = InterfaceManager;
import { initAutocomplete } from './features/autocomplete/index.js';
import { initLinter } from './features/linter/index.js';
import { initResizers } from './ui/resizers.js';
import { initSidebars } from './ui/sidebars.js';

async function bootstrap() {
    logger.info('Modular Framework Bootstrapping...');
    diagnostics.report('Main', 'bootstrapping');

    await migrateFromLegacy();

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
