export default {
    name: 'SnippetProvider',
    provide: async (model, position, context) => {
        const { lineUntilPos } = context;
        if (lineUntilPos.includes('.')) return []; // Snippets usually not triggered after dot

        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get('my_snippets', (result) => {
                    const snippets = result.my_snippets || [];
                    const suggestions = snippets.map(s => ({
                        label: '/' + s.trigger,
                        kind: 27, // Snippet
                        detail: s.name,
                        documentation: s.comments || s.code,
                        insertText: s.code,
                        insertTextRules: 4, // InsertAsSnippet
                        sortText: '00' + s.trigger // Prioritize snippets starting with /
                    }));

                    // Also add version without slash for searching
                    snippets.forEach(s => {
                        suggestions.push({
                            label: s.trigger,
                            kind: 27,
                            detail: s.name,
                            documentation: s.comments || s.code,
                            insertText: s.code,
                            insertTextRules: 4,
                            sortText: '01' + s.trigger
                        });
                    });

                    resolve(suggestions);
                });
            } else {
                resolve([]);
            }
        });
    }
};
