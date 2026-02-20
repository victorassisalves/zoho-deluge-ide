import staticSuggestions from '../data/keywords.json' with { type: 'json' };

export default {
    name: 'KeywordProvider',
    provide: async (model, position, context) => {
        if (context.lineUntilPos.includes('.')) return [];

        return staticSuggestions.map(s => ({
            label: s.label,
            kind: s.kind,
            insertText: s.insertText,
            insertTextRules: s.insertTextRules
        }));
    }
};
