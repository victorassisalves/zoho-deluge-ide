import re

file_path = 'deluge-lang.js'
with open(file_path, 'r') as f:
    content = f.read()

new_extract_vars = """    function extractVariables(code) {
        const vars = [];
        const seen = new Set(['if', 'for', 'else', 'return', 'try', 'catch', 'while', 'void', 'int', 'string', 'map', 'list', 'boolean', 'decimal', 'date', 'datetime']);
        const types = getVarTypes(code);

        // 1. Assignments: var = ...
        const assignmentRegex = /([a-zA-Z0-9_]+)\\s*=/g;
        let match;
        while ((match = assignmentRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: types.get(name) || null });
                seen.add(name);
            }
        }

        // 2. Catch blocks: catch(err)
        const catchRegex = /catch\\s*\\(\\s*([a-zA-Z0-9_]+)\\s*\\)/g;
        while ((match = catchRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: 'Map' });
                seen.add(name);
            }
        }

        // 3. For each: for each var in ...
        const forEachRegex = /for each\\s+([a-zA-Z0-9_]+)\\s+in/g;
        while ((match = forEachRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: 'Map' });
                seen.add(name);
            }
        }

        // 4. Function parameters: void test(int rec_id)
        const funcRegex = /([a-zA-Z0-9_]+)\\s*\\(([^)]*)\\)\\s*\\{/g;
        while ((match = funcRegex.exec(code)) !== null) {
            const args = match[2].split(',');
            args.forEach(arg => {
                const trimmed = arg.trim();
                if (!trimmed) return;
                const parts = trimmed.split(/\\s+/);
                const name = parts.length > 1 ? parts[parts.length - 1] : parts[0];
                if (name && !seen.has(name)) {
                    vars.push({ name: name, type: parts.length > 1 ? parts[0] : null });
                    seen.add(name);
                }
            });
        }

        return vars;
    }"""

# Escape backslashes for the regex replacement
safe_replacement = new_extract_vars.replace('\\', '\')

# Find the start and end of the function
pattern = r'function extractVariables\\(code\\) \\{[\\s\\S]*?return vars;\\s*\\}'
# Need to be careful with escaping here too
content = re.sub(r'function extractVariables\(code\) \{[\s\S]*?return vars;\s*\}', safe_replacement, content)

with open(file_path, 'w') as f:
    f.write(content)
