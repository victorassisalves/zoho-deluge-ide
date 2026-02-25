export default {
    name: 'SnippetProvider',
    provide: async (model, position, context) => {
        const { lineUntilPos, range } = context;
        if (lineUntilPos.includes('.')) return []; // Snippets usually not triggered after dot

        // Check if triggered by slash to include it in replacement range
        const startColumn = range.startColumn;
        const lineContent = model.getLineContent(position.lineNumber);
        const charBefore = startColumn > 1 ? lineContent[startColumn - 2] : null;

        let targetRange = range;
        if (charBefore === '/') {
             targetRange = {
                 startLineNumber: range.startLineNumber,
                 startColumn: startColumn - 1,
                 endLineNumber: range.endLineNumber,
                 endColumn: range.endColumn
             };
        }

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
                        range: targetRange,
                        filterText: '/' + s.trigger + ' ' + s.trigger, // Allow matching with or without slash
                        sortText: '00' + s.trigger
                    }));

                    resolve(suggestions);
                });
            } else {
                resolve([]);
            }
        });
    }
};
