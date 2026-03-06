# The backup `app/core/editor-controller.js.bak` actually already has the syntax correct.
# And it already has the Interface Manager mapping inside METADATA_INTERCEPTED!
# Let's just add the `update active file metadata to creator` block before the `} catch` carefully.
import re

with open('app/core/editor-controller.js', 'r') as f:
    content = f.read()

# Replace `updateInterfaceMappingsList();` with `try { updateInterfaceMappingsList(); } catch (e) {}`
content = content.replace("updateInterfaceMappingsList();\n                    }", "try { updateInterfaceMappingsList(); } catch (e) {}\n                    }")

# Add the active file metadata update
update_active_file = """            }

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
                        mountCreatorSandbox(activeFile);
                    }
                }
            }
        } catch"""

content = content.replace("            }\n        } catch", update_active_file)

with open('app/core/editor-controller.js', 'w') as f:
    f.write(content)
