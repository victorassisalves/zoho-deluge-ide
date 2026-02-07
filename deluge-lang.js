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
                [/[^\']+/, 'string'],
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
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };
                        const staticSuggestions = [
                { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
                { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
                { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'if else', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\n\t$1\n} catch (${2:err}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
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
                    { label: 'zoho.crm.searchRecords(module, criteria)', insertText: 'zoho.crm.searchRecords("${1:Leads}", "(${2:Email} == \'${3:test@example.com}\')")' },
                    { label: 'zoho.books.getRecords(module, orgId)', insertText: 'zoho.books.getRecords("${1:Invoices}", "${2:organization_id}")' },
                    { label: 'zoho.books.createRecord(module, orgId, map)', insertText: 'zoho.books.createRecord("${1:Invoices}", "${2:organization_id}", ${3:dataMap})' },
                    { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'zoho.recruit.getRecordById("${1:Candidates}", ${2:id})' },
                    { label: 'zoho.recruit.updateRecord(module, id, map)', insertText: 'zoho.recruit.updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
                ]
            };

                        // 1. JSON Autocomplete (if inside .get("") or .getJSON(""))
            const interfaceGetMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)((?:\.get(?:JSON)?\(.*?\))*)\.get(?:JSON)?\("([^"]*)$/);
            const interfaceDotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);

            if (interfaceGetMatch || interfaceDotMatch) {
                const varName = (interfaceGetMatch || interfaceDotMatch)[1];
                const path = interfaceGetMatch ? interfaceGetMatch[2] : "";
                const mappings = window.interfaceMappings || {};
                if (mappings[varName]) {
                    const rootObj = mappings[varName];
                    const obj = getNestedObject(rootObj, path);
                    if (obj && typeof obj === 'object') {
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
                                range: range,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
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
            }

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


        function getNestedObject(root, path) {
        if (!path) return root;
        const parts = path.match(/\.get(?:JSON)?\(([^)]+)\)/g);
        if (!parts) return root;
        let current = root;
        for (const part of parts) {
            const keyMatch = part.match(/\(([^)]+)\)/);
            if (keyMatch) {
                let key = keyMatch[1].trim();
                if (key.startsWith('"') || key.startsWith("'")) {
                    key = key.substring(1, key.length - 1);
                } else if (!isNaN(key)) {
                    key = parseInt(key);
                }
                if (current && typeof current === 'object') {
                    current = current[key];
                } else {
                    return null;
                }
            }
        }
        return current;
    }

    function extractVariables(code) {
        const vars = [];
        const seen = new Set(['if', 'for', 'else', 'return', 'try', 'catch', 'while', 'void', 'int', 'string', 'map', 'list', 'boolean', 'decimal', 'date', 'datetime']);
        const types = getVarTypes(code);

        // 1. Assignments: var = ...
        const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
        let match;
        while ((match = assignmentRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: types.get(name) || null });
                seen.add(name);
            }
        }

        // 2. Catch blocks: catch(err)
        const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)/g;
        while ((match = catchRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: 'Map' });
                seen.add(name);
            }
        }

        // 3. For each: for each var in ...
        const forEachRegex = /for each\s+([a-zA-Z0-9_]+)\s+in/g;
        while ((match = forEachRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                vars.push({ name, type: 'Map' });
                seen.add(name);
            }
        }

        // 4. Function parameters: void test(int rec_id)
        const funcRegex = /([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
        while ((match = funcRegex.exec(code)) !== null) {
            const argsText = match[2];
            if (argsText) {
                const args = argsText.split(',');
                args.forEach(arg => {
                    const trimmed = arg.trim();
                    if (!trimmed) return;
                    const parts = trimmed.split(/\s+/);
                    const name = parts.length > 1 ? parts[parts.length - 1] : parts[0];
                    if (name && !seen.has(name)) {
                        vars.push({ name: name, type: parts.length > 1 ? parts[0] : null });
                        seen.add(name);
                    }
                });
            }
        }

        return vars;
    }
        monaco.editor.onDidCreateModel((model) => {
        if (model.getLanguageId() === 'deluge') {
            const validate = () => {
                const markers = [];
                const lines = model.getLinesContent();
                const code = model.getValue();

                let openBraces = 0;
                let openBrackets = 0;
                let openParens = 0;
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

                    // Count brackets
                    openBraces += (trimmed.match(/\{/g) || []).length;
                    openBraces -= (trimmed.match(/\}/g) || []).length;
                    openBrackets += (trimmed.match(/\[/g) || []).length;
                    openBrackets -= (trimmed.match(/\]/g) || []).length;
                    openParens += (trimmed.match(/\(/g) || []).length;
                    openParens -= (trimmed.match(/\)/g) || []).length;

                    const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'while', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue'];
                    const startsWithKeyword = skipKeywords.some(kw => {
                        const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                        return regex.test(trimmed);
                    });
                    const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',');

                    // Semicolon check
                    if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0) {
                        markers.push({
                            message: 'Missing semicolon',
                            severity: monaco.MarkerSeverity.Error,
                            startLineNumber: i + 1, startColumn: line.length + 1,
                            endLineNumber: i + 1, endColumn: line.length + 2,
                            code: 'missing-semicolon'
                        });
                    }

                    // Garbage after semicolon check
                    if (trimmed.includes(';') && !trimmed.endsWith(';')) {
                        const lastSemiIndex = line.lastIndexOf(';');
                        const afterSemi = line.substring(lastSemiIndex + 1).trim();
                        if (afterSemi.length > 0 && !afterSemi.startsWith('//') && !afterSemi.startsWith('/*')) {
                            markers.push({
                                message: 'Syntax error: characters after semicolon',
                                severity: monaco.MarkerSeverity.Error,
                                startLineNumber: i + 1, startColumn: lastSemiIndex + 2,
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

                // Global balance checks
                if (openBraces !== 0) {
                    markers.push({
                        message: `Unbalanced braces: ${openBraces > 0 ? 'Missing closing }' : 'Extra closing }'}`,
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1
                    });
                }
                if (openBrackets !== 0) {
                    markers.push({
                        message: `Unbalanced square brackets: ${openBrackets > 0 ? 'Missing closing ]' : 'Extra closing ]'}`,
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1
                    });
                }

                monaco.editor.setModelMarkers(model, 'deluge', markers);

                // Trigger problems panel update in IDE
                if (window.syncProblemsPanel) window.syncProblemsPanel();
            };
            validate();
            model.onDidChangeContent(validate);
        }
    });

    // Quick Fixes
    monaco.languages.registerCodeActionProvider('deluge', {
        provideCodeActions: (model, range, context, token) => {
            const actions = context.markers
                .filter(m => m.code === 'missing-semicolon')
                .map(m => ({
                    title: "Add missing semicolon",
                    diagnostics: [m],
                    kind: "quickfix",
                    edit: {
                        edits: [{
                            resource: model.uri,
                            textEdit: {
                                range: new monaco.Range(m.startLineNumber, m.startColumn, m.startLineNumber, m.startColumn),
                                text: ";"
                            }
                        }]
                    },
                    isPreferred: true
                }));
            return { actions, dispose: () => {} };
        }
    });

}    monaco.languages.registerHoverProvider('deluge', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return;

            const docs = {
                'Map': 'A key-value pair data structure. Use `Map()` to initialize.',
                'List': 'A collection of items. Use `List()` to initialize.',
                'put': 'Adds a key-value pair to a Map. Syntax: `map.put(key, value);`',
                'add': 'Adds an element to a List. Syntax: `list.add(value);`',
                'get': 'Retrieves an element from a List or Map.',
                'insert': 'Inserts a record into a Zoho Creator form.',
                'fetch': 'Queries records from a Zoho Creator form.',
                'zoho': 'Namespace for Zoho integration tasks (CRM, Books, etc.)',
                'crm': 'Zoho CRM integration namespace.',
                'books': 'Zoho Books integration namespace.',
                'info': 'Logs a message to the console for debugging.',
                'invokeurl': 'Performs an HTTP request (GET, POST, etc.) to an external API.'
            };

            const content = docs[word.word];
            if (content) {
                return {
                    range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                    contents: [
                        { value: `**${word.word}**` },
                        { value: content }
                    ]
                };
            }

            // Try to infer variable type
            const type = inferVarType(word.word, model.getValue());
            if (type) {
                return {
                    range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                    contents: [
                        { value: `Variable: **${word.word}**` },
                        { value: `Type: ${type}` }
                    ]
                };
            }

            return null;
        }
    });
