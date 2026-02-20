import { extractVariables } from '../utils.js';

export default {
    name: 'VariableProvider',
    provide: async (model, position, context) => {
        if (context.lineUntilPos.includes('.')) return [];
        const vars = extractVariables(context.code);
        return Array.from(vars).map(v => ({
            label: v,
            kind: 4, // Variable
            insertText: v
        }));
    }
};
