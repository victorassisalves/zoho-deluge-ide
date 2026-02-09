/**
 * Monaco Editor Lifecycle Management
 */
import store from '../services/store.js';
import logger from '../utils/logger.js';
import { registerDraculaTheme } from '../ui/themes/dracula.js';

export const initEditor = (monaco) => {
    const container = document.getElementById('editor-container');
    if (!container) return;

    registerDraculaTheme(monaco);

    const editor = monaco.editor.create(container, {
        value: '// Start coding in Zoho Deluge...\n\n',
        language: 'deluge',
        theme: 'dracula',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        glyphMargin: true
    });

    store.setEditor(editor);
    logger.info('Monaco Editor initialized');

    // Basic event listeners
    editor.onDidChangeModelContent(() => {
        // Validation will be handled by the linter feature
    });

    editor.onDidChangeCursorPosition(e => {
        const pos = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        const statusBarPos = document.getElementById('cursor-pos');
        if (statusBarPos) statusBarPos.innerText = pos;
    });

    window.addEventListener('resize', () => {
        editor.layout();
    });

    return editor;
};
