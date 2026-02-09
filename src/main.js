/**
 * Main Entry Point for Zoho Deluge IDE
 */
import { registerDelugeGrammar } from './core/deluge-grammar.js';
import { initEditor } from './core/editor.js';
import { initAutocomplete } from './features/autocomplete/index.js';
import { initLinter } from './features/linter/index.js';
import { initConsole } from './ui/bottom-panel/console.js';
import { initJsonConverter } from './ui/modals/json-converter.js';
import logger from './utils/logger.js';
import store from './services/store.js';

async function bootstrap() {
    logger.info('Bootstrapping Modular IDE...');

    // 1. Initialize Core Editor
    // Wait for Monaco to be ready (it is loaded via AMD in loader-init.js)
    if (typeof monaco === 'undefined') {
        logger.error('Monaco not found! Ensure loader-init.js is working.');
        return;
    }

    registerDelugeGrammar(monaco);
    const editor = initEditor(monaco);

    // 2. Initialize Features
    initAutocomplete(monaco);
    initLinter(monaco);

    // 3. Initialize UI Components
    initConsole();
    initJsonConverter();

    logger.info('IDE Ready.');
}

// Start when DOM is ready
if (document.readyState === 'complete') {
    bootstrap();
} else {
    window.addEventListener('load', bootstrap);
}
