import diagnostics from './services/diagnostics.js';
import store from './services/store.js';
import { Logger as logger } from './utils/logger.js';
import bridgeClient from './services/bridge-client.js';
import { registerDelugeLanguage } from './modules/grammar/tokenizer.js';
import { initAutocomplete } from './modules/autocomplete/index.js';
import { initLinter } from './modules/linter/index.js';
import { initHover } from './modules/hover/provider.js';
import { initCodeActions } from './modules/code-actions/provider.js';
import { initResizers } from './ui/resizers.js';
import { initSidebars } from './ui/sidebars.js';

async function bootstrap() {
    logger.info('Modular Framework Bootstrapping...');
    diagnostics.report('Main', 'bootstrapping');

    if (typeof monaco !== 'undefined') {
        registerDelugeLanguage(monaco);
        initAutocomplete(monaco);
        initLinter(monaco);
        initHover(monaco);
        initCodeActions(monaco);
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
