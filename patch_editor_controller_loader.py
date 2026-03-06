import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# Insert the CreatorSandbox mounting logic after loading the file from Dexie.
# Looking for `const file = await db.files.get(currentContextHash);`
sandbox_logic = """
            // --- Phase 7: Mount Creator Sandbox ---
            if (file.metadata && file.metadata.product === 'creator') {
                mountCreatorSandbox(file);

                // Attempt to load schema from settings
                let appKey = file.metadata.appKey || (file.metadata.workspaceId && file.metadata.workspaceId.replace('app_', ''));
                if (appKey) {
                    try {
                        const schemaRecord = await db.settings.get(`schema_creator_${appKey}`);
                        if (schemaRecord && schemaRecord.value) {
                            Bus.send('SCHEMA_CAPTURED', { schema: schemaRecord.value, appKey });
                        }
                    } catch (e) {
                        console.error('[EditorController] Failed to load schema from KV:', e);
                    }
                }
            } else {
                mountCreatorSandbox(null); // Ensure it's unmounted for other products
            }
"""

if "mountCreatorSandbox(file)" not in content:
    # Find the right place to inject
    target = "if (explorer) explorer.setActiveFile(currentContextHash);"
    if target in content:
        content = content.replace(target, target + "\n" + sandbox_logic)
        with open(controller_file, "w") as f:
            f.write(content)
        print("Patched editor-controller.js with Sandbox Mount Logic")
    else:
        print("Target string not found for mounting sandbox.")
else:
    print("Already patched with mount logic.")
