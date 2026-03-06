import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# Add logic to listen for METADATA_INTERCEPTED and process it
# It uses Bus.listen and saves to db.settings.

metadata_listener_code = """
import { mountCreatorSandbox } from '../modules/products/creator/registry.js';

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
        } catch (e) {
            console.error('[EditorController] Failed to save metadata to KV store:', e);
        }
    }
});
"""

# We need to inject this. Let's find where Bus.listen('editor:init') or similar is called.
if "METADATA_INTERCEPTED" not in content:
    # Append the import at the top
    content = "import { mountCreatorSandbox } from '../modules/products/creator/registry.js';\n" + content

    # Let's find the Bus.listen block or just append to the file
    if "Bus.listen(" in content:
        # Just append the listener block near the end of the file
        content += "\n" + metadata_listener_code.replace("import { mountCreatorSandbox } from '../modules/products/creator/registry.js';\n", "")
    with open(controller_file, "w") as f:
        f.write(content)
    print("Patched editor-controller.js with METADATA_INTERCEPTED listener")
else:
    print("Already patched editor-controller.js with listener")

# Also, when a file is opened, we should trigger mountCreatorSandbox(file).
# Usually this is in `loadWorkspaceTab` or `switchTab` or when setting the active model.
