import sys

tokenizer_code = r"""        monaco.languages.setMonarchTokensProvider('deluge', {
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
        });"""

linter_code = r"""        function validateModel(model) {
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
        }"""

with open('static_suggestions.txt', 'r') as f:
    suggestions_data = f.read()

# I will also add a generic CompletionItemProvider to deluge-lang.js
completion_code = r"""        monaco.languages.registerCompletionItemProvider('deluge', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordAtPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word ? word.startColumn : position.column,
                    endColumn: word ? word.endColumn : position.column
                };

                const suggestions = [
                    ...staticSuggestions.map(s => ({
                        ...s,
                        range: range
                    }))
                ];

                return { suggestions };
            }
        });"""

with open('deluge-lang.js', 'r') as f:
    orig_content = f.read()

# Reconstruct
content = orig_content

# Replace tokenizer
import re
content = re.sub(r"monaco\.languages\.setMonarchTokensProvider\('deluge', \{.*?\n\s+\}\);", tokenizer_code, content, flags=re.DOTALL)

# Replace validateModel
content = re.sub(r"function validateModel\(model\) \{.*?\n\s+\}", linter_code, content, flags=re.DOTALL)

# Add suggestions and completion provider before validateModel
content = content.replace("function validateModel", suggestions_data + "\n\n" + completion_code + "\n\n        function validateModel")

with open('deluge-lang.js', 'w') as f:
    f.write(content)
