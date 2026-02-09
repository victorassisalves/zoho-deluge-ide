import sys

file_path = "deluge-lang.js"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add extractVariables helper function
extract_vars_func = """    function extractVariables(code) {
        const vars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl']);

        // Extract parameters from function signatures
        const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list)\s+[a-zA-Z_]\w*\s*\(([^)]*)\)/gi;
        let pMatch;
        while ((pMatch = funcParamRegex.exec(code)) !== null) {
            const params = pMatch[1].split(',');
            params.forEach(p => {
                const parts = p.trim().split(/\s+/);
                if (parts.length > 0) {
                    const paramName = parts[parts.length - 1].trim();
                    if (paramName) vars.add(paramName);
                }
            });
        }

        // Extract variables from catch blocks
        const catchRegex = /catch\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
        while ((pMatch = catchRegex.exec(code)) !== null) {
            vars.add(pMatch[1]);
        }

        // Extract from assignments
        const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
        let match;
        while ((match = assignmentRegex.exec(code)) !== null) {
            vars.add(match[1]);
        }

        // Extract from for each loops
        const forEachRegex = /for\s+each\s+([a-zA-Z0-9_]+)\s+in/gi;
        while ((match = forEachRegex.exec(code)) !== null) {
            vars.add(match[1]);
        }

        // Extract from for loops
        const forRegex = /for\s+([a-zA-Z0-9_]+)\s+in/gi;
        while ((match = forRegex.exec(code)) !== null) {
            vars.add(match[1]);
        }

        return vars;
    }

"""

# Insert before inferVarType
content = content.replace("function inferVarType", extract_vars_func + "    function inferVarType")

# 2. Update validateModel to use extractVariables
# Find where definedVars is initialized and matches are extracted
start_replace = "// 1. Collect defined variables"
end_replace = "const mandatoryParams ="
# We need to find the actual code between these markers in the current content
# It looks like:
#             const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl']);
#
#             // Extract parameters from function signatures
#             ...
#             while ((match = forRegex.exec(code)) !== null) {
#                 definedVars.add(match[1]);
#             }

import re
pattern = re.compile(r"// 1\. Collect defined variables.*?const definedVars = new Set\(.*?\);.*?while.*?\}\s+(?=const mandatoryParams =)", re.DOTALL)
content = pattern.sub("// 1. Collect defined variables\n            const definedVars = extractVariables(code);\n\n            ", content)

# 3. Update provideCompletionItems to include extracted variables
# Find the default suggestions block
old_default_return = """                // Default suggestions
                return {
                    suggestions: staticSuggestions.map(s => ({
                        ...s,
                        range: range
                    }))
                };"""

new_default_return = """                // Default suggestions
                const vars = extractVariables(code);
                const varSuggestions = Array.from(vars).map(v => ({
                    label: v,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: v,
                    range: range
                }));

                return {
                    suggestions: [
                        ...staticSuggestions.map(s => ({ ...s, range: range })),
                        ...varSuggestions
                    ]
                };"""

content = content.replace(old_default_return, new_default_return)

with open(file_path, "w") as f:
    f.write(content)
