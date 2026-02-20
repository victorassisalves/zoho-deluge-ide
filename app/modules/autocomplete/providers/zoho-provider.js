import { typeMethods } from '../data/type-methods.js';

export default {
    name: 'ZohoProvider',
    provide: async (model, position, context) => {
        const { lineUntilPos } = context;

        // 2. Zoho suggestions (handle zoho. and zoho.crm. etc)
        if (lineUntilPos.match(/zoho\.[a-zA-Z0-9_.]*$/)) {
            const parts = lineUntilPos.split('.');
            const lastPart = parts[parts.length - 1];
            const isDirectZoho = parts.length === 2 && lastPart === '';

            let suggestions = [];
            if (isDirectZoho) {
                // Sub-namespaces
                suggestions = [
                    { label: 'crm', kind: 8, insertText: 'crm.' }, // Module
                    { label: 'books', kind: 8, insertText: 'books.' },
                    { label: 'creator', kind: 8, insertText: 'creator.' },
                    { label: 'recruit', kind: 8, insertText: 'recruit.' },
                    { label: 'currenttime', kind: 4, insertText: 'currenttime' }, // Variable
                    { label: 'currentdate', kind: 4, insertText: 'currentdate' },
                    { label: 'adminuserid', kind: 4, insertText: 'adminuserid' }
                ];
                // Add legacy methods too
                if (typeMethods.zoho) {
                    suggestions = suggestions.concat(typeMethods.zoho.map(m => ({
                        ...m,
                        kind: 2 // Function
                    })));
                }
            } else {
                const namespace = parts[1];
                const methods = typeMethods[namespace] || [];
                suggestions = methods.map(m => ({
                    ...m,
                    kind: 1 // Method
                }));
            }

            if (suggestions.length > 0) {
                return suggestions.map(s => ({
                    ...s,
                    insertTextRules: 4 // InsertAsSnippet
                }));
            }
        }
        return [];
    }
};
