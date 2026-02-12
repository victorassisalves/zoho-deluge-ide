export function extractVariables(code) {
    // Robustly remove comments while preserving strings
    const cleanCode = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, group1) => {
        if (group1) return group1;
        return "";
    });

    const vars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl']);

    // 0. Magic Comment Bindings
    const magicCommentRegex = /\/\/\s*@type\s+([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)/g;
    let match;
    // We scan original code for comments
    while ((match = magicCommentRegex.exec(code)) !== null) {
        vars.add(match[1]);
    }

    const keywords = new Set(['if', 'else', 'for', 'each', 'in', 'return', 'info', 'true', 'false', 'null', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'collection', 'zoho', 'thisapp', 'standalone', 'input', 'today', 'now', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

    // 1. Explicit Declarations: string name = "..."
    const declRegex = /\b(string|int|decimal|boolean|map|list)\s+([a-zA-Z_]\w*)/gi;
    while ((match = declRegex.exec(cleanCode)) !== null) {
        vars.add(match[2]);
    }

    // 2. Assignments: name = ...
    const assignRegex = /([a-zA-Z_]\w*)\s*=\s*([^;]+)/g;
    while ((match = assignRegex.exec(cleanCode)) !== null) {
        const name = match[1];
        if (!keywords.has(name)) {
            vars.add(name);
        }
    }

    // 3. Function params
    const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list)\s+[a-zA-Z_]\w*\s*\(([^)]*)\)/gi;
    while ((match = funcParamRegex.exec(cleanCode)) !== null) {
        const params = match[1].split(',');
        params.forEach(p => {
            const parts = p.trim().split(/\s+/);
            if (parts.length >= 2) {
                vars.add(parts[parts.length - 1].trim());
            } else if (parts.length === 1 && parts[0]) {
                vars.add(parts[0]);
            }
        });
    }

    // 4. Loops
    const forEachRegex = /for\s+each\s+([a-zA-Z_]\w*)\s+in/gi;
    while ((match = forEachRegex.exec(cleanCode)) !== null) {
        vars.add(match[1]);
    }

    return vars;
}
