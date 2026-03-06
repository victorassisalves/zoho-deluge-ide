with open("app/core/editor-controller.js", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "// --- Phase 7: Listen for Metadata Interceptions ---" in line:
        skip = True

        # Insert our correct listener
        new_lines.append("// --- Phase 7: Listen for Metadata Interceptions ---\n")
        new_lines.append("Bus.listen('METADATA_INTERCEPTED', async (payload) => {\n")
        new_lines.append("    if (!payload || !payload.product) return;\n")
        new_lines.append("    \n")
        new_lines.append("    console.log('[EditorController] Received intercepted metadata for:', payload.product);\n")
        new_lines.append("    \n")
        new_lines.append("    if (payload.product === 'creator' && payload.appKey && payload.schema) {\n")
        new_lines.append("        // Save to KV Store (settings table)\n")
        new_lines.append("        const schemaKey = `schema_creator_${payload.appKey}`;\n")
        new_lines.append("        try {\n")
        new_lines.append("            await db.settings.put({ key: schemaKey, value: payload.schema });\n")
        new_lines.append("            console.log('[EditorController] Saved Creator schema to KV store:', schemaKey);\n")
        new_lines.append("            \n")
        new_lines.append("            // Broadcast so the active provider can update its internal cache\n")
        new_lines.append("            Bus.send('SCHEMA_CAPTURED', { schema: payload.schema, appKey: payload.appKey });\n")
        new_lines.append("            \n")
        new_lines.append("            // --- Phase 7: Add to Interface Manager ---\n")
        new_lines.append("            // Create a fake JSON object to visualize the schema\n")
        new_lines.append("            if (payload.schema && payload.schema.forms) {\n")
        new_lines.append("                const schemaObj = {};\n")
        new_lines.append("                Object.keys(payload.schema.forms).forEach(formKey => {\n")
        new_lines.append("                    const formDef = payload.schema.forms[formKey];\n")
        new_lines.append("                    const fieldsObj = {};\n")
        new_lines.append("                    if (formDef.fields) {\n")
        new_lines.append("                        Object.keys(formDef.fields).forEach(fieldKey => {\n")
        new_lines.append("                            const fieldDef = formDef.fields[fieldKey];\n")
        new_lines.append("                            fieldsObj[fieldDef.linkName || fieldKey] = `[${fieldDef.type}] ${fieldDef.isMandatory ? '(Mandatory)' : ''}`;\n")
        new_lines.append("                        });\n")
        new_lines.append("                    }\n")
        new_lines.append("                    schemaObj[formKey] = fieldsObj;\n")
        new_lines.append("                });\n")
        new_lines.append("                \n")
        new_lines.append("                // Add to interfaceMappings\n")
        new_lines.append("                if (typeof window !== 'undefined') {\n")
        new_lines.append("                    if (!window.interfaceMappings) window.interfaceMappings = {};\n")
        new_lines.append("                    window.interfaceMappings[`creator_schema_${payload.appKey}`] = schemaObj;\n")
        new_lines.append("                    if (typeof updateInterfaceMappingsList === 'function') {\n")
        new_lines.append("                        try { updateInterfaceMappingsList(); } catch (e) {}\n")
        new_lines.append("                    }\n")
        new_lines.append("                }\n")
        new_lines.append("            }\n")
        new_lines.append("            \n")
        new_lines.append("            // UPDATE THE ACTIVE FILE'S METADATA to enable Autocomplete Sandbox dynamically!\n")
        new_lines.append("            if (currentContextHash) {\n")
        new_lines.append("                const activeFile = await db.files.get(currentContextHash);\n")
        new_lines.append("                if (activeFile) {\n")
        new_lines.append("                    if (!activeFile.metadata) activeFile.metadata = {};\n")
        new_lines.append("                    let updated = false;\n")
        new_lines.append("                    if (activeFile.metadata.product !== 'creator') {\n")
        new_lines.append("                        activeFile.metadata.product = 'creator';\n")
        new_lines.append("                        updated = true;\n")
        new_lines.append("                    }\n")
        new_lines.append("                    if (activeFile.metadata.appKey !== payload.appKey) {\n")
        new_lines.append("                        activeFile.metadata.appKey = payload.appKey;\n")
        new_lines.append("                        updated = true;\n")
        new_lines.append("                    }\n")
        new_lines.append("                    if (updated) {\n")
        new_lines.append("                        await db.files.put(activeFile);\n")
        new_lines.append("                        console.log('[EditorController] Updated active file metadata to creator');\n")
        new_lines.append("                        // Remount the sandbox immediately\n")
        new_lines.append("                        mountCreatorSandbox(activeFile);\n")
        new_lines.append("                    }\n")
        new_lines.append("                }\n")
        new_lines.append("            }\n")
        new_lines.append("        } catch (e) {\n")
        new_lines.append("            console.error('[EditorController] Failed to save metadata to KV store:', e);\n")
        new_lines.append("        }\n")
        new_lines.append("    }\n")
        new_lines.append("});\n")

    elif skip and "});" in line and not "if" in line and not "{" in line:
        skip = False # Found the end of the previous Bus.listen block
        continue
    elif skip:
        continue
    else:
        new_lines.append(line)

with open("app/core/editor-controller.js", "w") as f:
    f.writelines(new_lines)
print("Safely patched controller.")
