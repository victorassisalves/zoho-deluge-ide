import { Bus } from '../../../core/bus.js';
import { getSetting } from '../../../services/db.js';

let currentSchema = null;
let currentAppKey = null;

Bus.listen('SCHEMA_UPDATED', (payload) => {
    if (payload && payload.type === 'creator') {
        if (payload.schema) {
            currentSchema = payload.schema;
            currentAppKey = payload.appKey;
            console.log(`[CreatorProvider] Schema cache dynamically updated for app: ${currentAppKey}`);
        }
    }
});

let variableCache = {};
let lastCodeHash = '';

const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
};

const inferVariableForms = (code) => {
    const currentHash = hashString(code);
    if (currentHash === lastCodeHash) return variableCache;

    const cache = {};
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

    // Match fetch: myRecord = Service_Order[ID == 1];
    const fetchRegex = /([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\s*\[.*?\]/g;
    let match;
    while ((match = fetchRegex.exec(cleanCode)) !== null) {
        const varName = match[1];
        const formName = match[2];
        cache[varName] = { type: 'Record', form: formName };
    }

    variableCache = cache;
    lastCodeHash = currentHash;
    return cache;
};

export default {
    name: 'CreatorProvider',
    init: async () => {},
    provide: async (model, position, context) => {
        // We need to fetch the initial schema on load if it exists
        // STRICT ISOLATION: Check if we are in a creator context
        if (typeof window !== 'undefined' && window.currentContext) {
            if (window.currentContext.service !== 'creator') return [];

            // Try to deduce app name from orgId (e.g., account_appName)
            if (window.currentContext.orgId) {
                const parts = window.currentContext.orgId.split('_');
                if (parts.length > 1) {
                    const appKey = parts.slice(1).join('_');
                    if (appKey !== currentAppKey) {
                        try {
                            const schema = await getSetting(`schema_creator_${appKey}`);
                            if (schema) {
                                currentSchema = schema;
                                currentAppKey = appKey;
                                console.log(`[CreatorProvider] Loaded schema from DB for: ${appKey}`);
                            }
                        } catch (e) {
                            console.error('[CreatorProvider] Failed to load schema from settings', e);
                        }
                    }
                }
            }
        }

        if (!currentSchema || !currentSchema.forms) return [];

        const { lineUntilPos } = context;
        let match;

        // 1. Form Autocomplete: `insert into |` or `delete from |`
        const formMatch = lineUntilPos.match(/(insert\s+into|delete\s+from)\s+([a-zA-Z0-9_]*)$/i);
        if (formMatch) {
            const suggestions = [];
            for (const [formKey, formData] of Object.entries(currentSchema.forms)) {
                suggestions.push({
                    label: formKey,
                    kind: 7, // Class/Form
                    insertText: formKey,
                    detail: `Form: ${formData.displayName}`,
                    sortText: `0_${formKey}`
                });
            }
            return suggestions;
        }

        // 2. Record Fetch Form Autocomplete: `var = |[`
        const assignMatch = lineUntilPos.match(/^[ \t]*[a-zA-Z_]\w*\s*=\s*([a-zA-Z0-9_]*)$/);
        if (assignMatch && !lineUntilPos.includes('.')) {
             const suggestions = [];
             for (const [formKey, formData] of Object.entries(currentSchema.forms)) {
                suggestions.push({
                    label: formKey,
                    kind: 7,
                    insertText: formKey,
                    detail: `Form: ${formData.displayName}`,
                    sortText: `0_${formKey}`
                });
            }
            return suggestions;
        }

        // 3. Dot Notation (Record Fields): `myRecord.|`
        const dotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/);
        if (dotMatch) {
            const varName = dotMatch[1];

            // Scan code to map varName to Form
            const code = model.getValue();
            const vars = inferVariableForms(code);
            const varInfo = vars[varName];

            if (varInfo && varInfo.type === 'Record' && varInfo.form) {
                const formData = currentSchema.forms[varInfo.form];
                if (formData && formData.fields) {
                    const suggestions = [];
                    for (const [fieldKey, fieldData] of Object.entries(formData.fields)) {

                        // 3-Tier Sort Logic
                        let sortPrefix = "1_"; // Custom Field
                        if (fieldData.isMandatory) sortPrefix = "0_"; // Mandatory Field
                        else if (fieldData.isSystemField) sortPrefix = "9_"; // System Field

                        suggestions.push({
                            label: fieldKey,
                            kind: 10, // Property
                            insertText: fieldKey,
                            detail: `${fieldData.type}${fieldData.isMandatory ? ' (Mandatory)' : ''}`,
                            documentation: fieldData.isSystemField ? 'System Field' : 'Custom Field',
                            sortText: `${sortPrefix}${fieldKey}`
                        });
                    }
                    return suggestions;
                }
            }
        }

        return [];
    }
};
