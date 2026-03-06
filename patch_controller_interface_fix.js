const fs = require('fs');

let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// The `interfaceMappings` global variable is used to maintain state.
// When the SCHEMA_CAPTURED event fires, we need to update `interfaceMappings`, `window.interfaceMappings`,
// call `saveCurrentMappings()`, and call `updateInterfaceMappingsList()`.

const fixCode = `
                            const interfaceName = \`creator_schema_\${appKey}\`;

                            // 1. Update Dexie files
                            variables[interfaceName] = interfaceSchema;
                            await db.files.update(file.id, { variables, isDirty: 1 });

                            // 2. Update Interface Manager globals directly
                            if (typeof interfaceMappings !== 'undefined') {
                                interfaceMappings[interfaceName] = interfaceSchema;
                                window.interfaceMappings = interfaceMappings;

                                // Save and render if the UI functions are available
                                if (typeof saveCurrentMappings === 'function') {
                                    saveCurrentMappings();
                                }
                                if (typeof updateInterfaceMappingsList === 'function') {
                                    updateInterfaceMappingsList();
                                }
                            }

                            Logger.info('controller', \`Added \${interfaceName} to Interface Manager\`);
`;

code = code.replace(/const interfaceName = \`creator_schema_\${appKey}\`;\s*variables\[interfaceName\] = interfaceSchema;\s*await db\.files\.update\(file\.id, \{ variables, isDirty: 1 \}\);\s*Logger\.info\('controller', \`Added \${interfaceName} to Interface Manager\`\);\s*\/\/ Emit event to update UI\s*Bus\.send\('INTERFACE_VARS_UPDATED', variables\);/, fixCode);

fs.writeFileSync('app/core/editor-controller.js', code);
console.log("Patched interface logic to update state directly");
