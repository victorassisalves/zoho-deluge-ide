import sys
import re

with open('deluge-lang.js', 'r') as f:
    content = f.read()

new_tokenizer = r"""        monaco.languages.setMonarchTokensProvider('deluge', {
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
                comment: [
                    [/@\w+/, 'annotation'],
                    [/[^\/*@]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*@]/, 'comment']
                ],
                lineComment: [
                    [/@\w+/, 'annotation'],
                    [/[^@\n]+/, 'comment'],
                    [/$/, '@pop'],
                    [/@/, 'comment']
                ]
            },
        });"""

pattern = re.compile(r"monaco\.languages\.setMonarchTokensProvider\('deluge', \{.*?\n\s+\}\);", re.DOTALL)
updated_content = pattern.sub(lambda _: new_tokenizer, content)

with open('deluge-lang.js', 'w') as f:
    f.write(updated_content)
