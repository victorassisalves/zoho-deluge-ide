/**
 * Autocomplete Utilities
 */

export function inferVarType(varName, code) {
    const mapRegex = new RegExp(varName + "\\s*=\\s*Map\\(\\)", "i");
    if (mapRegex.test(code)) return "Map";
    const listRegex = new RegExp(varName + "\\s*=\\s*List\\(\\)", "i");
    if (listRegex.test(code)) return "List";

    // Basic heuristics for zoho variables
    if (varName.toLowerCase().includes('response')) return "Map";
    if (varName.toLowerCase().includes('list')) return "List";

    return null;
}

export function extractVariables(code) {
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

    return vars;
}
