import store from "../core/store.js";
import fileManager from "../services/FileManager.js";
import { DelugeLsp } from "../features/DelugeLsp.js";

class EditorWrapper {
    constructor() {
        this.editor = null;
        this.lsp = null;
        this.configureMonacoWorkers();
        this.init();
    }

    configureMonacoWorkers() {
        window.MonacoEnvironment = {
            getWorker: function (moduleId, label) {
                // The base path relative to the extension root
                const basePath = 'assets/monaco-editor/min/vs/assets/';

                let workerFilename = 'editor.worker-Be8ye1pW.js'; // Default

                if (label === 'json') {
                    workerFilename = 'json.worker-DKiEKt88.js';
                } else if (label === 'css' || label === 'scss' || label === 'less') {
                    workerFilename = 'css.worker-HnVq6Ewq.js';
                } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    workerFilename = 'html.worker-B51mlPHg.js';
                } else if (label === 'typescript' || label === 'javascript') {
                    workerFilename = 'ts.worker-CMbG-7ft.js';
                }

                // Return a physical Worker pointing to the file
                return new Worker(chrome.runtime.getURL(basePath + workerFilename));
            }
        };
    }

    init() {
        if (typeof monaco !== "undefined") {
            this.initMonaco();
        } else {
            // Wait for monaco
            const check = setInterval(() => {
                if (typeof monaco !== "undefined") {
                    clearInterval(check);
                    this.initMonaco();
                }
            }, 100);
        }

        window.addEventListener("resize", () => { if (this.editor) this.editor.layout(); });
        window.addEventListener("editor-font-change", (e) => {
            if (this.editor) this.editor.updateOptions({ fontSize: e.detail.fontSize });
        });
    }

    initMonaco() {
        const container = document.getElementById("editor-container");
        if (!container) return;

        monaco.editor.defineTheme("dracula", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "comment", foreground: "6272a4" },
                { token: "keyword", foreground: "ff79c6" },
                { token: "number", foreground: "bd93f9" },
                { token: "string", foreground: "f1fa8c" },
                { token: "delimiter", foreground: "f8f8f2" },
                { token: "operator", foreground: "ff79c6" },
                { token: "identifier", foreground: "f8f8f2" },
                { token: "type", foreground: "8be9fd", fontStyle: "italic" },
                { token: "function", foreground: "50fa7b" },
                { token: "method", foreground: "50fa7b" },
                { token: "variable", foreground: "ffb86c" },
                { token: "key", foreground: "8be9fd" },
                { token: "brackets", foreground: "f8f8f2" }
            ],
            colors: {
                "editor.background": "#282a36",
                "editor.foreground": "#f8f8f2",
                "editorCursor.foreground": "#f8f8f2",
                "editor.lineHighlightBackground": "#44475a",
                "editorLineNumber.foreground": "#6272a4",
                "editor.selectionBackground": "#44475a",
                "editorIndentGuide.background": "#44475a",
                "editorIndentGuide.activeBackground": "#6272a4"
            }
        });

        this.editor = monaco.editor.create(container, {
            value: "// Start coding in Zoho Deluge...\n\n",
            language: "deluge",
            theme: "dracula",
            automaticLayout: true,
            wordBasedSuggestions: false,
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
            glyphMargin: true
        });

        // Initialize LSP
        this.lsp = new DelugeLsp(this.editor);
        this.lsp.start();

        // Global Access for Legacy
        window.editor = this.editor;

        // Shortcuts
        this.editor.addAction({
            id: "zide-save-local",
            label: "Save Locally",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => { window.dispatchEvent(new Event("trigger-save-local")); }
        });

        this.editor.addAction({
            id: "zide-push-zoho",
            label: "Push to Zoho",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
            run: () => { window.dispatchEvent(new Event("trigger-push-zoho")); }
        });

        this.editor.addAction({
            id: "zide-push-execute-zoho",
            label: "Push and Execute",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
            run: () => { window.dispatchEvent(new Event("trigger-push-execute-zoho")); }
        });

        this.editor.addAction({
            id: "zide-pull-zoho",
            label: "Pull from Zoho",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP],
            run: () => { window.dispatchEvent(new Event("trigger-pull-zoho")); }
        });

        // Load initial settings
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.get(["theme", "font_size"], (res) => {
                if (res.theme) monaco.editor.setTheme(res.theme);
                if (res.font_size) this.editor.updateOptions({ fontSize: parseInt(res.font_size) });
            });
        }
    }

    setValue(code) {
        if (this.editor) this.editor.setValue(code);
    }

    getValue() {
        return this.editor ? this.editor.getValue() : "";
    }
}

export default new EditorWrapper();
