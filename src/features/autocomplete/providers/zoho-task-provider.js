import { typeMethods } from '../data/methods.js';

export default {
    name: 'ZohoTaskProvider',
    provide: async (model, position, context) => {
        if (!context.lineUntilPos.endsWith('zoho.')) return [];

        return typeMethods.zoho.map(m => ({
            label: m.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: m.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: context.range
        }));
    }
};
