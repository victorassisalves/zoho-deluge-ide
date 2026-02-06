// Deluge Language Definition for Monaco Editor

function registerDelugeLanguage() {
    if (typeof monaco === 'undefined') return;
    if (monaco.languages.getLanguages().some(lang => lang.id === 'deluge')) {
        return; // Already registered
    }

    monaco.languages.register({ id: 'deluge' });

    monaco.languages.setMonarchTokensProvider('deluge', {
        defaultToken: '',
        tokenPostfix: '.deluge',

        keywords: [
            'if', 'else', 'for', 'each', 'in', 'return', 'break', 'continue',
            'void', 'info', 'true', 'false', 'null', 'and', 'or', 'not',
            'yield', 'as', 'distinct', 'sort', 'by', 'asc', 'desc', 'input',
            'cancel', 'confirm'
        ],

        typeKeywords: [
            'string', 'int', 'decimal', 'map', 'list', 'date', 'datetime', 'boolean', 'file', 'json'
        ],

        operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
            '<<', '>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>='
        ],

        symbols: /[=><!~?:&|+\-*\/\^%]+/,

        tokenizer: {
            root: [
                [/zoho\.[a-zA-Z0-9._]*/, 'keyword.zoho'],
                [/[a-zA-Z_][a-zA-Z0-9_]*/, {
                    cases: {
                        '@typeKeywords': 'keyword.type',
                        '@keywords': 'keyword',
                        '@default': 'variable'
                    }
                }],
                { include: '@whitespace' },
                [/[{}()\[\]]/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/\d+/, 'number'],
                [/[;,.]/, 'delimiter'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
            ],
            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
            comment: [
                [/[^\/*]+/, 'comment'],
                [/\/\*/, 'comment', '@push'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
        }
    });

    monaco.languages.setLanguageConfiguration('deluge', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`~!@#%^&*()\-=+\[\]\\{}|;:',.<>?\s]+)/g,
        brackets: [['{', '}'], ['[', ']'], ['(', ')']],
        autoClosingPairs: [
            { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' },
            { open: '"', close: '"' }, { open: "'", close: "'" }
        ],
        surroundingPairs: [
            { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' },
            { open: '"', close: '"' }, { open: "'", close: "'" }
        ],
        comments: { lineComment: '//', blockComment: ['/*', '*/'] }
    });

    const staticSuggestions = [
        ...['if', 'else', 'for each', 'return', 'break', 'continue', 'info', 'true', 'false', 'null', 'and', 'or', 'not', 'in', 'yield', 'as'].map(k => ({
            label: k, kind: monaco.languages.CompletionItemKind.Keyword, insertText: k
        })),
        { label: 'Map', kind: monaco.languages.CompletionItemKind.Class, insertText: 'Map()' },
        { label: 'List', kind: monaco.languages.CompletionItemKind.Class, insertText: 'List()' }
    ];

    const typeMethods = {
        'map': [
            { label: 'put', detail: 'Map: Add key-value pair', insertText: 'put(${1:key}, ${2:value})' },
            { label: 'get', detail: 'Map: Get value', insertText: 'get(${1:key})' },
            { label: 'keys', detail: 'Map: Get keys', insertText: 'keys()' },
            { label: 'values', detail: 'Map: Get values', insertText: 'values()' },
            { label: 'remove', detail: 'Map: Remove key', insertText: 'remove(${1:key})' },
            { label: 'containKey', detail: 'Map: Has key?', insertText: 'containKey(${1:key})' },
            { label: 'size', detail: 'Map: Size', insertText: 'size()' },
            { label: 'clear', detail: 'Map: Clear', insertText: 'clear()' }
        ],
        'list': [
            { label: 'add', detail: 'List: Add element', insertText: 'add(${1:value})' },
            { label: 'addAll', detail: 'List: Add all elements', insertText: 'addAll(${1:list})' },
            { label: 'get', detail: 'List: Get element by index', insertText: 'get(${1:index})' },
            { label: 'size', detail: 'List: Size', insertText: 'size()' },
            { label: 'isEmpty', detail: 'List: Is empty?', insertText: 'isEmpty()' },
            { label: 'remove', detail: 'List: Remove by index', insertText: 'remove(${1:index})' },
            { label: 'contains', detail: 'List: Contains value?', insertText: 'contains(${1:value})' }
        ],
        'string': [
            { label: 'length', insertText: 'length()' },
            { label: 'subString', insertText: 'subString(${1:start}, ${2:end})' },
            { label: 'indexOf', insertText: 'indexOf(${1:substring})' },
            { label: 'startsWith', insertText: 'startsWith(${1:prefix})' },
            { label: 'toLowerCase', insertText: 'toLowerCase()' },
            { label: 'toUpperCase', insertText: 'toUpperCase()' },
            { label: 'trim', insertText: 'trim()' },
            { label: 'toList', insertText: 'toList(${1:delimiter})' }
        ],
        'date': [
            { label: 'addDay', insertText: 'addDay(${1:number})' },
            { label: 'addMonth', insertText: 'addMonth(${1:number})' },
            { label: 'addYear', insertText: 'addYear(${1:number})' },
            { label: 'toString', insertText: 'toString("${1:dd-MMM-yyyy}")' }
        ],
        'zoho': [
             { label: 'zoho.crm.getRecordById', insertText: 'zoho.crm.getRecordById("${1:Module}", ${2:ID})' },
             { label: 'zoho.crm.updateRecord', insertText: 'zoho.crm.updateRecord("${1:Module}", ${2:ID}, ${3:Map})' },
             { label: 'zoho.creator.getRecords', insertText: 'zoho.creator.getRecords("${1:Owner}", "${2:App}", "${3:View}", ${4:Criteria})' },
             { label: 'zoho.currentdate', insertText: 'zoho.currentdate' },
             { label: 'zoho.currenttime', insertText: 'zoho.currenttime' }
        ]
    };

    monaco.languages.registerCompletionItemProvider('deluge', {
        triggerCharacters: ['.', ' ', '='],
        provideCompletionItems: (model, position) => {
            const code = model.getValue();
            const line = model.getLineContent(position.lineNumber);
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };
            const lineUntilPos = line.substring(0, position.column - 1);
            const match = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
            if (match) {
                const varName = match[1];
                const type = inferVarType(varName, code);
                const suggestions = type && typeMethods[type.toLowerCase()] ? typeMethods[type.toLowerCase()] : [...typeMethods.map, ...typeMethods.list, ...typeMethods.string];
                return {
                    suggestions: suggestions.map(s => ({
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
            return {
                suggestions: [...staticSuggestions.map(s => ({ ...s, range })), ...varSuggestions, ...zohoSuggestions]
            };
        }
    });

    function extractVariables(code) {
        const vars = [];
        const seen = new Set();
        const assignmentRegex = /([a-zA-Z0-9_]+)\s*=/g;
        let match;
        while ((match = assignmentRegex.exec(code)) !== null) {
            const name = match[1];
            if (!seen.has(name) && !['if', 'for', 'else', 'return'].includes(name)) {
                vars.push({ name, type: inferVarType(name, code) });
                seen.add(name);
            }
        }
        return vars;
    }

    function inferVarType(varName, code) {
        const mapRegex = new RegExp(`${varName}\\s*=\\s*Map\\(\\)`, 'i');
        const listRegex = new RegExp(`${varName}\\s*=\\s*List\\(\\)`, 'i');
        const stringRegex = new RegExp(`${varName}\\s*=\\s*["']`, 'i');
        if (mapRegex.test(code)) return 'Map';
        if (listRegex.test(code)) return 'List';
        if (stringRegex.test(code)) return 'String';
        if (varName.toLowerCase().includes('response')) return 'Map';
        return null;
    }

    monaco.editor.onDidCreateModel((model) => {
        if (model.getLanguageId() === 'deluge') {
            const validate = () => {
                const markers = [];
                const lines = model.getLinesContent();
                const code = model.getValue();
                lines.forEach((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.length > 0 &&
                        !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') &&
                        !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('else') &&
                        !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.includes('[')
                    ) {
                        markers.push({
                            message: 'Likely missing semicolon',
                            severity: monaco.MarkerSeverity.Warning,
                            startLineNumber: i + 1, startColumn: 1,
                            endLineNumber: i + 1, endColumn: line.length + 1
                        });
                    }
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

function jsonToDeluge(jsonStr, varName = 'dataMap') {
    try {
        const obj = JSON.parse(jsonStr);
        let code = '';
        function process(current, name) {
            if (Array.isArray(current)) {
                code += `${name} = List();\n`;
                current.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        const subName = `${name}_item_${index}`;
                        process(item, subName);
                        code += `${name}.add(${subName});\n`;
                    } else {
                        const val = typeof item === 'string' ? `"${item}"` : item;
                        code += `${name}.add(${val});\n`;
                    }
                });
            } else if (typeof current === 'object' && current !== null) {
                code += `${name} = Map();\n`;
                for (let key in current) {
                    const val = current[key];
                    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    if (typeof val === 'object' && val !== null) {
                        const subName = `${name}_${safeKey}`;
                        process(val, subName);
                        code += `${name}.put("${key}", ${subName});\n`;
                    } else {
                        const v = typeof val === 'string' ? `"${val}"` : val;
                        code += `${name}.put("${key}", ${v});\n`;
                    }
                }
            }
        }
        process(obj, varName);
        return code;
    } catch (e) {
        return `// Error parsing JSON: ${e.message}`;
    }
}
window.jsonToDeluge = jsonToDeluge;
