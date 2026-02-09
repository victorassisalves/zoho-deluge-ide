import { typeMethods } from '../data/methods.js';
import { inferVarType } from '../utils.js';

export default {
    name: 'MethodProvider',
    provide: async (model, position, context) => {
        const dotMatch = context.lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
        if (!dotMatch) return [];

        const varName = dotMatch[1];
        const type = (inferVarType(varName, context.code) || 'map').toLowerCase();
        const methods = typeMethods[type] || typeMethods.map;

        return methods.map(m => ({
            label: m.label,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: m.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: context.range
        }));
    }
};
