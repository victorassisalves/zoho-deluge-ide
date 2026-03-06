const fs = require('fs');

let providerCode = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

const newProvideLogic = `
        let isCreatorContext = false;
        if (typeof window !== 'undefined' && window.currentContext) {
            if (window.currentContext.service === 'creator') {
                isCreatorContext = true;
            }
        }

        // Also allow testing if they manually map a creator_schema in Interface Manager
        if (typeof window !== 'undefined' && window.interfaceMappings) {
            const schemaKeys = Object.keys(window.interfaceMappings).filter(k => k.startsWith('creator_schema_') || k.startsWith('schema_creator_'));
            if (schemaKeys.length > 0) {
                isCreatorContext = true;
                const schemaKey = schemaKeys[0];
                if (schemaKey !== currentAppKey) {
                    const mappedSchema = window.interfaceMappings[schemaKey];
                    // Convert the simplified interface map format back to our expected forms structure
                    // E.g. Service: { Status: "[STRING]", Modified_User: "[STRING]" }
                    const forms = {};
                    for (const [formName, fields] of Object.entries(mappedSchema)) {
                        const formFields = {};
                        for (const [fieldName, fieldType] of Object.entries(fields)) {
                            formFields[fieldName] = {
                                type: typeof fieldType === 'string' ? fieldType.replace(/[\\[\\]"]/g, '') : 'STRING',
                                isMandatory: false,
                                isSystemField: false
                            };
                        }
                        forms[formName] = { displayName: formName, fields: formFields };
                    }
                    currentSchema = { forms };
                    currentAppKey = schemaKey;
                }
            }
        }

        if (!isCreatorContext) return [];

        if (typeof window !== 'undefined' && window.currentContext && window.currentContext.orgId && window.currentContext.service === 'creator') {
            const parts = window.currentContext.orgId.split('_');
            if (parts.length > 1) {
                const appKey = parts.slice(1).join('_');
                if (appKey !== currentAppKey) {
                    try {
                        const schema1 = await getSetting(\`schema_creator_\${appKey}\`);
                        const schema2 = await getSetting(\`creator_schema_\${appKey}\`);
                        const schema = schema1 || schema2;
                        if (schema) {
                            currentSchema = schema;
                            currentAppKey = appKey;
                            console.log(\`[CreatorProvider] Loaded schema from DB for: \${appKey}\`);
                        }
                    } catch (e) {
                        console.error('[CreatorProvider] Failed to load schema from settings', e);
                    }
                }
            }
        }
`;

providerCode = providerCode.replace(/let isCreatorContext[\s\S]*?(?=if \(!currentSchema \|\| !currentSchema\.forms\))/, newProvideLogic);
fs.writeFileSync('app/modules/products/creator/provider.js', providerCode);
console.log('Fixed provider.js again');
