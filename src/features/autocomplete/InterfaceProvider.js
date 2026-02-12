import typeScanner from '../type-system/TypeScanner.js';
import interfaceManager from '../../services/InterfaceManager.js';
import { typeMethods } from '../../core/StdLib.js';
import store from '../../core/store.js';

export default {
    name: 'InterfaceProvider',

    provide: async (model, position, context) => {
        const lineUntilPos = context.lineUntilPos || model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        // Trigger only on dot
        if (!lineUntilPos.trim().endsWith('.')) return [];

        // 1. Parse path: varName.prop1.prop2.
        // Match a chain of identifiers separated by dots, ending with a dot.
        // We want the last full chain.
        const match = lineUntilPos.match(/([a-zA-Z0-9_]+(?:(?:\.[a-zA-Z0-9_]+)*))\.(\s*)$/);
        if (!match) return [];

        const fullPath = match[1];
        const parts = fullPath.split('.');
        const rootVar = parts[0];
        const path = parts.slice(1);

        // 2. Resolve Root Interface
        let interfaceName = typeScanner.getInterfaceName(model, rootVar);

        // Check for Global/Standard roots if not typed
        if (!interfaceName) {
            if (rootVar === 'zoho') interfaceName = 'zoho';
            else if (rootVar === 'input') interfaceName = 'input';
        }

        if (!interfaceName) return [];

        // 3. Resolve Interface Structure
        let currentStructure = null;

        // Special handling for 'zoho' namespace structure
        if (interfaceName === 'zoho') {
             currentStructure = {
                 crm: "crm",
                 books: "books",
                 creator: "creator",
                 recruit: "recruit",
                 adminuserid: "string",
                 currentdate: "date",
                 currenttime: "datetime"
             };
        } else {
            const fileId = store.get('activeCloudFileId');
            const resolved = await interfaceManager.resolveInterface(interfaceName, fileId);

            if (resolved) {
                if (resolved.type === 'json') {
                    currentStructure = resolved.data;
                } else if (resolved.type === 'standard') {
                    // If path is empty, return methods.
                    if (path.length === 0) {
                        return resolved.data.map(m => ({
                            label: m.label,
                            kind: 1, // Method
                            insertText: m.insertText,
                            detail: m.doc,
                            insertTextRules: 4
                        }));
                    }
                    return [];
                }
            }
        }

        if (!currentStructure) return [];

        // 4. Traverse Path
        for (const part of path) {
            if (currentStructure && typeof currentStructure === 'object') {
                currentStructure = currentStructure[part];
            } else {
                return [];
            }
        }

        // 5. Generate Suggestions based on current structure
        if (!currentStructure) return [];

        // If it's a string, it might be a type reference (e.g. "crm", "string", "date")
        if (typeof currentStructure === 'string') {
             const typeName = currentStructure;
             // Check direct match in typeMethods
             if (typeMethods[typeName]) {
                 return typeMethods[typeName].map(m => ({
                     label: m.label,
                     kind: 1, // Method
                     insertText: m.insertText,
                     detail: m.doc,
                     insertTextRules: 4
                 }));
             }
             // Check lowercase match (e.g. 'String' -> 'string')
             if (typeMethods[typeName.toLowerCase()]) {
                 return typeMethods[typeName.toLowerCase()].map(m => ({
                     label: m.label,
                     kind: 1, // Method
                     insertText: m.insertText,
                     detail: m.doc,
                     insertTextRules: 4
                 }));
             }
             return [];
        }

        // If it's an object (JSON), return keys
        if (typeof currentStructure === 'object') {
            return Object.keys(currentStructure).map(key => {
                const val = currentStructure[key];
                const isObj = typeof val === 'object' && val !== null;
                const isArray = Array.isArray(val);
                return {
                    label: key,
                    kind: 9, // Property
                    detail: isArray ? 'List' : (isObj ? 'Map' : (typeof val === 'string' ? val : 'Value')),
                    insertText: key
                };
            });
        }

        return [];
    }
};
