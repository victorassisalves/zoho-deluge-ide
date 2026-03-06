import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# I need to ensure that the file's metadata is updated to 'creator' when a creator payload is intercepted.
# Let's modify the METADATA_INTERCEPTED listener to update the currently active file (currentContextHash)
# if its product isn't already set, and mount it!
# The active file ID is stored in currentContextHash.

metadata_listener_patch = """
// --- Phase 7: Listen for Metadata Interceptions ---
Bus.listen('METADATA_INTERCEPTED', async (payload) => {
    if (!payload || !payload.product) return;

    console.log('[EditorController] Received intercepted metadata for:', payload.product);

    if (payload.product === 'creator' && payload.appKey && payload.schema) {
        // Save to KV Store (settings table)
        const schemaKey = `schema_creator_${payload.appKey}`;
        try {
            await db.settings.put({ key: schemaKey, value: payload.schema });
            console.log('[EditorController] Saved Creator schema to KV store:', schemaKey);

            // Broadcast so the active provider can update its internal cache
            Bus.send('SCHEMA_CAPTURED', { schema: payload.schema, appKey: payload.appKey });

            // --- Phase 7: Add to Interface Manager ---
            // Create a fake JSON object to visualize the schema
            if (payload.schema && payload.schema.forms) {
                const schemaObj = {};
                Object.keys(payload.schema.forms).forEach(formKey => {
                    const formDef = payload.schema.forms[formKey];
                    const fieldsObj = {};
                    if (formDef.fields) {
                        Object.keys(formDef.fields).forEach(fieldKey => {
                            const fieldDef = formDef.fields[fieldKey];
                            fieldsObj[fieldDef.linkName || fieldKey] = `[${fieldDef.type}] ${fieldDef.isMandatory ? '(Mandatory)' : ''}`;
                        });
                    }
                    schemaObj[formKey] = fieldsObj;
                });

                // Add to interfaceMappings
                if (typeof window !== 'undefined') {
                    if (!window.interfaceMappings) window.interfaceMappings = {};
                    window.interfaceMappings[`creator_schema_${payload.appKey}`] = schemaObj;
                    if (typeof updateInterfaceMappingsList === 'function') {
                        try { updateInterfaceMappingsList(); } catch (e) {}
                    }
                }
            }

            // UPDATE THE ACTIVE FILE'S METADATA to enable Autocomplete Sandbox dynamically!
            if (currentContextHash) {
                const activeFile = await db.files.get(currentContextHash);
                if (activeFile) {
                    if (!activeFile.metadata) activeFile.metadata = {};
                    let updated = false;
                    if (activeFile.metadata.product !== 'creator') {
                        activeFile.metadata.product = 'creator';
                        updated = true;
                    }
                    if (activeFile.metadata.appKey !== payload.appKey) {
                        activeFile.metadata.appKey = payload.appKey;
                        updated = true;
                    }
                    if (updated) {
                        await db.files.put(activeFile);
                        console.log('[EditorController] Updated active file metadata to creator');
                        // Remount the sandbox immediately
                        mountCreatorSandbox(activeFile);
                    }
                }
            }
        } catch (e) {
            console.error('[EditorController] Failed to save metadata to KV store:', e);
        }
    }
});
"""

content = re.sub(r"// --- Phase 7: Listen for Metadata Interceptions ---\nBus\.listen\('METADATA_INTERCEPTED', async \(payload\) => \{[\s\S]*?\}\);", metadata_listener_patch.strip(), content)

with open(controller_file, "w") as f:
    f.write(content)

print("Patched METADATA_INTERCEPTED logic to update currentContextHash")
