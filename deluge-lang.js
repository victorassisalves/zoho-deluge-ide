// Deluge Language Definition for Monaco Editor

function registerDelugeLanguage() {
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
            'yield', 'as', 'distinct', 'sort', 'by', 'asc', 'desc', 'input'
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
                [/[a-zA-Z_][a-zA-Z0-9_.]*/, {
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
                [/"([^"\]|\.)*"/, 'string'],
                [/'([^'\]|\.)*'/, 'string'],
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

    const suggestions = [
        // Keywords
        ...['if', 'else', 'for each', 'return', 'break', 'continue', 'info', 'true', 'false', 'null'].map(k => ({
            label: k, kind: monaco.languages.CompletionItemKind.Keyword, insertText: k
        })),

        // Built-in Methods
        { label: 'put', kind: monaco.languages.CompletionItemKind.Method, insertText: 'put(${1:key}, ${2:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Map: Add key-value pair' },
        { label: 'get', kind: monaco.languages.CompletionItemKind.Method, insertText: 'get(${1:key})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Map/List: Get value' },
        { label: 'add', kind: monaco.languages.CompletionItemKind.Method, insertText: 'add(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'List: Add element' },
        { label: 'addAll', kind: monaco.languages.CompletionItemKind.Method, insertText: 'addAll(${1:list})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'size', kind: monaco.languages.CompletionItemKind.Method, insertText: 'size()' },
        { label: 'isEmpty', kind: monaco.languages.CompletionItemKind.Method, insertText: 'isEmpty()' },
        { label: 'keys', kind: monaco.languages.CompletionItemKind.Method, insertText: 'keys()' },
        { label: 'values', kind: monaco.languages.CompletionItemKind.Method, insertText: 'values()' },
        { label: 'clear', kind: monaco.languages.CompletionItemKind.Method, insertText: 'clear()' },
        { label: 'remove', kind: monaco.languages.CompletionItemKind.Method, insertText: 'remove(${1:key})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'contains', kind: monaco.languages.CompletionItemKind.Method, insertText: 'contains(${1:substring})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'containsIgnoreCase', kind: monaco.languages.CompletionItemKind.Method, insertText: 'containsIgnoreCase(${1:substring})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'startsWith', kind: monaco.languages.CompletionItemKind.Method, insertText: 'startsWith(${1:prefix})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'endsWith', kind: monaco.languages.CompletionItemKind.Method, insertText: 'endsWith(${1:suffix})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'indexOf', kind: monaco.languages.CompletionItemKind.Method, insertText: 'indexOf(${1:substring})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'replaceAll', kind: monaco.languages.CompletionItemKind.Method, insertText: 'replaceAll(${1:regex}, ${2:replacement})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'substring', kind: monaco.languages.CompletionItemKind.Method, insertText: 'substring(${1:start}, ${2:end})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'toLowerCase', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toLowerCase()' },
        { label: 'toUpperCase', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toUpperCase()' },
        { label: 'trim', kind: monaco.languages.CompletionItemKind.Method, insertText: 'trim()' },
        { label: 'length', kind: monaco.languages.CompletionItemKind.Method, insertText: 'length()' },
        { label: 'toList', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toList(${1:delimiter})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'toString', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toString()' },
        { label: 'toNumber', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toNumber()' },
        { label: 'toLong', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toLong()' },
        { label: 'toDecimal', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toDecimal()' },
        { label: 'toDate', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toDate()' },
        { label: 'addDay', kind: monaco.languages.CompletionItemKind.Method, insertText: 'addDay(${1:number})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'addMonth', kind: monaco.languages.CompletionItemKind.Method, insertText: 'addMonth(${1:number})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'addYear', kind: monaco.languages.CompletionItemKind.Method, insertText: 'addYear(${1:number})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },

        // Zoho Namespaces
        { label: 'zoho.crm.getRecordById', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.getRecordById("${1:Module}", ${2:ID});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.crm.getRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.getRecords("${1:Module}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.crm.searchRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.searchRecords("${1:Module}", "(${2:Criteria})");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.crm.createRecord', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.createRecord("${1:Module}", ${2:Map});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.crm.updateRecord', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.updateRecord("${1:Module}", ${2:ID}, ${3:Map});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.creator.getRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.creator.getRecords("${1:Owner}", "${2:App}", "${3:View}", ${4:Criteria});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.creator.createRecord', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.creator.createRecord("${1:Owner}", "${2:App}", "${3:Form}", ${4:Map});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.books.getRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.books.getRecords("${1:Module}", "${2:OrgID}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'zoho.currentdate', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.currentdate' },
        { label: 'zoho.currenttime', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.currenttime' },
        { label: 'zoho.loginuser', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.loginuser' },
    ];

    monaco.languages.registerCompletionItemProvider('deluge', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                startColumn: word.startColumn, endColumn: word.endColumn
            };
            return { suggestions: suggestions.map(s => ({ ...s, range })) };
        }
    });

    // Error Linting
    monaco.editor.onDidCreateModel((model) => {
        if (model.getLanguageId() === 'deluge') {
            const validate = () => {
                const markers = [];
                const lines = model.getLinesContent();
                lines.forEach((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.length > 0 &&
                        !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') &&
                        !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('else') &&
                        !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
                        markers.push({
                            message: 'Likely missing semicolon',
                            severity: monaco.MarkerSeverity.Warning,
                            startLineNumber: i + 1, startColumn: 1,
                            endLineNumber: i + 1, endColumn: line.length + 1
                        });
                    }
                });
                monaco.editor.setModelMarkers(model, 'deluge', markers);
            };
            validate();
            model.onDidChangeContent(validate);
        }
    });
}
