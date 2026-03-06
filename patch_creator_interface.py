import re

controller_file = "app/core/editor-controller.js"
with open(controller_file, "r") as f:
    content = f.read()

# Add logic to listen for METADATA_INTERCEPTED and process it
# Actually, we can add this logic when SCHEMA_CAPTURED is received or directly in the METADATA_INTERCEPTED listener.
# Let's find METADATA_INTERCEPTED
if "Bus.listen('METADATA_INTERCEPTED'" in content:
    # Inject Interface Manager integration right after Bus.send('SCHEMA_CAPTURED')
    interface_integration = """
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
                        updateInterfaceMappingsList();
                    }
                }
            }
"""

    # We need to replace `Bus.send('SCHEMA_CAPTURED', { schema: payload.schema, appKey: payload.appKey });` with the updated block
    content = content.replace("Bus.send('SCHEMA_CAPTURED', { schema: payload.schema, appKey: payload.appKey });", interface_integration.strip())

    # Also add logic to load it when mountCreatorSandbox is called from file switch
    load_integration = """
                        if (schemaRecord && schemaRecord.value) {
                            Bus.send('SCHEMA_CAPTURED', { schema: schemaRecord.value, appKey });

                            // Phase 7: Add to Interface Manager
                            const schemaObj = {};
                            if (schemaRecord.value.forms) {
                                Object.keys(schemaRecord.value.forms).forEach(formKey => {
                                    const formDef = schemaRecord.value.forms[formKey];
                                    const fieldsObj = {};
                                    if (formDef.fields) {
                                        Object.keys(formDef.fields).forEach(fieldKey => {
                                            const fieldDef = formDef.fields[fieldKey];
                                            fieldsObj[fieldDef.linkName || fieldKey] = `[${fieldDef.type}] ${fieldDef.isMandatory ? '(Mandatory)' : ''}`;
                                        });
                                    }
                                    schemaObj[formKey] = fieldsObj;
                                });

                                if (typeof window !== 'undefined') {
                                    if (!window.interfaceMappings) window.interfaceMappings = {};
                                    window.interfaceMappings[`creator_schema_${appKey}`] = schemaObj;
                                    if (typeof updateInterfaceMappingsList === 'function') {
                                        updateInterfaceMappingsList();
                                    }
                                }
                            }
                        }
"""

    content = content.replace("""
                        if (schemaRecord && schemaRecord.value) {
                            Bus.send('SCHEMA_CAPTURED', { schema: schemaRecord.value, appKey });
                        }
""", load_integration)

    with open(controller_file, "w") as f:
        f.write(content)
    print("Patched Editor Controller with Interface Manager integration for Creator")
else:
    print("Could not find METADATA_INTERCEPTED block")
