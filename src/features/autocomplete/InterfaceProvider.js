import store from '../../core/store.js';
import interfaceManager from '../../services/InterfaceManager.js';

class InterfaceProvider {
    constructor(typeScanner) {
        this.typeScanner = typeScanner;
    }

    async provideCompletionItems(model, position) {
        // Trigger logic: Check if previous character is '.'
        const lineContent = model.getLineContent(position.lineNumber);
        const textUntilPosition = lineContent.substring(0, position.column - 1);

        // Only trigger if line ends with '.'
        if (!textUntilPosition.endsWith('.')) {
            return { suggestions: [] };
        }

        // Regex to find the variable name before the dot.
        // Captures "myVar" from "myVar."
        // Also supports simple chaining for the last part if needed, but per plan we extract the word.
        const match = textUntilPosition.match(/([a-zA-Z0-9_]+)\.$/);
        if (!match) return { suggestions: [] };

        const varName = match[1];

        // 1. Get Type from Scanner
        let typeName = this.typeScanner.getType(varName);

        // Fallback: If no explicit type, check if the variable name itself is a global interface (e.g. 'zoho')
        if (!typeName) {
            typeName = varName;
        }

        if (!typeName) return { suggestions: [] };

        // 2. Resolve Interface
        const fileId = store.get('activeCloudFileId');
        const structure = await interfaceManager.resolveInterface(typeName, fileId);

        if (!structure) return { suggestions: [] };

        // 3. Flatten keys and return suggestions
        const suggestions = this.flattenStructure(structure);

        return {
            suggestions: suggestions.map(key => ({
                label: key,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: key,
                documentation: `Property of ${typeName}`
            }))
        };
    }

    flattenStructure(obj, prefix = '') {
        let keys = [];
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Determine if this key has children we should flatten
                const val = obj[key];

                // Add the current key (e.g. "email" or "address")
                keys.push(prefix + key);

                // If it's a nested object (and not an array or null), recurse
                // Note: In StdLib, leaf nodes are strings ("Map", "List"). In Custom Interfaces, they might be types too.
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    keys = keys.concat(this.flattenStructure(val, prefix + key + '.'));
                }
            }
        }
        return keys;
    }
}

export default InterfaceProvider;
