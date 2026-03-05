const keywords = new Set(['if', 'else', 'for', 'each', 'in', 'return', 'info', 'true', 'false', 'null', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'collection', 'zoho', 'thisapp', 'standalone', 'input', 'today', 'now', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

function extractVariables(code) {
    const cleanCode = code.replace(/("(?:[^"\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, group1) => {
        if (group1) return group1;
        return "";
    });

    const varMap = {};

    const assignRegex = /([a-zA-Z_]\w*)\s*=\s*([^;]+)/g;
    let match;
    while ((match = assignRegex.exec(cleanCode)) !== null) {
        const name = match[1];
        const val = match[2].trim();
        if (keywords.has(name)) continue;
        varMap[name] = { type: 'Assigned' };
    }
    return varMap;
}

const code = `void test(int quote_id)
{
    variable_1 = zoho.crm.getRecordById("Quotes", quote_id).get(0);
    info variable_1;
}`;

console.log(extractVariables(code));
