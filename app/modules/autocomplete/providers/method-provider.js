import { inferVarType } from '../../analysis.js';
import { typeMethods } from '../data/type-methods.js';

export default {
    name: 'MethodProvider',
    provide: async (model, position, context) => {
        const { lineUntilPos, code } = context;

        // 3. Method Suggestion after a dot (generic)
        const dotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
        if (dotMatch) {
            const varName = dotMatch[1];
            if (varName !== 'zoho') {
                const type = inferVarType(varName, code) || 'map';
                const methods = typeMethods[type.toLowerCase()] || typeMethods.map;
                const common = typeMethods.common || [];

                // Note: userMethods from legacy is not currently persisted/migrated, skipping for now

                const suggestions = [];
                [...methods, ...common].forEach((m, index) => {
                    suggestions.push({
                        label: m.label,
                        kind: 1, // Method
                        detail: m.doc + " (Method)",
                        insertText: m.insertText,
                        insertTextRules: 4, // InsertAsSnippet
                        sortText: '01' + (m.label === 'isNull()' || m.label === 'toString()' ? 'zzz' : String.fromCharCode(97 + index))
                    });
                });
                return suggestions;
            }
        }
        return [];
    }
};
