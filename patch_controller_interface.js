const fs = require('fs');

let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

const hookCode = `
// --- Metadata Interception (Phase 7) ---
Bus.listen('SCHEMA_CAPTURED', async (payload) => {
    try {
        if (!payload || !payload.type || !payload.payload) return;

        Logger.info('controller', \`Received SCHEMA_CAPTURED for \${payload.type}\`);

        if (payload.type === 'creator' && currentContext && currentContext.orgId) {
            const apps = payload.payload.apps;
            if (apps) {
                const appKey = Object.keys(apps)[0];
                if (appKey) {
                    const settingsKey = \`schema_creator_\${appKey}\`;
                    await setSetting(settingsKey, apps[appKey]);
                    Logger.success('controller', \`Saved Creator Schema for app: \${appKey}\`);

                    // Automatically add to Interface Manager for visibility
                    if (window.activeCloudFileId) {
                        const file = await db.files.get(window.activeCloudFileId);
                        if (file) {
                            const variables = file.variables || {};
                            // Format it for Interface Manager (flat Map-style structure)
                            const interfaceSchema = {};
                            const rawForms = apps[appKey].forms || {};

                            for (const [formName, formData] of Object.entries(rawForms)) {
                                const fields = formData.fields || {};
                                const interfaceFields = {};
                                for (const [fieldName, fieldData] of Object.entries(fields)) {
                                    interfaceFields[fieldName] = \`[\${fieldData.type}]\`;
                                }
                                interfaceSchema[formName] = interfaceFields;
                            }

                            const interfaceName = \`creator_schema_\${appKey}\`;
                            variables[interfaceName] = interfaceSchema;

                            await db.files.update(file.id, { variables, isDirty: 1 });
                            Logger.info('controller', \`Added \${interfaceName} to Interface Manager\`);

                            // Emit event to update UI
                            Bus.send('INTERFACE_VARS_UPDATED', variables);
                        }
                    }

                    // Re-broadcast so CreatorProvider updates immediately
                    Bus.send('SCHEMA_UPDATED', { type: 'creator', appKey: appKey, schema: apps[appKey] });
                }
            }
        }
    } catch (e) {
        Logger.error('controller', 'Failed to save intercepted schema: ' + e.message);
    }
});
`;

// Replace the previous hook
code = code.replace(/\/\/ --- Metadata Interception \(Phase 7\) ---[\s\S]*?(?=async function initEditor\(\) {)/, hookCode + "\n");
fs.writeFileSync('app/core/editor-controller.js', code);
console.log("Patched editor-controller.js with Interface Manager integration");
