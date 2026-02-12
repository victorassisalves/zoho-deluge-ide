import shortcutService from '../ShortcutService.js';
import db from '../../services/db.js';
import fileManager from '../../services/FileManager.js';

class CodeEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.editor = null;
        this.models = {}; // key -> { model, originalCode, syncStatus }
        this.theme = 'dracula';
        this.fontSize = 14;
    }

    async init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('[CodeEditor] Container not found:', this.containerId);
            return;
        }

        this.defineThemes();

        if (typeof chrome !== "undefined" && chrome.storage) {
            const themeConfig = await chrome.storage.local.get('theme');
            if (themeConfig.theme) this.theme = themeConfig.theme;

            const fontSizeConfig = await chrome.storage.local.get('editorFontSize');
            if (fontSizeConfig.editorFontSize) this.fontSize = parseInt(fontSizeConfig.editorFontSize);
        }

        this.editor = monaco.editor.create(container, {
            theme: this.theme,
            automaticLayout: true,
            wordBasedSuggestions: false,
            fontSize: this.fontSize,
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            glyphMargin: true
        });

        window.editor = this.editor; // For compatibility

        this.setupListeners();
        this.registerDefaultShortcuts();

        window.addEventListener('resize', () => {
            if (this.editor) this.editor.layout();
        });

        setTimeout(() => this.layout(), 500);
        setTimeout(() => this.layout(), 2000);

        console.log('[CodeEditor] Initialized');
    }

    defineThemes() {
        monaco.editor.defineTheme('dracula', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272a4' },
                { token: 'keyword', foreground: 'ff79c6' },
                { token: 'number', foreground: 'bd93f9' },
                { token: 'string', foreground: 'f1fa8c' },
                { token: 'delimiter', foreground: 'f8f8f2' },
                { token: 'operator', foreground: 'ff79c6' },
                { token: 'identifier', foreground: 'f8f8f2' },
                { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'function', foreground: '50fa7b' },
                { token: 'method', foreground: '50fa7b' },
                { token: 'variable', foreground: 'ffb86c' },
                { token: 'key', foreground: '8be9fd' },
                { token: 'brackets', foreground: 'f8f8f2' }
            ],
            colors: {
                'editor.background': '#282a36',
                'editor.foreground': '#f8f8f2',
                'editorCursor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#44475a',
                'editorLineNumber.foreground': '#6272a4',
                'editor.selectionBackground': '#44475a',
                'editorIndentGuide.background': '#44475a',
                'editorIndentGuide.activeBackground': '#6272a4'
            }
        });
    }

    setupListeners() {
        this.editor.onDidChangeCursorPosition((e) => {
            const pos = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
            const cursorElem = document.getElementById('cursor-pos');
            if (cursorElem) cursorElem.textContent = pos;
        });
    }

    registerDefaultShortcuts() {
        this.addShortcut('zide-save-local', [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS], () => {
            if (window.saveLocally) window.saveLocally();
        }, 'Save Locally');

        this.addShortcut('zide-push-zoho', [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS], () => {
            if (window.pushToZoho) window.pushToZoho(true);
        }, 'Push to Zoho');

        this.addShortcut('zide-push-execute-zoho', [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter], () => {
            if (window.pushToZoho) window.pushToZoho(true, true);
        }, 'Push and Execute');

        this.addShortcut('zide-pull-zoho', [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP], () => {
            if (window.pullFromZoho) window.pullFromZoho();
        }, 'Pull from Zoho');

        this.editor.addAction({
            id: 'zide-extract-interface',
            label: 'Extract to Interface',
            contextMenuGroupId: 'navigation',
            run: () => {
                const selection = this.editor.getSelection();
                const text = this.editor.getModel().getValueInRange(selection);
                if (text && window.openExtractInterfaceModal) {
                    window.openExtractInterfaceModal(text);
                }
            }
        });
    }

    addShortcut(id, defaultKeys, callback, label) {
        const keys = shortcutService.register(id, defaultKeys, callback);
        this.editor.addAction({
            id: id,
            label: label,
            keybindings: keys,
            run: () => shortcutService.execute(id)
        });
    }

    getOrCreateModel(key, initialCode = "") {
        if (this.models[key]) return this.models[key];

        const model = monaco.editor.createModel(initialCode, 'deluge');
        this.models[key] = {
            model: model,
            originalCode: initialCode,
            syncStatus: 'UNKNOWN'
        };

        let saveTimeout;
        model.onDidChangeContent(() => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.saveModelsToStorage(), 1000);

            if (window.validateDelugeModel) window.validateDelugeModel(model);
            if (window.renderOpenEditors) window.renderOpenEditors();
            if (window.renderExplorer) window.renderExplorer();
        });

        return this.models[key];
    }

    async saveModelsToStorage() {
        const data = {};
        for (const key in this.models) {
            data[key] = {
                code: this.models[key].model.getValue(),
                originalCode: this.models[key].originalCode
            };

            const [orgId, system, fileId] = key.split(':');
            if (fileId && fileId !== 'default' && !fileId.startsWith('id_')) {
                const file = await fileManager.getFile(fileId);
                if (file) {
                    file.code = data[key].code;
                    file.originalCode = data[key].originalCode;
                    await db.put('Files', file);
                }
            }
        }
        await db.put('Config', { key: 'zide_models_data', value: data });
    }

    switchToModel(key, code = "") {
        const modelData = this.getOrCreateModel(key, code);
        this.editor.setModel(modelData.model);
        if (window.validateDelugeModel) window.validateDelugeModel(modelData.model);
        this.editor.focus();
    }

    setTheme(theme) {
        this.theme = theme;
        monaco.editor.setTheme(theme);
    }

    setFontSize(size) {
        this.fontSize = size;
        this.editor.updateOptions({ fontSize: size });
    }

    layout() {
        if (this.editor) this.editor.layout();
    }
}

export default CodeEditor;
