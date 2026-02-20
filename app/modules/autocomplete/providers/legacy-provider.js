import { extractVariables, inferVarType } from '../../analysis.js';
import keywords from '../data/keywords.json' assert { type: 'json' };

const { staticSuggestions, typeMethods } = keywords;
const userMethods = {};

export const legacyProvider = {
    triggerCharacters: ['.', '"', "'", '/'],
    provideCompletionItems: (model, position) => {
        const lineUntilPos = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        const code = model.getValue();
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: model.getWordUntilPosition(position).startColumn,
            endColumn: position.column
        };

        // 1. Interface Manager Autocomplete (Auto-Trigger on Get or Dot)
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
                                kind: monaco.languages.CompletionItemKind.Property,
                                detail: (isComplex ? (Array.isArray(val) ? 'List' : 'Map') : typeof val) + " (Interface)",
                                insertText: isDot ? `${prefix}${method}("${key}")` : key,
                                sortText: '00' + key,
                                range: isDot ? {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: match.index + match[0].lastIndexOf('.') + 2,
                                    endColumn: position.column
                                } : range,
                                command: { id: 'editor.action.triggerSuggest', title: 'Re-trigger' }
                            });
                        });
                    }

                    // 2. Method Suggestions (Only if it's a dot trigger)
                    if (isDot) {
                        const methods = typeMethods[type] || [];
                        const common = typeMethods.common || [];
                        [...methods, ...common].forEach((m, index) => {
                            suggestions.push({
                                ...m,
                                kind: monaco.languages.CompletionItemKind.Method,
                                detail: m.doc + " (Method)",
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                sortText: '01' + (m.label === 'isNull()' || m.label === 'toString()' ? 'zzz' : String.fromCharCode(97 + index)),
                                range: {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: match.index + match[0].lastIndexOf('.') + 2,
                                    endColumn: position.column
                                }
                            });
                        });
                    }

                    if (suggestions.length > 0) {
                        return { suggestions };
                    }
                }
            }
        }

        // 2. Zoho suggestions (handle zoho. and zoho.crm. etc)
        if (lineUntilPos.match(/zoho\.[a-zA-Z0-9_.]*$/)) {
            const parts = lineUntilPos.split('.');
            const lastPart = parts[parts.length - 1];
            const isDirectZoho = parts.length === 2 && lastPart === '';

            let suggestions = [];
            if (isDirectZoho) {
                suggestions = [
                    { label: 'crm', kind: monaco.languages.CompletionItemKind.Module, insertText: 'crm.' },
                    { label: 'books', kind: monaco.languages.CompletionItemKind.Module, insertText: 'books.' },
                    { label: 'creator', kind: monaco.languages.CompletionItemKind.Module, insertText: 'creator.' },
                    { label: 'recruit', kind: monaco.languages.CompletionItemKind.Module, insertText: 'recruit.' },
                    { label: 'currenttime', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'currenttime' },
                    { label: 'currentdate', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'currentdate' },
                    { label: 'adminuserid', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'adminuserid' }
                ];
                suggestions = suggestions.concat(typeMethods.zoho.map(m => ({
                    ...m,
                    kind: monaco.languages.CompletionItemKind.Function
                })));
            } else {
                const namespace = parts[1];
                const methods = typeMethods[namespace] || [];
                suggestions = methods.map(m => ({
                    ...m,
                    kind: monaco.languages.CompletionItemKind.Method
                }));
            }

            if (suggestions.length > 0) {
                return {
                    suggestions: suggestions.map(s => ({
                        ...s,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range
                    }))
                };
            }
        }

        // 3. Method Suggestion after a dot (generic)
        const dotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
        if (dotMatch) {
            const varName = dotMatch[1];
            if (varName !== 'zoho') {
                const type = inferVarType(varName, code) || 'map';
                const methods = typeMethods[type.toLowerCase()] || typeMethods.map;
                const common = typeMethods.common || [];
                const user = userMethods[type.toLowerCase()] || [];

                return {
                    suggestions: [...methods, ...user, ...common].map((m, index) => ({
                        ...m,
                        kind: monaco.languages.CompletionItemKind.Method,
                        detail: m.doc,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        sortText: (m.label === 'isNull()' || m.label === 'toString()') ? 'zzz' : String.fromCharCode(97 + index)
                    }))
                };
            }
        }

        // 4. My Snippets (handle / trigger)
        const mySnippetMatch = lineUntilPos.match(/(?:^|\s)\/([a-zA-Z0-9_]*)$/);
        if (mySnippetMatch) {
            const triggerText = mySnippetMatch[1];
            const slashIndex = lineUntilPos.lastIndexOf('/' + triggerText);
            const textBeforeSlash = lineUntilPos.substring(0, slashIndex);

            const isComment = textBeforeSlash.includes('//') || textBeforeSlash.includes('/*');
            const isString = (textBeforeSlash.match(/"/g) || []).length % 2 !== 0 || (textBeforeSlash.match(/'/g) || []).length % 2 !== 0;

            if (!isComment && !isString) {
                const snippets = window.mySnippets || [];
                return {
                    suggestions: snippets.map(s => ({
                        label: '/' + s.trigger,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        detail: s.name + (s.comments ? ` - ${s.comments}` : ""),
                        documentation: { value: "```deluge\n" + s.code + "\n```" },
                        insertText: s.code,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: slashIndex + 1,
                            endColumn: position.column
                        }
                    }))
                };
            }
        }

        // 5. Default suggestions
        const varMap = extractVariables(code);
        const varSuggestions = Object.keys(varMap).map(v => ({
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: varMap[v].type + (varMap[v].mapping ? ` (Mapped: ${varMap[v].mapping})` : ""),
            insertText: v,
            range: range
        }));

        return {
            suggestions: [
                ...staticSuggestions.map(s => ({ ...s, range: range })),
                ...varSuggestions
            ]
        };
    }
};
