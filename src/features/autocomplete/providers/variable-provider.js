import { extractVariables } from '../utils.js';

export default {
    name: 'VariableProvider',
    provide: async (model, position, context) => {
        // Don't show variables after a dot
        if (context.lineUntilPos.includes('.')) return [];

        const vars = extractVariables(context.code);
        return Array.from(vars).map(v => ({
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: v,
            range: context.range
        }));
    }
};
