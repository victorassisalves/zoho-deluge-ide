import sys
import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

new_provider = r"""        monaco.languages.registerCompletionItemProvider('deluge', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordAtPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word ? word.startColumn : position.column,
                    endColumn: word ? word.endColumn : position.column
                };

                const lineUntilPos = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                const code = model.getValue();

                // 1. JSON Autocomplete (if inside .get("") or .getJSON(""))
                const interfaceGetMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)((?:\.get(?:JSON)?\(.*?\))*)\.get(?:JSON)?\("([^"]*)$/);
                const interfaceDotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);

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
                                if (methods) {
                                    methods.forEach(m => {
                                        suggestions.push({
                                            ...m,
                                            kind: monaco.languages.CompletionItemKind.Method,
                                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                            range: range
                                        });
                                    });
                                }
                            }
                            return { suggestions };
                        }
                    }
                }

                const suggestions = [
                    ...staticSuggestions.map(s => ({
                        ...s,
                        range: range
                    }))
                ];

                return { suggestions };
            }
        });"""

# Find the start of the provider and the end of it
start_marker = "monaco.languages.registerCompletionItemProvider('deluge', {"
# We need to find the closing }); of the provider
# Since it's been replaced multiple times, I'll use a regex that matches until the next top-level block
pattern = re.compile(r"monaco\.languages\.registerCompletionItemProvider\('deluge', \{.*?\n\s+\}\);", re.DOTALL)

content = pattern.sub(lambda _: new_provider, content)

with open('deluge-lang.js', 'w') as f:
    f.write(content)
