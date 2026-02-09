import registry from './registry.js';
import logger from '../../utils/logger.js';

export const setupAutocomplete = (monaco) => {
    monaco.languages.registerCompletionItemProvider('deluge', {
        triggerCharacters: ['.', '"', ':'],
        provideCompletionItems: async (model, position) => {
            const lineUntilPos = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const context = {
                lineUntilPos: lineUntilPos,
                word: word,
                range: range,
                code: model.getValue()
            };

            try {
                const suggestions = await registry.getSuggestions(model, position, context);
                return {
                    suggestions: suggestions.map(s => ({
                        label: s.label,
                        kind: s.kind,
                        insertText: s.insertText,
                        insertTextRules: s.insertTextRules,
                        range: s.range || range
                    }))
                };
            } catch (err) {
                return { suggestions: [] };
            }
        }
    });
};
