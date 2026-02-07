import re

file_path = 'deluge-lang.js'
with open(file_path, 'r') as f:
    content = f.read()

# Helper function to insert into the JS
helper_func = """    function getNestedObject(root, path) {
        if (!path) return root;
        const parts = path.match(/\\.get(?:JSON)?\\(([^)]+)\\)/g);
        if (!parts) return root;
        let current = root;
        for (const part of parts) {
            const keyMatch = part.match(/\\(([^)]+)\\)/);
            if (keyMatch) {
                let key = keyMatch[1].trim();
                if (key.startsWith('"') || key.startsWith("'")) {
                    key = key.substring(1, key.length - 1);
                } else if (!isNaN(key)) {
                    key = parseInt(key);
                }
                if (current && typeof current === 'object') {
                    current = current[key];
                } else {
                    return null;
                }
            }
        }
        return current;
    }

"""

# Insert the helper function before extractVariables
content = content.replace("function extractVariables", helper_func + "    function extractVariables")

# Update the interface autocomplete logic
new_logic = """            // 1. JSON Autocomplete (if inside .get("") or .getJSON(""))
            const interfaceGetMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)((?:\\.get(?:JSON)?\\(.*?\\))*)\\.get(?:JSON)?\\("([^"]*)$/);
            const interfaceDotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\\.$/);

            if (interfaceGetMatch || interfaceDotMatch) {
                const varName = (interfaceGetMatch || interfaceDotMatch)[1];
                const path = interfaceGetMatch ? interfaceGetMatch[2] : "";
                const mappings = window.interfaceMappings || {};
                if (mappings[varName]) {
                    const rootObj = mappings[varName];
                    const obj = getNestedObject(rootObj, path);
                    if (obj && typeof obj === 'object') {
                        const keys = Object.keys(obj);
                        const suggestions = keys.map(key => {
                            const val = obj[key];
                            const isObject = typeof val === 'object' && val !== null;
                            const kind = isObject ? monaco.languages.CompletionItemKind.Module : monaco.languages.CompletionItemKind.Property;

                            return {
                                label: key,
                                kind: kind,
                                detail: `Key from ${varName} (${typeof val})`,
                                insertText: interfaceDotMatch ? `get("${key}")` : key,
                                range: range,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                            };
                        });

                        if (interfaceDotMatch) {
                            const type = inferVarType(varName, code) || 'Map';
                            const methods = typeMethods[type.toLowerCase()] || typeMethods.map;
                            methods.forEach(m => {
                                suggestions.push({
                                    ...m,
                                    kind: monaco.languages.CompletionItemKind.Method,
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    range: range
                                });
                            });
                        }

                        return { suggestions };
                    }
                }
            }"""

# Replace the old logic
start_marker = "// 1. JSON Autocomplete"
end_marker = "return { suggestions };"
start_idx = content.find(start_marker)
if start_idx != -1:
    end_idx = content.find(end_marker, start_idx)
    if end_idx != -1:
        # Find closing braces
        brace_idx = content.find("}", end_idx)
        outer_brace_idx = content.find("}", brace_idx + 1)
        content = content[:start_idx] + new_logic + content[outer_brace_idx + 1:]

with open(file_path, 'w') as f:
    f.write(content)
