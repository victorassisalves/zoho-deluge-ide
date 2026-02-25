import { typeMethods } from '../data/type-methods.js';

export default {
    name: 'ZohoProvider',
    provide: async (model, position, context) => {
        const { lineUntilPos } = context;

        // 2. Zoho suggestions (handle zoho. and zoho.crm. etc)
        // Use a more robust regex to capture the full zoho chain
        const match = lineUntilPos.match(/\b(zoho(?:\.[a-zA-Z0-9_]*)*)\.?$/);

        if (match) {
            const chain = match[1];
            // If the line ends with ".", we want suggestions for the next part.
            // If it ends with characters, Monaco filters, but we need to provide the right context.

            // "zoho." -> chain="zoho", suggestions for zoho submodules
            // "zoho.crm." -> chain="zoho.crm", suggestions for crm methods
            // "zoho.c" -> chain="zoho.c", we still want zoho submodules but filtering handles it?

            // Actually, if we are at "zoho.", match is "zoho".
            // If we are at "zoho.crm.", match is "zoho.crm".

            // Wait, if I type "zoho.c", regex /zoho(?:\.[a-zA-Z0-9_]*)*/ matches "zoho.c"
            // If I type "zoho.", regex matches "zoho."? No, * allows 0.
            // But the dot?

            // Let's rely on trigger characters.
            // If triggered by dot, we look at what's before the dot.

            const dotIndex = lineUntilPos.lastIndexOf('.');
            if (dotIndex === -1) return []; // Should not happen if triggered by dot, but if manually triggered?

            // Check context before the last dot
            const preDot = lineUntilPos.substring(0, dotIndex);
            // We want to know if preDot ends with "zoho" or "zoho.crm" etc.

            if (preDot.endsWith('zoho')) {
                 // Context: zoho.|
                 return [
                    { label: 'crm', kind: 8, insertText: 'crm.' },
                    { label: 'books', kind: 8, insertText: 'books.' },
                    { label: 'creator', kind: 8, insertText: 'creator.' },
                    { label: 'recruit', kind: 8, insertText: 'recruit.' },
                    { label: 'currenttime', kind: 4, insertText: 'currenttime' },
                    { label: 'currentdate', kind: 4, insertText: 'currentdate' },
                    { label: 'adminuserid', kind: 4, insertText: 'adminuserid' },
                    ...(typeMethods.zoho ? typeMethods.zoho.map(m => ({ ...m, kind: 2 })) : [])
                 ].map(s => ({ ...s, insertTextRules: 4 }));
            }

            const zohoModuleMatch = preDot.match(/zoho\.([a-zA-Z0-9_]+)$/);
            if (zohoModuleMatch) {
                const module = zohoModuleMatch[1];
                const methods = typeMethods[module] || [];
                return methods.map(m => ({
                    ...m,
                    kind: 1, // Method
                    insertTextRules: 4
                }));
            }
        }
        return [];
    }
};
