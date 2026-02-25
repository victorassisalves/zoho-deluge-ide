import { extractVariables } from '../../analysis.js';

export default {
    name: 'VariableProvider',
    provide: async (model, position, context) => {
        if (context.lineUntilPos.includes('.')) return [];
        const vars = extractVariables(context.code);
        // extractVariables now returns an object { varName: { type: ... }, ... }
        return Object.keys(vars).map(v => ({
            label: v,
            kind: 4, // Variable
            insertText: v,
            detail: vars[v].type || 'Object'
        }));
    }
};
