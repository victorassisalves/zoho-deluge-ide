export function extractVariables(code) {
    // Robustly remove comments while preserving strings (to avoid strings with // breaking things)
    const cleanCode = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, group1) => {
        if (group1) return group1; // Keep the string
        return ""; // Remove the comment
    });

    const varMap = {
        'input': { type: 'Map' },
        'zoho': { type: 'Namespace' },
        'thisapp': { type: 'Namespace' },
        'standalone': { type: 'Namespace' },
        'today': { type: 'Date' },
        'now': { type: 'DateTime' },
        'payload': { type: 'Map' }
    };

    // 0. Interface Mappings
    if (window.interfaceMappings) {
        for (const name in window.interfaceMappings) {
            varMap[name] = { type: 'Map', mapping: name, path: [] };
        }
    }

    const keywords = new Set(['if', 'else', 'for', 'each', 'in', 'return', 'info', 'true', 'false', 'null', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'collection', 'zoho', 'thisapp', 'standalone', 'input', 'today', 'now', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

    // 1. Explicit Declarations: string name = "..."
    const declRegex = /\b(string|int|decimal|boolean|map|list)\s+([a-zA-Z_]\w*)/gi;
    let match;
    while ((match = declRegex.exec(cleanCode)) !== null) {
        varMap[match[2]] = { type: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() };
    }

    // 2. Assignments: name = ...
    const assignRegex = /([a-zA-Z_]\w*)\s*=\s*([^;]+)/g;
    while ((match = assignRegex.exec(cleanCode)) !== null) {
        const name = match[1];
        const val = match[2].trim();
        if (keywords.has(name)) continue;

        if (val.startsWith('"') || val.startsWith("'")) varMap[name] = { type: 'String' };
        else if (val.match(/^\d+$/)) varMap[name] = { type: 'Int' };
        else if (val.match(/^\d+\.\d+$/)) varMap[name] = { type: 'Decimal' };
        else if (val.toLowerCase().startsWith('map()')) varMap[name] = { type: 'Map' };
        else if (val.toLowerCase().startsWith('list()')) varMap[name] = { type: 'List' };
        else if (val.toLowerCase().startsWith('collection()')) varMap[name] = { type: 'List' };
        else if (val.toLowerCase().startsWith('invokeurl')) varMap[name] = { type: 'Map' };
        else if (val.startsWith('{')) {
            varMap[name] = { type: 'Map', isLiteral: true };
            // Basic literal key extraction for dynamic autocomplete
            const keysMatch = val.match(/['"]([^'"]+)['"]\s*:/g);
            if (keysMatch) {
                const literalMapping = {};
                keysMatch.forEach(k => {
                    const key = k.match(/['"]([^'"]+)['"]/)[1];
                    literalMapping[key] = "Object";
                });
                if (!window.interfaceMappings) window.interfaceMappings = {};
                const mappingName = `_literal_${name}`;
                window.interfaceMappings[mappingName] = literalMapping;
                varMap[name].mapping = mappingName;
                varMap[name].path = [];
            }
        }

        // Trace assignments from other variables: data = resp.get("data")
        const getMatch = val.match(/\b([a-zA-Z_]\w*)\s*((?:\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"][^'"]*['"]|\d+)\s*\))+)\s*$/);
        if (getMatch) {
            const sourceVar = getMatch[1];
            const pathStr = getMatch[2];
            const sourceInfo = varMap[sourceVar] || (window.interfaceMappings && window.interfaceMappings[sourceVar] ? { mapping: sourceVar, path: [] } : null);

            if (sourceInfo && (sourceInfo.mapping || (window.interfaceMappings && window.interfaceMappings[sourceVar]))) {
                const mappingName = sourceInfo.mapping || sourceVar;
                const newPath = [...(sourceInfo.path || [])];
                const pathParts = pathStr.match(/\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/g) || [];
                for (const part of pathParts) {
                    const keyMatch = part.match(/\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/);
                    if (keyMatch) {
                        const key = keyMatch[1] !== undefined ? keyMatch[1] : keyMatch[2];
                        newPath.push(key);
                    }
                }
                varMap[name] = { type: 'Map', mapping: mappingName, path: newPath };
            }
        } else if (varMap[val]) {
            // Direct assignment: v2 = v1
            varMap[name] = { ...varMap[val] };
        }
    }

    // 3. Function params
    const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list)\s+[a-zA-Z_]\w*\s*\(([^)]*)\)/gi;
    while ((match = funcParamRegex.exec(cleanCode)) !== null) {
        const params = match[1].split(',');
        params.forEach(p => {
            const parts = p.trim().split(/\s+/);
            if (parts.length >= 2) {
                const type = parts[0].trim();
                const name = parts[parts.length - 1].trim();
                varMap[name] = { type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() };
            } else if (parts.length === 1 && parts[0]) {
                varMap[parts[0]] = { type: 'Object' };
            }
        });
    }

    // 4. Loops
    const forEachRegex = /for\s+each\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)/gi;
    while ((match = forEachRegex.exec(cleanCode)) !== null) {
        varMap[match[1]] = { type: 'Object' };
    }

    // 5. Catch
    const catchRegex = /catch\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
    while ((match = catchRegex.exec(cleanCode)) !== null) {
        varMap[match[1]] = { type: 'Error' };
    }

    // 6. Heuristics from usage
    const methodUsageRegex = /([a-zA-Z_]\w*)\.(put|get|keys|remove|size|isEmpty|containsKey|containsValue|clear|add|addAll|sort|distinct)\(/g;
    while ((match = methodUsageRegex.exec(cleanCode)) !== null) {
        const name = match[1];
        const method = match[2];
        if (keywords.has(name) || (varMap[name] && varMap[name].type && varMap[name].type !== 'Object')) continue;

        if (['put', 'keys', 'containsKey', 'containsValue'].includes(method)) varMap[name] = { type: 'Map' };
        else if (['add', 'addAll', 'sort', 'distinct'].includes(method)) varMap[name] = { type: 'List' };
    }

    return varMap;
}

export function inferVarType(varName, code) {
    const vars = extractVariables(code);
    return vars[varName] ? vars[varName].type : null;
}
