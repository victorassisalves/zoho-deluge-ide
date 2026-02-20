export function registerDelugeLanguage(monaco) {
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
                [/[A-Z][A-Z_0-9]*/, {
                    cases: {
                        'GET|POST|PUT|DELETE|PATCH': 'keyword',
                        '@default': 'identifier'
                    }
                }],

                // Identifiers and Keywords
                [/[a-z_$][\w$]*/, {
                    cases: {
                        'if|else|for|each|in|return|info|true|false|null|break|continue|try|catch|finally|throw|void|string|int|decimal|boolean|map|list|collection': 'keyword',
                        'zoho|thisapp|standalone|input': 'type',
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
            comment_block: [
                [/[^\/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
        },
    });
}
