// src/features/type-system/TypeScanner.js

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

class TypeScanner {
    constructor() {
        this.editor = null;
        this.symbolTable = new Map();

        // Bind scan method to this instance
        this.scan = this.scan.bind(this);

        // Create debounced version
        this.debouncedScan = debounce(this.scan, 200);
    }

    attach(editor) {
        this.editor = editor;
        if (!this.editor) return;

        // Initial scan
        this.scan();

        // Listen for content changes
        this.editor.onDidChangeModelContent(() => {
            this.debouncedScan();
        });

        // Listen for model switches (e.g. tabs)
        this.editor.onDidChangeModel(() => {
            this.scan(); // Immediate scan on tab switch
        });
    }

    scan() {
        if (!this.editor) return;
        const model = this.editor.getModel();
        if (!model) return;

        const text = model.getValue();
        const newSymbols = new Map();

        // Regex: // @type varName : InterfaceName
        // Captures: group 1 = varName, group 2 = InterfaceName
        const regex = /\/\/\s*@type\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)/g;

        let match;
        while ((match = regex.exec(text)) !== null) {
            const varName = match[1];
            const interfaceName = match[2];
            newSymbols.set(varName, interfaceName);
        }

        this.symbolTable = newSymbols;
    }

    getType(variableName) {
        return this.symbolTable.get(variableName);
    }
}

export default TypeScanner;
