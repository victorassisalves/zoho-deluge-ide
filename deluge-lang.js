(function() {
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
            tokenizer: {
                root: [
                    // Comments
                    [/\/\/.*$/, 'comment'],
                    [/\/\*/, 'comment', '@comment_block'],

                    // Functions
                    [/[a-zA-Z_][\w]*\s*(?=\()/, 'function'],

                    // Map Keys
                    [/[a-zA-Z_]\w*(?=\s*:)/, 'key'],

                    // Constants (UPPERCASE)
                    [/[A-Z][A-Z_0-9]*/, 'identifier'],

                    // Identifiers and Keywords
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list': 'keyword',
                            'zoho|thisapp|standalone|input': 'type', 'invokeurl': 'identifier', '@default': 'variable'
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
                comment_block: [
                    [/[^\/*]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],
            },
        });
                        const staticSuggestions = [
            { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
            { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
            { label: 'Collection()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Collection()' },
            { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\n\t$1\n} catch (${2:err}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\n[\n\turl: "$1"\n\ttype: ${2|GET,POST,PUT,DELETE|}\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'sendmail', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: "$1"\n\tsubject: "$2"\n\tmessage: "$3"\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'today', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'today' },
            { label: 'now', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'now' },
            { label: 'daysBetween', kind: monaco.languages.CompletionItemKind.Function, insertText: 'daysBetween(${1:d1}, ${2:d2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
        ];

                const typeMethods = {
            string: [
                { label: 'length()', insertText: 'length()' },
                { label: 'subString(start, end)', insertText: 'subString(${1:start}, ${2:end})' },
                { label: 'toLowerCase()', insertText: 'toLowerCase()' },
                { label: 'toUpperCase()', insertText: 'toUpperCase()' },
                { label: 'trim()', insertText: 'trim()' },
                { label: 'toList(sep)', insertText: 'toList("${1:,}")' },
                { label: 'toNumber()', insertText: 'toNumber()' },
                { label: 'toDecimal()', insertText: 'toDecimal()' },
                { label: 'toDate()', insertText: 'toDate()' },
                { label: 'toDateTime()', insertText: 'toDateTime()' },
                { label: 'contains(str)', insertText: 'contains("${1:str}")' },
                { label: 'startsWith(str)', insertText: 'startsWith("${1:str}")' },
                { label: 'endsWith(str)', insertText: 'endsWith("${1:str}")' },
                { label: 'replaceAll(old, new)', insertText: 'replaceAll("${1:old}", "${2:new}")' }
            ],
            list: [
                { label: 'add(val)', insertText: 'add(${1:val})' },
                { label: 'addAll(otherList)', insertText: 'addAll(${1:otherList})' },
                { label: 'get(index)', insertText: 'get(${1:index})' },
                { label: 'size()', insertText: 'size()' },
                { label: 'contains(val)', insertText: 'contains(${1:val})' },
                { label: 'isEmpty()', insertText: 'isEmpty()' },
                { label: 'remove(index)', insertText: 'remove(${1:index})' },
                { label: 'clear()', insertText: 'clear()' },
                { label: 'sort(asc)', insertText: 'sort(${1:true})' },
                { label: 'distinct()', insertText: 'distinct()' }
            ],
            map: [
                { label: 'put(key, val)', insertText: 'put("${1:key}", ${2:val})' },
                { label: 'get(key)', insertText: 'get("${1:key}")' },
                { label: 'getJSON(key)', insertText: 'getJSON("${1:key}")' },
                { label: 'keys()', insertText: 'keys()' },
                { label: 'remove(key)', insertText: 'remove("${1:key}")' },
                { label: 'size()', insertText: 'size()' },
                { label: 'isEmpty()', insertText: 'isEmpty()' },
                { label: 'containsKey(key)', insertText: 'containsKey("${1:key}")' },
                { label: 'containValue(val)', insertText: 'containValue(${1:val})' },
                { label: 'clear()', insertText: 'clear()' }
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

//        monaco.languages.registerCompletionItemProvider('deluge', {
//            triggerCharacters: ['.', '"'],
//            provideCompletionItems: (model, position) => {
//                const lineUntilPos = model.getValueInRange({
//                    startLineNumber: position.lineNumber,
//                    startColumn: 1,
//                    endLineNumber: position.lineNumber,
//                    endColumn: position.column
//                });

                const code = model.getValue();
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: model.getWordUntilPosition(position).startColumn,
                    endColumn: position.column
                };

                // Method Suggestion after a dot
                const dotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
                if (dotMatch) {
                    const varName = dotMatch[1];
                    const type = inferVarType(varName, code) || 'map';
                    const methods = typeMethods[type.toLowerCase()] || typeMethods.map;

                    return {
                        suggestions: methods.map(m => ({
                            ...m,
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: range
                        }))
                    };
                }

                // Zoho suggestions
                if (lineUntilPos.endsWith('zoho.')) {
                    return {
                        suggestions: typeMethods.zoho.map(m => ({
                            ...m,
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: range
                        }))
                    };
                }

                // Default suggestions
                const vars = extractVariables(code);
                const varSuggestions = Array.from(vars).map(v => ({
                    label: v,
                    kind: monaco.languages.CompletionItemKind.Variable,
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
        });


        // Validation logic
            function extractVariables(code) {
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

        // Extract from for loops
        const forRegex = /for\s+([a-zA-Z0-9_]+)\s+in/gi;
        while ((match = forRegex.exec(code)) !== null) {
            vars.add(match[1]);
        }

        return vars;
    }

    function inferVarType(varName, code) {
            const mapRegex = new RegExp(varName + "\\s*=\\s*Map\\(\\)", "i");
            if (mapRegex.test(code)) return "Map";
            const listRegex = new RegExp(varName + "\\s*=\\s*List\\(\\)", "i");
            if (listRegex.test(code)) return "List";
            return null;
        }


//        function validateModel(model) {
//            if (!model || model.getLanguageId() !== 'deluge') return;
//            const markers = [];
//            const lines = model.getLinesContent();
//            const code = model.getValue();
//
//            let openBraces = 0;
//            let openBrackets = 0;
//            let openParens = 0;
//            let inCommentBlock = false;
//
//            // 1. Collect defined variables
//            const definedVars = extractVariables(code);
//
//            const mandatoryParams = {
//                'zoho.crm.getRecordById': 2,
//                'zoho.crm.createRecord': 2,
//                'zoho.crm.updateRecord': 3,
//                'zoho.crm.searchRecords': 2,
//                'zoho.books.getRecords': 2,
//                'zoho.books.createRecord': 3,
//                'zoho.recruit.getRecordById': 2,
//                'zoho.creator.getRecords': 4,
//                'zoho.creator.createRecord': 4
//            };
//
//            lines.forEach((line, i) => {
//                const trimmed = line.trim();
//                if (trimmed.length === 0) return;
//
//                // Comment handling
//                if (trimmed.startsWith('//')) return;
//                if (trimmed.startsWith('/*')) {
//                    if (!trimmed.includes('*/')) inCommentBlock = true;
//                    return;
//                }
//                if (inCommentBlock) {
//                    if (trimmed.includes('*/')) inCommentBlock = false;
//                    return;
//                }
//
//                // Count brackets for current line and global balance
//                openBraces += (trimmed.match(/\{/g) || []).length;
//                openBraces -= (trimmed.match(/\}/g) || []).length;
//                openBrackets += (trimmed.match(/\[/g) || []).length;
//                openBrackets -= (trimmed.match(/\]/g) || []).length;
//                openParens += (trimmed.match(/\(/g) || []).length;
//                openParens -= (trimmed.match(/\)/g) || []).length;
//
//                const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl'];
//                const startsWithKeyword = skipKeywords.some(kw => {
//                    const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
//                    return regex.test(trimmed);
//                });
//                const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[');
//
//                // Semicolon check
//                if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0 && openParens === 0) {
//                    markers.push({
//                        message: 'Missing semicolon',
//                        severity: monaco.MarkerSeverity.Error,
//                        startLineNumber: i + 1, startColumn: line.length + 1,
//                        endLineNumber: i + 1, endColumn: line.length + 2,
//                        code: 'missing-semicolon'
//                    });
//                }
//
//                // Undefined variable check (Simple heuristic)
//                const words = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
//                words.forEach(word => {
//                    if (skipKeywords.includes(word)) return;
//                    if (definedVars.has(word)) return;
//
//                    // Check if it's followed by ( or . (might be a function/namespace)
//                    const index = line.indexOf(word);
//                    const restOfLine = line.substring(index + word.length).trim();
//                    if (restOfLine.startsWith('(') || restOfLine.startsWith('.') || restOfLine.startsWith(':')) return;
//
//                    // Check if it's part of a string
//                    // (Simplified check: if it's between quotes on same line)
//                    const before = line.substring(0, index);
//                    const after = line.substring(index + word.length);
//                    if ((before.match(/"/g) || []).length % 2 === 1 && (after.match(/"/g) || []).length % 2 === 1) return;
//                    if ((before.match(/'/g) || []).length % 2 === 1 && (after.match(/'/g) || []).length % 2 === 1) return;
//
//                    // If it's on the left of =, it's being defined now
//                    if (after.trim().startsWith('=')) return;
//
//                    markers.push({
//                        message: `Undefined variable: '${word}'`,
//                        severity: monaco.MarkerSeverity.Warning,
//                        startLineNumber: i + 1, startColumn: index + 1,
//                        endLineNumber: i + 1, endColumn: index + word.length + 1
//                    });
//                });
//
//                // Mandatory Parameter Check
//                for (const [fn, count] of Object.entries(mandatoryParams)) {
//                    if (trimmed.includes(fn)) {
//                        const fnIndex = line.indexOf(fn);
//                        const rest = line.substring(fnIndex + fn.length).trim();
//                        if (rest.startsWith('(')) {
//                            // Count commas inside the parens (very naive)
//                            let parenLevel = 0;
//                            let commas = 0;
//                            let inParens = false;
//                            for (let j = 0; j < rest.length; j++) {
//                                if (rest[j] === '(') { parenLevel++; inParens = true; }
//                                else if (rest[j] === ')') {
//                                    parenLevel--;
//                                    if (parenLevel === 0) break;
//                                }
//                                else if (rest[j] === ',' && parenLevel === 1) commas++;
//                            }
//                            const paramCount = commas === 0 && inParens && rest.indexOf(')') > rest.indexOf('(') + 1 ? 1 : (commas + 1);
//                            // Correct for empty parens
//                            const emptyParens = rest.match(/\(\s*\)/);
//                            const actualCount = emptyParens && emptyParens.index === 0 ? 0 : (inParens ? paramCount : 0);
//
//                            if (actualCount < count) {
//                                markers.push({
//                                    message: `${fn} requires at least ${count} parameters. Found ${actualCount}.`,
//                                    severity: monaco.MarkerSeverity.Error,
//                                    startLineNumber: i + 1, startColumn: fnIndex + 1,
//                                    endLineNumber: i + 1, endColumn: fnIndex + fn.length + 1
//                                });
//                            }
//                        }
//                    }
//                }
//            });
//
//            if (openBraces !== 0) {
//                markers.push({
//                    message: `Unbalanced braces: ${openBraces > 0 ? 'Missing closing }' : 'Extra closing }'}`,
//                    severity: monaco.MarkerSeverity.Error,
//                    startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1
//                });
//            }
//
//            monaco.editor.setModelMarkers(model, 'deluge', markers);
//            if (window.syncProblemsPanel) window.syncProblemsPanel();
//        }
        //window.validateDelugeModel = validateModel;

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
    }

    if (typeof monaco !== 'undefined') {
        registerDeluge();
    } else {
        window.addEventListener('monacoReady', registerDeluge);
    }
})();
