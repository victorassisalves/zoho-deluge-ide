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
                // Zoho namespaces (more specific first)
                [/zoho\.[a-zA-Z0-9._]*/, 'keyword.zoho'],

                // Identifiers and keywords
                [/[a-zA-Z_][a-zA-Z0-9_]*/, {
                    cases: {
                        '@typeKeywords': 'keyword.type',
                        '@keywords': 'keyword',
                        '@default': 'variable'
                    }
                }],

                { include: '@whitespace' },

                // Delimiters and brackets
                [/[{}()\[\]]/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],

                // Numbers
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/\d+/, 'number'],

                // Strings
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

    const suggestions = [
        // Keywords
        ...['if', 'else', 'for each', 'return', 'break', 'continue', 'info', 'true', 'false', 'null', 'and', 'or', 'not', 'in', 'yield', 'as'].map(k => ({
            label: k, kind: monaco.languages.CompletionItemKind.Keyword, insertText: k
        })),

        // Collection Methods
        ...[
            { label: 'put', detail: 'Map: Add key-value pair', insertText: 'put(${1:key}, ${2:value})' },
            { label: 'get', detail: 'Map/List: Get value', insertText: 'get(${1:index/key})' },
            { label: 'add', detail: 'List: Add element', insertText: 'add(${1:value})' },
            { label: 'addAll', detail: 'List: Add all elements', insertText: 'addAll(${1:list})' },
            { label: 'size', detail: 'Size of collection', insertText: 'size()' },
            { label: 'isEmpty', detail: 'Check if empty', insertText: 'isEmpty()' },
            { label: 'keys', detail: 'Map: Get keys', insertText: 'keys()' },
            { label: 'values', detail: 'Map: Get values', insertText: 'values()' },
            { label: 'clear', detail: 'Clear collection', insertText: 'clear()' },
            { label: 'remove', detail: 'Remove element', insertText: 'remove(${1:index/key})' },
            { label: 'containKey', detail: 'Map: Has key?', insertText: 'containKey(${1:key})' },
            { label: 'containValue', detail: 'Map: Has value?', insertText: 'containValue(${1:value})' }
        ].map(s => ({ ...s, kind: monaco.languages.CompletionItemKind.Method, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet })),

        // Zoho Namespaces & Global vars
        ...[
            { label: 'zoho.currentdate', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.currentdate' },
            { label: 'zoho.currenttime', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.currenttime' },
            { label: 'zoho.loginuser', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.loginuser' },
            { label: 'zoho.adminuser', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'zoho.adminuser' },
            { label: 'zoho.crm.getRecordById', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.getRecordById("${1:Module}", ${2:ID});' },
            { label: 'zoho.crm.getRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.getRecords("${1:Module}");' },
            { label: 'zoho.crm.searchRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.crm.searchRecords("${1:Module}", "(${2:Criteria})");' },
            { label: 'zoho.creator.getRecords', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zoho.creator.getRecords("${1:Owner}", "${2:App}", "${3:View}", ${4:Criteria});' }
        ].map(s => ({ ...s, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }))
    ];

    monaco.languages.registerCompletionItemProvider('deluge', {
        triggerCharacters: ['.'],
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };
            return { suggestions: suggestions.map(s => ({ ...s, range })) };
        }
    });

    // Simple Linter
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
                        !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.includes('[')
                    ) {
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
