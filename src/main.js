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
    console.log('[ZohoIDE] Bootstrap starting...');
    try {
        if (typeof monaco === 'undefined') {
            console.error('[ZohoIDE] Monaco not found');
            return;
        }

        registerDelugeGrammar(monaco);
        console.log('[ZohoIDE] Grammar registered');

        initEditor(monaco);
        console.log('[ZohoIDE] Editor initialized');

        initAutocomplete(monaco);
        initLinter(monaco);
        console.log('[ZohoIDE] Features initialized');

        initConsole();
        initJsonConverter();
        initLeftSidebar();
        initRightSidebar();
        initResizers();
        initUIEvents();
        console.log('[ZohoIDE] UI initialized');

        initConnectionPolling();

        window.addEventListener('zide-context-changed', loadProjectData);
        loadProjectData();

        console.log('[ZohoIDE] IDE Ready');
    } catch (err) {
        console.error('[ZohoIDE] Bootstrap Error:', err);
    }
}

if (document.readyState === 'complete') {
    bootstrap();
} else {
    window.addEventListener('load', bootstrap);
}
