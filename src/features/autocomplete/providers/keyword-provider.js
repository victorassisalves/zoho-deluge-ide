import { staticSuggestions } from '../data/keywords.js';

export default {
    name: 'KeywordProvider',
    provide: async (model, position, context) => {
        // Only show keywords if we are not after a dot
        if (context.lineUntilPos.match(/[a-zA-Z0-9_]\.$/)) {
            return [];
        }

        return staticSuggestions.map(s => ({
            label: s.label,
            kind: monaco.languages.CompletionItemKind[s.kind] || monaco.languages.CompletionItemKind.Keyword,
            insertText: s.insertText,
            insertTextRules: s.isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
            range: context.range
        }));
    }
};
