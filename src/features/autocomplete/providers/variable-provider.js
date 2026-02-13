import { extractVariables } from '../utils.js';
import editorWrapper from '../../../ui/EditorWrapper.js';

export default {
    name: 'VariableProvider',
    provide: async (model, position, context) => {
        // If the context line ends with '.', we skip because InterfaceProvider should handle it
        const lineUntilPos = context.lineUntilPos || '';
        if (lineUntilPos.trim().endsWith('.')) return [];

        // Extract variables from code
        const vars = extractVariables(context.code);

        // Map to completion items
        return Array.from(vars).map(v => {
            let detail = "Variable";
            let documentation = "Local variable";

            // Enrich with Type info if available
            if (editorWrapper.lsp && editorWrapper.lsp.typeScanner) {
                const type = editorWrapper.lsp.typeScanner.getType(v);
                if (type) {
                    detail = `Variable (${type})`;
                    documentation = `Type: ${type}`;
                }
            }

            return {
                label: v,
                kind: 4, // Variable
                detail: detail,
                documentation: documentation,
                insertText: v
            };
        });
    }
};
