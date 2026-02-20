import { extractVariables } from '../utils.js';

export default {
    name: 'InterfaceProvider',
    provide: async (model, position, context) => {
        const { lineUntilPos, code } = context;

        // 1. Interface Manager Autocomplete (Auto-Trigger on Get or Dot)
        // We use \b to ensure we match whole variable names
        const interfaceGetMatch = lineUntilPos.match(/\b([a-zA-Z_]\w*)\s*((?:\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"][^'"]*['"]|\d+)\s*\))*)\s*\.\s*get(?:JSON)?\s*\(\s*['"]([^'"]*)$/);
        const interfaceDotMatch = lineUntilPos.match(/\b([a-zA-Z_]\w*)\s*((?:\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"][^'"]*['"]|\d+)\s*\))*)\s*\.\s*([a-zA-Z_]\w*)?$/);

        if (interfaceGetMatch || interfaceDotMatch) {
            const isDot = !!interfaceDotMatch;
            const match = isDot ? interfaceDotMatch : interfaceGetMatch;
            const varName = match[1];
            const path = match[2];

            const varMap = extractVariables(code);
            const varInfo = varMap[varName];
            const mappings = window.interfaceMappings || {};

            let mappingName = (varInfo && typeof varInfo === 'object' && varInfo.mapping) ? varInfo.mapping : (mappings[varName] ? varName : null);
            let initialPath = (varInfo && typeof varInfo === 'object' && varInfo.path) ? varInfo.path : [];

            if (mappingName && mappings[mappingName]) {
                let currentObj = mappings[mappingName];
                for (const p of initialPath) {
                    if (currentObj) currentObj = currentObj[p];
                }
                const pathParts = path.match(/\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/g) || [];
                for (const part of pathParts) {
                    const keyMatch = part.match(/\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/);
                    if (keyMatch && currentObj && typeof currentObj === 'object') {
                        const key = keyMatch[1] !== undefined ? keyMatch[1] : keyMatch[2];
                        currentObj = currentObj[key];
                    }
                }

                if (currentObj && typeof currentObj === 'object') {
                    let suggestions = [];
                    let prefix = "";
                    let type = Array.isArray(currentObj) ? 'list' : 'map';

                    // 1. Key Suggestions
                    let objForKeys = null;
                    if (type === 'list') {
                        if (currentObj.length > 0 && typeof currentObj[0] === 'object' && currentObj[0] !== null) {
                            objForKeys = currentObj[0];
                            prefix = "get(0).";
                        }
                    } else {
                        objForKeys = currentObj;
                    }

                    if (objForKeys && typeof objForKeys === 'object' && !Array.isArray(objForKeys)) {
                        Object.keys(objForKeys).forEach(key => {
                            const val = objForKeys[key];
                            const isComplex = typeof val === 'object' && val !== null;
                            const method = isComplex ? 'getJSON' : 'get';

                            suggestions.push({
                                label: key,
                                kind: 9, // Property
                                detail: (isComplex ? (Array.isArray(val) ? 'List' : 'Map') : typeof val) + " (Interface)",
                                insertText: isDot ? `${prefix}${method}("${key}")` : key,
                                sortText: '00' + key,
                                command: { id: 'editor.action.triggerSuggest', title: 'Re-trigger' }
                            });
                        });
                    }
                    return suggestions;
                }
            }
        }
        return [];
    }
};
