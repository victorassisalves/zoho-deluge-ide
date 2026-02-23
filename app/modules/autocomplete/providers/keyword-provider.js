let staticSuggestions = [];

export default {
    name: 'KeywordProvider',
    init: async () => {
        try {
            const url = chrome.runtime.getURL('app/modules/autocomplete/data/keywords.json');
            const response = await fetch(url);
            staticSuggestions = await response.json();
        } catch (e) {
            console.error('Failed to load keywords.json', e);
        }
    },
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
