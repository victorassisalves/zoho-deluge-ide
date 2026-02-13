import diagnostics from '../../services/diagnostics.js';

class TypeScanner {
    constructor() {
        this.cache = new WeakMap();
        this.debouncers = new WeakMap();
    }

    /**
     * Attaches the scanner to an editor instance to listen for changes.
     * @param {Object} editor - monaco.editor.IStandaloneCodeEditor
     */
    attach(editor) {
        if (!editor) return;

        const model = editor.getModel();
        if (model) {
            this.scan(model);
        }

        editor.onDidChangeModelContent(() => {
            const currentModel = editor.getModel();
            if (currentModel) {
                this.scan(currentModel);
            }
        });

        // Also listen for model changes (tabs switching)
        editor.onDidChangeModel(() => {
            const currentModel = editor.getModel();
            if (currentModel) {
                this.scan(currentModel);
            }
        });
    }

    /**
     * Scans the model for @type annotations.
     * @param {Object} model - monaco.editor.ITextModel
     */
    scan(model) {
        if (!model) return;

        // Debounce logic
        if (this.debouncers.has(model)) {
            clearTimeout(this.debouncers.get(model));
        }

        const timeout = setTimeout(() => {
            this._doScan(model);
            this.debouncers.delete(model);
        }, 200);

        this.debouncers.set(model, timeout);
    }

    _doScan(model) {
        try {
            const code = model.getValue();
            const map = new Map();
            // Regex for // @type variableName : InterfaceName
            const regex = /\/\/\s*@type\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)/g;
            let match;

            while ((match = regex.exec(code)) !== null) {
                const varName = match[1];
                const interfaceName = match[2];
                map.set(varName, interfaceName);
            }

            this.cache.set(model, map);
            // diagnostics.report('TypeScanner', `Scanned ${map.size} typed variables.`);
        } catch (e) {
            console.error('TypeScanner scan error', e);
        }
    }

    /**
     * Gets the interface name for a variable from the cache.
     * @param {Object} model
     * @param {string} varName
     * @returns {string|null}
     */
    getInterfaceName(model, varName) {
        if (!this.cache.has(model)) {
            // Force immediate scan if no cache exists (e.g. first load)
            this._doScan(model);
        }
        const map = this.cache.get(model);
        return map ? map.get(varName) : null;
    }
}

export default new TypeScanner();
