/**
 * Main Entry Point for Zoho Deluge IDE
 */
import { registerDelugeGrammar } from './core/deluge-grammar.js';
import { initEditor } from './core/editor.js';
import { initAutocomplete } from './features/autocomplete/index.js';
import { initLinter } from './features/linter/index.js';
import { initConsole } from './ui/bottom-panel/console.js';
import { initJsonConverter } from './ui/modals/json-converter.js';
import { initUIEvents } from './ui/events.js';
import { initLeftSidebar } from './ui/sidebar/left-sidebar.js';
import { initRightSidebar } from './ui/sidebar/right-sidebar.js';
import { initResizers } from './ui/resizers.js';
import { initConnectionPolling } from './services/connection.js';
import { loadProjectData } from './services/storage.js';
import logger from './utils/logger.js';

async function bootstrap() {
    logger.info('Bootstrapping Modular IDE...');

    if (typeof monaco === 'undefined') {
        logger.error('Monaco not found!');
        return;
    }

    registerDelugeGrammar(monaco);
    initEditor(monaco);

    initAutocomplete(monaco);
    initLinter(monaco);

    initConsole();
    initJsonConverter();
    initLeftSidebar();
    initRightSidebar();
    initResizers();
    initUIEvents();

    initConnectionPolling();

    window.addEventListener('zide-context-changed', loadProjectData);
    loadProjectData();

    logger.info('IDE Ready.');
}

if (document.readyState === 'complete') {
    bootstrap();
} else {
    window.addEventListener('load', bootstrap);
}
