import { staticSuggestions } from '../data/keywords.js';

export default {
    name: 'KeywordProvider',
    provide: async (model, position, context) => {
        if (context.lineUntilPos.includes('.')) return [];

        return staticSuggestions.map(s => ({
            label: s.label,
            kind: s.kind,
            insertText: s.insertText,
            insertTextRules: s.isSnippet ? 4 : undefined
        }));
    }
};
