import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

# 1. Remove 'while' from keywords
content = content.replace("'if|else|for|each|in|return|info|true|false|null|break|continue|while|try|catch|finally|throw|void|string|int|decimal|boolean|map|list'",
                          "'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list'")

# 2. Update identifiers and keywords root
root_part = """                    // Functions
                    [/[a-zA-Z_][\w]*\s*(?=\()/, 'function'],"""
root_replacement = """                    // Functions
                    [/[a-zA-Z_][\w]*\s*(?=\()/, 'function'],

                    // Map Keys
                    [/[a-zA-Z_]\w*(?=\s*:)/, 'key'],

                    // Constants (UPPERCASE)
                    [/[A-Z][A-Z_0-9]*/, 'identifier'],"""
content = content.replace(root_part, root_replacement)

# 3. Add invokeurl to cases and change @default to variable
cases_part = "'zoho|thisapp|standalone|input': 'type',\n                            '@default': 'identifier'"
cases_replacement = "'zoho|thisapp|standalone|input': 'type', 'invokeurl': 'identifier', '@default': 'variable'"
# Try different indentation/newlines if not matching
if cases_part not in content:
    cases_part = "'zoho|thisapp|standalone|input': 'type',\n                        '@default': 'identifier'"
content = content.replace(cases_part, cases_replacement)

# 4. Remove 'while' and add 'invokeurl' to skipKeywords
skip_kw_part = "const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'while', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info'];"
skip_kw_replacement = "const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl'];"
content = content.replace(skip_kw_part, skip_kw_replacement)

# 5. Enhance variable extraction
extraction_part = """            // 1. Collect defined variables
            const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now']);"""
extraction_replacement = """            // 1. Collect defined variables
            const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl']);

            // Extract parameters from function signatures
            const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list)\\s+[a-zA-Z_]\\w*\\s*\\(([^)]*)\\)/gi;
            let pMatch;
            while ((pMatch = funcParamRegex.exec(code)) !== null) {
                const params = pMatch[1].split(',');
                params.forEach(p => {
                    const parts = p.trim().split(/\\s+/);
                    if (parts.length > 0) {
                        const paramName = parts[parts.length - 1].trim();
                        if (paramName) definedVars.add(paramName);
                    }
                });
            }

            // Extract variables from catch blocks
            const catchRegex = /catch\\s*\\(\\s*([a-zA-Z_]\\w*)\\s*\\)/gi;
            while ((pMatch = catchRegex.exec(code)) !== null) {
                definedVars.add(pMatch[1]);
            }"""
content = content.replace(extraction_part, extraction_replacement)

# 6. Update Undefined variable check
undefined_part = """                    const index = line.indexOf(word);
                    const charAfter = line[index + word.length];
                    if (charAfter === '(' || charAfter === '.') return;"""
undefined_replacement = """                    const index = line.indexOf(word);
                    const restOfLine = line.substring(index + word.length).trim();
                    if (restOfLine.startsWith('(') || restOfLine.startsWith('.') || restOfLine.startsWith(':')) return;"""
content = content.replace(undefined_part, undefined_replacement)

with open('deluge-lang.js', 'w') as f:
    f.write(content)
