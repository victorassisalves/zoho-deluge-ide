const fs = require('fs');

let providerCode = fs.readFileSync('app/modules/products/creator/provider.js', 'utf8');

// The issue might be that currentContext.service !== 'creator' when testing in a standalone tab!
// We should check if we have the schema loaded, or if the current workspace is creator.

const newProvideLogic = `
        // Check if we are in a creator context OR we have a schema loaded explicitly
        let isCreatorContext = (typeof window !== 'undefined' && window.currentContext && window.currentContext.service === 'creator');

        if (!isCreatorContext) {
            // Check if there's a mapped variable that looks like a creator schema for testing
            if (typeof window !== 'undefined' && window.interfaceMappings) {
                const schemaKey = Object.keys(window.interfaceMappings).find(k => k.startsWith('creator_schema_') || k.startsWith('schema_creator_'));
                if (schemaKey) {
                    isCreatorContext = true;
                    if (!currentSchema) {
                        // Mock the schema from the interface mapping for testing
                        const mappedSchema = window.interfaceMappings[schemaKey];
                        const mockSchema = { forms: {} };
                        for (const [formName, fields] of Object.entries(mappedSchema)) {
                            mockSchema.forms[formName] = { displayName: formName, fields: {} };
                            for (const [fieldName, fieldType] of Object.entries(fields)) {
                                mockSchema.forms[formName].fields[fieldName] = {
                                    type: typeof fieldType === 'string' ? fieldType.replace(/[\\[\\]"]/g, '') : 'STRING',
                                    isMandatory: false,
                                    isSystemField: false
                                };
                            }
                        }
                        currentSchema = mockSchema;
                        currentAppKey = schemaKey;
                    }
                }
            }
        }

        if (!isCreatorContext) return [];

        if (typeof window !== 'undefined' && window.currentContext && window.currentContext.orgId) {
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

providerCode = providerCode.replace(/\/\/ STRICT ISOLATION: Check if we are in a creator context[\s\S]*?(?=if \(!currentSchema \|\| !currentSchema\.forms\))/, newProvideLogic);
fs.writeFileSync('app/modules/products/creator/provider.js', providerCode);
console.log('Patched provider.js to support testing in generic contexts with mapped schemas');
