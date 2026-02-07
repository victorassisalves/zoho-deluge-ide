import re

file_path = 'deluge-lang.js'
with open(file_path, 'r') as f:
    content = f.read()

# Fix interface autocomplete logic
old_logic_pattern = r'// 1\. JSON Autocomplete[\s\S]*?if \(interfaceGetMatch \|\| interfaceDotMatch\) \{[\s\S]*?return \{ suggestions \};[\s\S]*?\}'

new_logic = """            // 1. JSON Autocomplete (if inside .get("") or .getJSON(""))
            const interfaceGetMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)(?:\\.get(?:JSON)?\\(.*?\\))*\\.get(?:JSON)?\\("([^"]*)$/);
            const interfaceDotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\\.$/);

            if (interfaceGetMatch || interfaceDotMatch) {
                const varName = (interfaceGetMatch || interfaceDotMatch)[1];
                const mappings = window.interfaceMappings || {};
                if (mappings[varName]) {
                    const obj = mappings[varName];
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
            }"""

# Use a more robust way to find the block
# Instead of a regex on the whole block, let's find the start and end indices
start_marker = "// 1. JSON Autocomplete"
end_marker = "return { suggestions };"

start_idx = content.find(start_marker)
if start_idx != -1:
    end_idx = content.find(end_marker, start_idx)
    if end_idx != -1:
        # Find the closing brace after the return
        brace_idx = content.find("}", end_idx)
        # Check if there is another closing brace for the outer if
        outer_brace_idx = content.find("}", brace_idx + 1)
        # We want to replace from start_idx to outer_brace_idx + 1
        content = content[:start_idx] + new_logic + content[outer_brace_idx + 1:]

with open(file_path, 'w') as f:
    f.write(content)
