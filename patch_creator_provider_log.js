const fs = require('fs');
let code = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

// The issue might also be that I am missing a console log to see if it even reaches the suggestions.
// If `typeof window !== 'undefined' && window.interfaceMappings` doesn't contain `creator_schema_draken_portal`,
// it's because InterfaceManager.js doesn't populate `window.interfaceMappings`?
// Yes it does: `app/services/InterfaceManager.js` sets `window.interfaceMappings = mapping`.

// Let's make sure the suggestions are returned correctly.
// A common issue: `insertText` needs to be valid. `kind: 7` is valid.
// Let's add logging or ensure the fallback is working perfectly.

const fallbackLogic = `
        // Also allow testing if they manually map a creator_schema in Interface Manager
        if (typeof window !== 'undefined' && window.interfaceMappings) {
            const schemaKeys = Object.keys(window.interfaceMappings).filter(k => k.startsWith('creator_schema_') || k.startsWith('schema_creator_'));
            if (schemaKeys.length > 0) {
                isCreatorContext = true;
                const schemaKey = schemaKeys[0];
                if (schemaKey !== currentAppKey || !currentSchema) {
                    const mappedSchema = window.interfaceMappings[schemaKey];
                    // Convert the simplified interface map format back to our expected forms structure
                    // E.g. Service: { Status: "[STRING]", Modified_User: "[STRING]" }
                    const forms = {};
                    for (const [formName, fields] of Object.entries(mappedSchema)) {
                        const formFields = {};
                        if (typeof fields === 'object' && fields !== null) {
                            for (const [fieldName, fieldType] of Object.entries(fields)) {
                                formFields[fieldName] = {
                                    type: typeof fieldType === 'string' ? fieldType.replace(/[\\[\\]"]/g, '') : 'STRING',
                                    isMandatory: false,
                                    isSystemField: false
                                };
                            }
                        }
                        forms[formName] = { displayName: formName, fields: formFields };
                    }
                    currentSchema = { forms };
                    currentAppKey = schemaKey;
                }
            }
        }
`;

code = code.replace(/\/\/ Also allow testing if they manually map a creator_schema in Interface Manager[\s\S]*?(?=if \(!isCreatorContext\))/, fallbackLogic);
fs.writeFileSync('app/modules/products/creator/provider.js', code);
console.log('Fixed interface mapping fallback parsing');
