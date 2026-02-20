import { inferVarType } from '../analysis.js';
import keywords from '../autocomplete/data/keywords.json' assert { type: 'json' };

const { typeMethods } = keywords;

export const initHover = (monaco) => {
    monaco.languages.registerHoverProvider('deluge', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return;

            // Try to find method documentation
            for (const type in typeMethods) {
                const method = typeMethods[type].find(m => m.label.startsWith(word.word + '('));
                if (method && method.doc) {
                    return {
                        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                        contents: [
                            { value: `**${method.label}**` },
                            { value: method.doc }
                        ]
                    };
                }
            }

            const docs = {
                'Map': 'A key-value pair data structure. Use `Map()` to initialize.',
                'List': 'A collection of items. Use `List()` to initialize.',
                'put': 'Adds a key-value pair to a Map. Syntax: `map.put(key, value);`',
                'add': 'Adds an element to a List. Syntax: `list.add(value);`',
                'get': 'Retrieves an element from a List or Map.',
                'insert': 'Inserts a record into a Zoho Creator form.',
                'fetch': 'Queries records from a Zoho Creator form.',
                'zoho': 'Namespace for Zoho integration tasks (CRM, Books, etc.)',
                'crm': 'Zoho CRM integration namespace.',
                'books': 'Zoho Books integration namespace.',
                'info': 'Logs a message to the console for debugging.',
                'invokeurl': 'Performs an HTTP request (GET, POST, etc.) to an external API.'
            };

            const content = docs[word.word];
            if (content) {
                return {
                    range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                    contents: [
                        { value: `**${word.word}**` },
                        { value: content }
                    ]
                };
            }

            // Try to infer variable type
            const type = inferVarType(word.word, model.getValue());
            if (type) {
                return {
                    range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                    contents: [
                        { value: `Variable: **${word.word}**` },
                        { value: `Type: ${type}` }
                    ]
                };
            }

            return null;
        }
    });
};
