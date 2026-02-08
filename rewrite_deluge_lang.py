import sys

content = r"""(function() {
    function registerDeluge() {
        if (window.delugeRegistered) return;
        window.delugeRegistered = true;

        monaco.languages.register({ id: 'deluge' });

        monaco.languages.setLanguageConfiguration('deluge', {
            comments: {
                lineComment: '//',
                blockComment: ['/*', '*/'],
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')'],
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ],
        });

        monaco.languages.setMonarchTokensProvider('deluge', {
            ignoreCase: true,
            tokenizer: {
                root: [
                    // Comments
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\//, 'comment', '@lineComment'],

                    // Functions
                    [/[a-zA-Z_][\w]*\s*(?=\()/, 'function'],

                    // Map Keys
                    [/[a-zA-Z_]\w*(?=\s*:)/, 'key'],

                    // Constants (UPPERCASE)
                    [/[A-Z][A-Z_0-9]*/, 'identifier'],

                    // Identifiers and Keywords
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw': 'keyword',
                            'void|string|int|decimal|boolean|map|list|collection|file|zoho|thisapp|standalone|input|post|get|put|delete|patch': 'type',
                            'invokeurl': 'identifier',
                            '@default': 'variable'
                        }
                    }],

                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>!=]=?/, 'operator'],
                    [/[+\-*\/%]/, 'operator'],
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],
                    [/[;,.]/, 'delimiter'],
                    [/"([^"\\]|\\.)*"/, 'string'],
                    [/'([^'\\]|\\.)*'/, 'string'],
                ],
                comment: [
                    [/@\w+/, 'annotation'],
                    [/[^\/*@]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*@]/, 'comment']
                ],
                lineComment: [
                    [/@\w+/, 'annotation'],
                    [/[^@]+/, 'comment'],
                    [/@/, 'comment'],
                    [/$/, '@pop']
                ]
            },
        });

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
                { label: 'zoho.crm.searchRecords(module, criteria)', insertText: 'zoho.crm.searchRecords("${1:Leads}", "(${2:Email} == \\\'${3:test@example.com}\\\')")' },
                { label: 'zoho.books.getRecords(module, orgId)', insertText: 'zoho.books.getRecords("${1:Invoices}", "${2:organization_id}")' },
                { label: 'zoho.books.createRecord(module, orgId, map)', insertText: 'zoho.books.createRecord("${1:Invoices}", "${2:organization_id}", ${3:dataMap})' },
                { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'zoho.recruit.getRecordById("${1:Candidates}", ${2:id})' },
                { label: 'zoho.recruit.updateRecord(module, id, map)', insertText: 'zoho.recruit.updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
            ]
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

        monaco.languages.registerCompletionItemProvider('deluge', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordAtPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word ? word.startColumn : position.column,
                    endColumn: word ? word.endColumn : position.column
                };

                const lineUntilPos = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                const code = model.getValue();

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
                                if (methods) {
                                    methods.forEach(m => {
                                        suggestions.push({
                                            ...m,
                                            kind: monaco.languages.CompletionItemKind.Method,
                                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                            range: range
                                        });
                                    });
                                }
                            }
                            return { suggestions };
                        }
                    }
                }

                const suggestions = [
                    ...staticSuggestions.map(s => ({
                        ...s,
                        range: range
                    }))
                ];

                return { suggestions };
            }
        });

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

        function inferVarType(varName, code) {
            const mapRegex = new RegExp(varName + "\\s*=\\s*Map\\(\\)", "i");
            if (mapRegex.test(code)) return "Map";
            const listRegex = new RegExp(varName + "\\s*=\\s*List\\(\\)", "i");
            if (listRegex.test(code)) return "List";
            return null;
        }

        function validateModel(model) {
            if (!model || model.getLanguageId() !== 'deluge') return;
            const markers = [];
            const lines = model.getLinesContent();
            const code = model.getValue();

            let openBraces = 0;
            let openBrackets = 0;
            let openParens = 0;
            let inCommentBlock = false;

            const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now', 'invokeurl', 'post', 'get', 'put', 'delete', 'patch']);

            const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list|collection|file)\s+[a-zA-Z_]\w*\s*\(([^)]*)\)/gi;
            let pMatch;
            while ((pMatch = funcParamRegex.exec(code)) !== null) {
                const params = pMatch[1].split(',');
                params.forEach(p => {
                    const parts = p.trim().split(/\s+/);
                    if (parts.length > 0) {
                        const paramName = parts[parts.length - 1].trim();
                        if (paramName) definedVars.add(paramName.toLowerCase());
                    }
                });
            }

            const catchRegex = /catch\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
            while ((pMatch = catchRegex.exec(code)) !== null) {
                definedVars.add(pMatch[1].toLowerCase());
            }
            const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
            let match;
            while ((match = assignmentRegex.exec(code)) !== null) {
                definedVars.add(match[1].toLowerCase());
            }
            const forEachRegex = /for\s+each\s+([a-zA-Z0-9_]+)\s+in/gi;
            while ((match = forEachRegex.exec(code)) !== null) {
                definedVars.add(match[1].toLowerCase());
            }
            const forRegex = /for\s+([a-zA-Z0-9_]+)\s+in/gi;
            while ((match = forRegex.exec(code)) !== null) {
                definedVars.add(match[1].toLowerCase());
            }

            const mandatoryParams = {
                'zoho.crm.getRecordById': 2,
                'zoho.crm.createRecord': 2,
                'zoho.crm.updateRecord': 3,
                'zoho.crm.searchRecords': 2,
                'zoho.books.getRecords': 2,
                'zoho.books.createRecord': 3,
                'zoho.recruit.getRecordById': 2,
                'zoho.creator.getRecords': 4,
                'zoho.creator.createRecord': 4
            };

            const skipKeywords = ['if', 'for', 'each', 'in', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl', 'null', 'true', 'false', 'post', 'get', 'put', 'delete', 'patch'];
            const lowerSkipKeywords = skipKeywords.map(kw => kw.toLowerCase());

            lines.forEach((line, i) => {
                const trimmed = line.trim();
                if (trimmed.length === 0) return;

                if (trimmed.startsWith('//')) return;
                if (trimmed.startsWith('/*')) {
                    if (!trimmed.includes('*/')) inCommentBlock = true;
                    return;
                }
                if (inCommentBlock) {
                    if (trimmed.includes('*/')) inCommentBlock = false;
                    return;
                }

                openBraces += (trimmed.match(/\{/g) || []).length;
                openBraces -= (trimmed.match(/\}/g) || []).length;
                openBrackets += (trimmed.match(/\[/g) || []).length;
                openBrackets -= (trimmed.match(/\]/g) || []).length;
                openParens += (trimmed.match(/\(/g) || []).length;
                openParens -= (trimmed.match(/\)/g) || []).length;

                const startsWithKeyword = skipKeywords.some(kw => {
                    const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                    return regex.test(trimmed);
                });
                const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[');

                if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0 && openParens === 0) {
                    markers.push({
                        message: 'Missing semicolon',
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: i + 1, startColumn: line.length + 1,
                        endLineNumber: i + 1, endColumn: line.length + 2,
                        code: 'missing-semicolon'
                    });
                }

                const words = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
                words.forEach(word => {
                    if (lowerSkipKeywords.includes(word.toLowerCase())) return;
                    if (definedVars.has(word.toLowerCase())) return;

                    const index = line.indexOf(word);
                    const restOfLine = line.substring(index + word.length).trim();
                    if (restOfLine.startsWith('(') || restOfLine.startsWith('.') || restOfLine.startsWith(':')) return;

                    const before = line.substring(0, index);
                    const after = line.substring(index + word.length);
                    if ((before.match(/"/g) || []).length % 2 === 1 && (after.match(/"/g) || []).length % 2 === 1) return;
                    if ((before.match(/'/g) || []).length % 2 === 1 && (after.match(/'/g) || []).length % 2 === 1) return;

                    if (after.trim().startsWith('=')) return;

                    markers.push({
                        message: `Undefined variable: '${word}'`,
                        severity: monaco.MarkerSeverity.Warning,
                        startLineNumber: i + 1, startColumn: index + 1,
                        endLineNumber: i + 1, endColumn: index + word.length + 1
                    });
                });

                for (const [fn, count] of Object.entries(mandatoryParams)) {
                    if (trimmed.includes(fn)) {
                        const fnIndex = line.indexOf(fn);
                        const rest = line.substring(fnIndex + fn.length).trim();
                        if (rest.startsWith('(')) {
                            let parenLevel = 0;
                            let commas = 0;
                            let inParens = false;
                            for (let j = 0; j < rest.length; j++) {
                                if (rest[j] === '(') { parenLevel++; inParens = true; }
                                else if (rest[j] === ')') {
                                    parenLevel--;
                                    if (parenLevel === 0) break;
                                }
                                else if (rest[j] === ',' && parenLevel === 1) commas++;
                            }
                            const paramCount = commas === 0 && inParens && rest.indexOf(')') > rest.indexOf('(') + 1 ? 1 : (commas + 1);
                            const emptyParens = rest.match(/\(\s*\)/);
                            const actualCount = emptyParens && emptyParens.index === 0 ? 0 : (inParens ? paramCount : 0);

                            if (actualCount < count) {
                                markers.push({
                                    message: `${fn} requires at least ${count} parameters. Found ${actualCount}.`,
                                    severity: monaco.MarkerSeverity.Error,
                                    startLineNumber: i + 1, startColumn: fnIndex + 1,
                                    endLineNumber: i + 1, endColumn: fnIndex + fn.length + 1
                                });
                            }
                        }
                    }
                }
            });

            if (openBraces !== 0) {
                markers.push({
                    message: `Unbalanced braces: ${openBraces > 0 ? 'Missing closing }' : 'Extra closing }'}`,
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1
                });
            }

            monaco.editor.setModelMarkers(model, 'deluge', markers);
            if (window.syncProblemsPanel) window.syncProblemsPanel();
        }

        window.validateDelugeModel = validateModel;

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

        monaco.languages.registerHoverProvider('deluge', {
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
    }

    if (typeof monaco !== 'undefined') {
        registerDeluge();
    } else {
        window.addEventListener('monacoReady', registerDeluge);
    }
})();
"""

with open('deluge-lang.js', 'w') as f:
    f.write(content)
