import diagnostics from './services/diagnostics.js';
import store from './services/store.js';
import logger from './utils/logger.js';
import bridgeClient from './services/bridge-client.js';
import { initResizers } from './ui/resizers.js';
import { initSidebars } from './ui/sidebars.js';

async function bootstrap() {
    logger.info('Modular Framework Bootstrapping...');
    diagnostics.report('Main', 'bootstrapping');

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
