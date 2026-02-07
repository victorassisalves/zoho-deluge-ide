/**
 * Deluge Language Definition for Monaco Editor
 */

let delugeRegistered = false;

function registerDelugeLanguage() {
    if (delugeRegistered) return;
    delugeRegistered = true;

    monaco.languages.register({ id: 'deluge' });

    monaco.languages.setLanguageConfiguration("deluge", {
        comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"]
        },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"]
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: "\"", close: "\"" },
            { open: "'", close: "'" }
        ],
        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: "\"", close: "\"" },
            { open: "'", close: "'" }
        ]
    });

    monaco.languages.setMonarchTokensProvider('deluge', {
        defaultToken: '',
        tokenPostfix: '.deluge',
        keywords: [
            'if', 'else', 'for', 'in', 'return', 'info', 'debug', 'while', 'break', 'continue',
            'try', 'catch', 'Map', 'List', 'zoho', 'invokeurl', 'insert', 'update', 'delete'
        ],
        operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
            '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
            '%=', '<<=', '>>=', '>>>='
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        tokenizer: {
            root: [
                // Functions (identifier followed by open paren)
                [/[a-z_$][\w$]*(?=\s*\()/, 'function'],

                // Methods (dot followed by identifier)
                [/\.[a-z_$][\w$]*/, 'method'],

                // Keywords and Variables
                [/[a-z_$][\w$]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@default': 'variable'
                    }
                }],
                { include: '@whitespace' },
                [/[{}()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],
                [/[;,.]/, 'delimiter'],
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }]
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],
            string_single: [
                [/[^\\']+/, 'string'],
                [/\\./, 'string.escape.invalid'],
                [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],
            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment']
            ],
            comment: [
                [/[^\/*]+/, 'comment'],
                [/\/\*/, 'comment', '@push'],
                [/\*\/ /, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ]
        }
    });

    // 1. Completion Provider
    monaco.languages.registerCompletionItemProvider('deluge', {
        triggerCharacters: ['.', '(', '"'],
        provideCompletionItems: (model, position) => {
            const lineUntilPos = model.getValueInRange({
                startLineNumber: position.lineNumber, startColumn: 1,
                endLineNumber: position.lineNumber, endColumn: position.column
            });
            const code = model.getValue();
            const range = {
                startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                startColumn: position.column, endColumn: position.column
            };

            const staticSuggestions = [
                { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
                { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
                { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info ' },
                { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\n[\n\turl: "$1"\n\ttype: ${2|GET,POST,PUT,DELETE|}\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
            ];

            const typeMethods = {
                string: [
                    { label: 'length()', insertText: 'length()' },
                    { label: 'subString(start, end)', insertText: 'subString(${1:start}, ${2:end})' },
                    { label: 'toLowerCase()', insertText: 'toLowerCase()' },
                    { label: 'toUpperCase()', insertText: 'toUpperCase()' },
                    { label: 'trim()', insertText: 'trim()' },
                    { label: 'toList(sep)', insertText: 'toList("${1:,}")' }
                ],
                list: [
                    { label: 'add(val)', insertText: 'add(${1:val})' },
                    { label: 'get(index)', insertText: 'get(${1:index})' },
                    { label: 'size()', insertText: 'size()' },
                    { label: 'contains(val)', insertText: 'contains(${1:val})' },
                    { label: 'isEmpty()', insertText: 'isEmpty()' }
                ],
                map: [
                    { label: 'put(key, val)', insertText: 'put("${1:key}", ${2:val})' },
                    { label: 'get(key)', insertText: 'get("${1:key}")' },
                    { label: 'getJSON(key)', insertText: 'getJSON("${1:key}")' },
                    { label: 'keys()', insertText: 'keys()' },
                    { label: 'remove(key)', insertText: 'remove("${1:key}")' }
                ],
                zoho: [
                    { label: 'zoho.crm.getRecordById(module, id)', insertText: 'zoho.crm.getRecordById("${1:Leads}", ${2:id})' },
                    { label: 'zoho.crm.updateRecord(module, id, map)', insertText: 'zoho.crm.updateRecord("${1:Leads}", ${2:id}, ${3:dataMap})' },
                    { label: 'zoho.crm.createRecord(module, map)', insertText: 'zoho.crm.createRecord("${1:Leads}", ${2:dataMap})' },
                    { label: 'zoho.crm.searchRecords(module, criteria)', insertText: 'zoho.crm.searchRecords("${1:Leads}", "(${2:Email} == '${3:test@example.com}')")' },
                    { label: 'zoho.books.getRecords(module, orgId)', insertText: 'zoho.books.getRecords("${1:Invoices}", "${2:organization_id}")' },
                    { label: 'zoho.books.createRecord(module, orgId, map)', insertText: 'zoho.books.createRecord("${1:Invoices}", "${2:organization_id}", ${3:dataMap})' },
                    { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'zoho.recruit.getRecordById("${1:Candidates}", ${2:id})' },
                    { label: 'zoho.recruit.updateRecord(module, id, map)', insertText: 'zoho.recruit.updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
                ]
            };

            // 1. JSON Autocomplete (if inside .get("") or .getJSON(""))
            const interfaceGetMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.get(JSON)?\("$/);
            const interfaceDotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);

            if (interfaceGetMatch || interfaceDotMatch) {
                const varName = (interfaceGetMatch || interfaceDotMatch)[1];
                const mappings = window.interfaceMappings || {};
                if (mappings[varName]) {
                    const obj = mappings[varName];
                    const keys = Object.keys(obj);
                    const suggestions = keys.map(key => {
                        const val = obj[key];
                        const isObject = typeof val === 'object' && val !== null;
                        const kind = isObject ? monaco.languages.CompletionItemKind.Module : monaco.languages.CompletionItemKind.Property;

                        return {
                            label: key,
                            kind: kind,
                            detail: `Key from ${varName} (${typeof val})`,
                            insertText: interfaceDotMatch ? `get("${key}")` : key,
                            range: range
                        };
                    });

                    if (interfaceDotMatch) {
                        const type = inferVarType(varName, code) || 'Map';
                        const methods = typeMethods[type.toLowerCase()] || typeMethods.map;
                        methods.forEach(m => {
                            suggestions.push({
                                ...m,
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                range: range
                            });
                        });
                    }

                    return { suggestions };
                }
            }

            // 2. Method Autocomplete
            const match = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
            if (match) {
                const varName = match[1];
                const type = inferVarType(varName, code);
                const suggestions = type && typeMethods[type.toLowerCase()] ? typeMethods[type.toLowerCase()] : [...typeMethods.map, ...typeMethods.list, ...typeMethods.string];

                // Unique-ify suggestions by label
                const uniqueSuggestions = [];
                const seenLabels = new Set();
                suggestions.forEach(s => {
                    if (!seenLabels.has(s.label)) {
                        uniqueSuggestions.push(s);
                        seenLabels.add(s.label);
                    }
                });

                return {
                    suggestions: uniqueSuggestions.map(s => ({
                        ...s,
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range
                    }))
                };
            }

            const variables = extractVariables(code);
            const varSuggestions = variables.map(v => ({
                label: v.name,
                kind: monaco.languages.CompletionItemKind.Variable,
                detail: `Variable (${v.type || 'unknown'})`,
                insertText: v.name,
                range: range
            }));
            const zohoSuggestions = typeMethods.zoho.map(s => ({
                ...s,
                kind: monaco.languages.CompletionItemKind.Function,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range
            }));

            // Combine and unique-ify everything for the final list
            const allSuggestions = [...staticSuggestions, ...varSuggestions, ...zohoSuggestions];
            const finalSuggestions = [];
            const seenFinal = new Set();
            allSuggestions.forEach(s => {
                if (!seenFinal.has(s.label)) {
                    finalSuggestions.push({ ...s, range });
                    seenFinal.add(s.label);
                }
            });

            return {
                suggestions: finalSuggestions
            };
        }
    });


    const typeCache = new Map();
    let lastCodeForCache = "";

    function getVarTypes(code) {
        if (code === lastCodeForCache && typeCache.size > 0) return typeCache;

        typeCache.clear();
        lastCodeForCache = code;

        const mapAssign = /([a-zA-Z0-9_]+)\s*=\s*Map\(\)/gi;
        const listAssign = /([a-zA-Z0-9_]+)\s*=\s*List\(\)/gi;
        const stringAssign = /([a-zA-Z0-9_]+)\s*=\s*["']/gi;

        let m;
        while ((m = mapAssign.exec(code)) !== null) typeCache.set(m[1], 'Map');
        while ((m = listAssign.exec(code)) !== null) typeCache.set(m[1], 'List');
        while ((m = stringAssign.exec(code)) !== null) typeCache.set(m[1], 'String');

        return typeCache;
    }

    function inferVarType(varName, code) {
        const types = getVarTypes(code);
        if (types.has(varName)) return types.get(varName);
        if (varName.toLowerCase().includes('response')) return 'Map';
        return null;
    }

    function extractVariables(code) {
        const vars = [];
        const seen = new Set();
        const types = getVarTypes(code);

        const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
        let match;
        while ((match = assignmentRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name) && !['if', 'for', 'else', 'return', 'try', 'catch', 'while'].includes(name)) {
                vars.push({ name, type: types.get(name) || null });
                seen.add(name);
            }
        }

        const forEachRegex = /for each\s+([a-zA-Z0-9_]+)\s+in/g;
        while ((match = forEachRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: 'Map' });
                seen.add(name);
            }
        }

        const funcRegex = /([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
        while ((match = funcRegex.exec(code)) !== null) {
            const args = match[2].split(',');
            args.forEach(arg => {
                const trimmed = arg.trim();
                if (trimmed && !seen.has(trimmed)) {
                    vars.push({ name: trimmed, type: null });
                    seen.add(trimmed);
                }
            });
        }

        return vars;
    }

    monaco.editor.onDidCreateModel((model) => {
        if (model.getLanguageId() === 'deluge') {
            const validate = () => {
                const markers = [];
                const lines = model.getLinesContent();
                const code = model.getValue();

                let inBracketBlock = 0;
                let inCommentBlock = false;

                lines.forEach((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.length === 0) return;

                    // Comment handling
                    if (trimmed.startsWith('//')) return;
                    if (trimmed.startsWith('/*')) {
                        if (!trimmed.includes('*/')) inCommentBlock = true;
                        return;
                    }
                    if (inCommentBlock) {
                        if (trimmed.includes('*/')) inCommentBlock = false;
                        return;
                    }

                    // Count brackets/square brackets
                    const opens = (trimmed.match(/\[/g) || []).length;
                    const closes = (trimmed.match(/\]/g) || []).length;
                    const prevInBracketBlock = inBracketBlock;
                    inBracketBlock += opens - closes;

                    const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'while'];
                    const startsWithKeyword = skipKeywords.some(kw => trimmed.toLowerCase().startsWith(kw));
                    const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',');

                    if (!endsWithSpecial && !startsWithKeyword && inBracketBlock === 0 && prevInBracketBlock === 0) {
                        let nextLineTrimmed = (lines[i+1] || "").trim();
                        if (!nextLineTrimmed.startsWith('[') && !nextLineTrimmed.startsWith('{') && !trimmed.includes('[') && !trimmed.includes('{')) {
                            markers.push({
                                message: 'Likely missing semicolon',
                                severity: monaco.MarkerSeverity.Warning,
                                startLineNumber: i + 1, startColumn: 1,
                                endLineNumber: i + 1, endColumn: line.length + 1
                            });
                        }
                    }

                    // Method validation (.put, .add)
                    const putMatch = trimmed.match(/([a-zA-Z0-9_]+)\.put\(/);
                    if (putMatch) {
                        const type = inferVarType(putMatch[1], code);
                        if (type && type !== 'Map') {
                            markers.push({
                                message: `Variable '${putMatch[1]}' is ${type}, but .put() is for Maps.`,
                                severity: monaco.MarkerSeverity.Error,
                                startLineNumber: i + 1, startColumn: line.indexOf(putMatch[1]) + 1,
                                endLineNumber: i + 1, endColumn: line.indexOf(putMatch[1]) + putMatch[1].length + 1
                            });
                        }
                    }
                    const addMatch = trimmed.match(/([a-zA-Z0-9_]+)\.add\(/);
                    if (addMatch) {
                        const type = inferVarType(addMatch[1], code);
                        if (type && type !== 'List') {
                            markers.push({
                                message: `Variable '${addMatch[1]}' is ${type}, but .add() is for Lists.`,
                                severity: monaco.MarkerSeverity.Error,
                                startLineNumber: i + 1, startColumn: line.indexOf(addMatch[1]) + 1,
                                endLineNumber: i + 1, endColumn: line.indexOf(addMatch[1]) + addMatch[1].length + 1
                            });
                        }
                    }
                });
                monaco.editor.setModelMarkers(model, 'deluge', markers);
            };
            validate();
            model.onDidChangeContent(validate);
        }
    });
}
