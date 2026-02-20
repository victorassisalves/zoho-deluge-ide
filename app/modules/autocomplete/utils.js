export function extractVariables(code) {
    const vars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl']);
    if (!code) return vars;
    const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
    let match;
    while ((match = assignmentRegex.exec(code)) !== null) {
        vars.add(match[1]);
    }
    return vars;
}
