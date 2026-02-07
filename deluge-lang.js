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
                    // Functions
                    [/[a-zA-Z_][\w]*\s*(?=\()/, 'function'],

                    // Identifiers and Keywords
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            'if|else|for|each|in|return|info|true|false|null|break|continue|while|try|catch|finally|throw|void|string|int|decimal|boolean|map|list': 'keyword',
                            'zoho|thisapp|standalone|input': 'type',
                            '@default': 'identifier'
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
                    [/\/\/.*$/, 'comment'],
                    [/\/\*/, 'comment', '@comment'],
                ],
                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],
            },
        });

        // Validation logic
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

            // 1. Collect defined variables
            const definedVars = new Set(['input', 'zoho', 'thisapp', 'standalone', 'today', 'now']);
            const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
            let match;
            while ((match = assignmentRegex.exec(code)) !== null) {
                definedVars.add(match[1]);
            }
            const forEachRegex = /for\s+each\s+([a-zA-Z0-9_]+)\s+in/gi;
            while ((match = forEachRegex.exec(code)) !== null) {
                definedVars.add(match[1]);
            }
            const forRegex = /for\s+([a-zA-Z0-9_]+)\s+in/gi;
            while ((match = forRegex.exec(code)) !== null) {
                definedVars.add(match[1]);
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

                // Count brackets for current line and global balance
                openBraces += (trimmed.match(/\{/g) || []).length;
                openBraces -= (trimmed.match(/\}/g) || []).length;
                openBrackets += (trimmed.match(/\[/g) || []).length;
                openBrackets -= (trimmed.match(/\]/g) || []).length;
                openParens += (trimmed.match(/\(/g) || []).length;
                openParens -= (trimmed.match(/\)/g) || []).length;

                const skipKeywords = ['if', 'for', 'else', 'try', 'catch', 'while', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info'];
                const startsWithKeyword = skipKeywords.some(kw => {
                    const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                    return regex.test(trimmed);
                });
                const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[');

                // Semicolon check
                if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0 && openParens === 0) {
                    markers.push({
                        message: 'Missing semicolon',
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: i + 1, startColumn: line.length + 1,
                        endLineNumber: i + 1, endColumn: line.length + 2,
                        code: 'missing-semicolon'
                    });
                }

                // Undefined variable check (Simple heuristic)
                const words = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
                words.forEach(word => {
                    if (skipKeywords.includes(word)) return;
                    if (definedVars.has(word)) return;

                    // Check if it's followed by ( or . (might be a function/namespace)
                    const index = line.indexOf(word);
                    const charAfter = line[index + word.length];
                    if (charAfter === '(' || charAfter === '.') return;

                    // Check if it's part of a string
                    // (Simplified check: if it's between quotes on same line)
                    const before = line.substring(0, index);
                    const after = line.substring(index + word.length);
                    if ((before.match(/"/g) || []).length % 2 === 1 && (after.match(/"/g) || []).length % 2 === 1) return;
                    if ((before.match(/'/g) || []).length % 2 === 1 && (after.match(/'/g) || []).length % 2 === 1) return;

                    // If it's on the left of =, it's being defined now
                    if (after.trim().startsWith('=')) return;

                    markers.push({
                        message: `Undefined variable: '${word}'`,
                        severity: monaco.MarkerSeverity.Warning,
                        startLineNumber: i + 1, startColumn: index + 1,
                        endLineNumber: i + 1, endColumn: index + word.length + 1
                    });
                });

                // Mandatory Parameter Check
                for (const [fn, count] of Object.entries(mandatoryParams)) {
                    if (trimmed.includes(fn)) {
                        const fnIndex = line.indexOf(fn);
                        const rest = line.substring(fnIndex + fn.length).trim();
                        if (rest.startsWith('(')) {
                            // Count commas inside the parens (very naive)
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
                            // Correct for empty parens
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
