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
                    [/\/\/.*$/, 'comment'],
                    [/\/\*/, 'comment', '@comment_block'],
                    [/[a-zA-Z_][\w]*\s*(?=\()/, 'function'],
                    [/[a-zA-Z_]\w*(?=\s*:)/, 'key'],
                    [/[A-Z][A-Z_0-9]*/, {
                        cases: {
                            'GET|POST|PUT|DELETE|PATCH': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
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

        // Duplicated from StdLib.js for Hover support in legacy script
        const typeMethods = {
            string: [
                { label: "contains(str)", insertText: "contains(\"${1:str}\")", doc: "Checks if the string contains the specified substring." },
                { label: "notContains(str)", insertText: "notContains(\"${1:str}\")", doc: "Checks if the string does not contain the specified substring." },
                { label: "containsIgnoreCase(str)", insertText: "containsIgnoreCase(\"${1:str}\")", doc: "Checks if the string contains the specified substring, ignoring case." },
                { label: "isEmpty()", insertText: "isEmpty()", doc: "Checks if the string is empty." },
                { label: "length()", insertText: "length()", doc: "Returns the length of the string." },
                { label: "toLowerCase()", insertText: "toLowerCase()", doc: "Converts the string to lower case." },
                { label: "toUpperCase()", insertText: "toUpperCase()", doc: "Converts the string to upper case." },
                { label: "trim()", insertText: "trim()", doc: "Removes leading and trailing whitespace." },
                { label: "subString(start, end)", insertText: "subString(${1:start}, ${2:end})", doc: "Returns a substring from start index to end index." },
                { label: "indexOf(str)", insertText: "indexOf(\"${1:str}\")", doc: "Returns the index of the first occurrence of the specified substring." },
                { label: "lastIndexOf(str)", insertText: "lastIndexOf(\"${1:str}\")", doc: "Returns the index of the last occurrence of the specified substring." },
                { label: "startsWith(str)", insertText: "startsWith(\"${1:str}\")", doc: "Checks if the string starts with the specified substring." },
                { label: "endsWith(str)", insertText: "endsWith(\"${1:str}\")", doc: "Checks if the string ends with the specified substring." },
                { label: "replaceAll(old, new)", insertText: "replaceAll(\"${1:old}\", \"${2:new}\")", doc: "Replaces all occurrences of a substring with another." },
                { label: "toList(sep)", insertText: "toList(\"${1:,}\")", doc: "Splits the string into a list based on the separator." },
                { label: "toNumber()", insertText: "toNumber()", doc: "Converts the string to a number." },
                { label: "toDecimal()", insertText: "toDecimal()", doc: "Converts the string to a decimal." },
                { label: "toDate()", insertText: "toDate()", doc: "Converts the string to a date." },
                { label: "toDateTime()", insertText: "toDateTime()", doc: "Converts the string to a date-time." },
                { label: "toString()", insertText: "toString()", doc: "Converts the value to a string." },
                { label: "proper()", insertText: "proper()", doc: "Converts the string to proper case (first letter of each word capitalized)." },
                { label: "left(n)", insertText: "left(${1:n})", doc: "Returns the first n characters of the string." },
                { label: "right(n)", insertText: "right(${1:n})", doc: "Returns the last n characters of the string." },
                { label: "mid(start, n)", insertText: "mid(${1:start}, ${2:n})", doc: "Returns n characters starting from the start index." },
                { label: "leftpad(n)", insertText: "leftpad(${1:n})", doc: "Pads the string on the left to length n." },
                { label: "rightpad(n)", insertText: "rightpad(${1:n})", doc: "Pads the string on the right to length n." },
                { label: "reverse()", insertText: "reverse()", doc: "Reverses the string." }
            ],
            list: [
                { label: "add(val)", insertText: "add(${1:val})", doc: "Adds an element to the list." },
                { label: "addAll(otherList)", insertText: "addAll(${1:otherList})", doc: "Adds all elements from another list." },
                { label: "get(index)", insertText: "get(${1:index})", doc: "Returns the element at the specified index." },
                { label: "size()", insertText: "size()", doc: "Returns the number of elements in the list." },
                { label: "isEmpty()", insertText: "isEmpty()", doc: "Checks if the list is empty." },
                { label: "contains(val)", insertText: "contains(${1:val})", doc: "Checks if the list contains the specified value." },
                { label: "remove(index)", insertText: "remove(${1:index})", doc: "Removes the element at the specified index." },
                { label: "clear()", insertText: "clear()", doc: "Removes all elements from the list." },
                { label: "sort(asc)", insertText: "sort(${1:true})", doc: "Sorts the list in ascending or descending order." },
                { label: "distinct()", insertText: "distinct()", doc: "Returns a new list with unique elements." },
                { label: "intersect(otherList)", insertText: "intersect(${1:otherList})", doc: "Returns the intersection of two lists." },
                { label: "subList(start, end)", insertText: "subList(${1:start}, ${2:end})", doc: "Returns a sublist from start index to end index." }
            ],
            map: [
                { label: "put(key, val)", insertText: "put(\"${1:key}\", ${2:val})", doc: "Adds a key-value pair to the map." },
                { label: "putAll(otherMap)", insertText: "putAll(${1:otherMap})", doc: "Adds all entries from another map." },
                { label: "get(key)", insertText: "get(\"${1:key}\")", doc: "Returns the value associated with the specified key." },
                { label: "getJSON(key)", insertText: "getJSON(\"${1:key}\")", doc: "Returns the value as a JSON object." },
                { label: "keys()", insertText: "keys()", doc: "Returns a list of keys in the map." },
                { label: "remove(key)", insertText: "remove(\"${1:key}\")", doc: "Removes the entry for the specified key." },
                { label: "size()", insertText: "size()", doc: "Returns the number of entries in the map." },
                { label: "isEmpty()", insertText: "isEmpty()", doc: "Checks if the map is empty." },
                { label: "containsKey(key)", insertText: "containsKey(\"${1:key}\")", doc: "Checks if the map contains the specified key." },
                { label: "containsValue(val)", insertText: "containsValue(${1:val})", doc: "Checks if the map contains the specified value." },
                { label: "clear()", insertText: "clear()", doc: "Removes all entries from the map." }
            ],
            int: [
                { label: "abs()", insertText: "abs()", doc: "Returns the absolute value." },
                { label: "toDecimal()", insertText: "toDecimal()", doc: "Converts to a decimal." },
                { label: "toString()", insertText: "toString()", doc: "Converts to a string." },
                { label: "toHex()", insertText: "toHex()", doc: "Converts to a hexadecimal string." }
            ],
            decimal: [
                { label: "abs()", insertText: "abs()", doc: "Returns the absolute value." },
                { label: "round(precision)", insertText: "round(${1:2})", doc: "Rounds to the specified number of decimal places." },
                { label: "ceil()", insertText: "ceil()", doc: "Returns the smallest integer greater than or equal to the number." },
                { label: "floor()", insertText: "floor()", doc: "Returns the largest integer less than or equal to the number." },
                { label: "toLong()", insertText: "toLong()", doc: "Converts to a long integer." },
                { label: "toString()", insertText: "toString()", doc: "Converts to a string." }
            ],
            date: [
                { label: "addDay(n)", insertText: "addDay(${1:1})", doc: "Adds n days to the date." },
                { label: "subDay(n)", insertText: "subDay(${1:1})", doc: "Subtracts n days from the date." },
                { label: "addMonth(n)", insertText: "addMonth(${1:1})", doc: "Adds n months to the date." },
                { label: "addYear(n)", insertText: "addYear(${1:1})", doc: "Adds n years to the date." },
                { label: "getDay()", insertText: "getDay()", doc: "Returns the day of the month." },
                { label: "getMonth()", insertText: "getMonth()", doc: "Returns the month (1-12)." },
                { label: "getYear()", insertText: "getYear()", doc: "Returns the year." },
                { label: "toString(format)", insertText: "toString(\"${1:dd-MMM-yyyy}\")", doc: "Converts to a string with the specified format." },
                { label: "toDateTime()", insertText: "toDateTime()", doc: "Converts to a date-time." }
            ],
            datetime: [
                { label: "addHour(n)", insertText: "addHour(${1:1})", doc: "Adds n hours to the date-time." },
                { label: "addMinutes(n)", insertText: "addMinutes(${1:1})", doc: "Adds n minutes to the date-time." },
                { label: "addSeconds(n)", insertText: "addSeconds(${1:1})", doc: "Adds n seconds to the date-time." },
                { label: "getHour()", insertText: "getHour()", doc: "Returns the hour of the day." },
                { label: "getMinutes()", insertText: "getMinutes()", doc: "Returns the minutes." },
                { label: "getSeconds()", insertText: "getSeconds()", doc: "Returns the seconds." },
                { label: "toString(format)", insertText: "toString(\"${1:dd-MMM-yyyy HH:mm:ss}\")", doc: "Converts to a string with the specified format." }
            ],
            common: [
                { label: "isNull()", insertText: "isNull()", doc: "Checks if the value is null." },
                { label: "toString()", insertText: "toString()", doc: "Converts the value to a string." }
            ]
        };

        const MANDATORY_PARAMS = {
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

        // Old Completion Provider logic removed.
        // Replaced by DelugeLsp.js, InterfaceProvider.js, and VariableProvider.js

        function extractVariables(code) {
             const cleanCode = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, group1) => {
                if (group1) return group1;
                return "";
            });

            const varMap = {
                'input': { type: 'Map' },
                'zoho': { type: 'Namespace' },
                'thisapp': { type: 'Namespace' },
                'standalone': { type: 'Namespace' },
                'today': { type: 'Date' },
                'now': { type: 'DateTime' }
            };

            const magicCommentRegex = /\/\/\s*@type\s+([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)/g;
            let match;
            while ((match = magicCommentRegex.exec(code)) !== null) {
                const varName = match[1];
                const interfaceName = match[2];
                varMap[varName] = { type: 'Map', mapping: interfaceName, path: [] };
            }

            const keywords = new Set(['if', 'else', 'for', 'each', 'in', 'return', 'info', 'true', 'false', 'null', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'collection', 'zoho', 'thisapp', 'standalone', 'input', 'today', 'now', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

            const declRegex = /\b(string|int|decimal|boolean|map|list)\s+([a-zA-Z_]\w*)/gi;
            while ((match = declRegex.exec(cleanCode)) !== null) {
                varMap[match[2]] = { type: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() };
            }

            const assignRegex = /([a-zA-Z_]\w*)\s*=\s*([^;]+)/g;
            while ((match = assignRegex.exec(cleanCode)) !== null) {
                const name = match[1];
                const val = match[2].trim();
                if (keywords.has(name)) continue;
                if (!varMap[name]) varMap[name] = { type: 'Object' };
                if (val.startsWith('"') || val.startsWith("'")) varMap[name] = { type: 'String' };
                else if (val.match(/^\d+$/)) varMap[name] = { type: 'Int' };
                else if (val.match(/^\d+\.\d+$/)) varMap[name] = { type: 'Decimal' };
                else if (val.toLowerCase().startsWith('map()')) varMap[name] = { type: 'Map' };
                else if (val.toLowerCase().startsWith('list()')) varMap[name] = { type: 'List' };
                else if (val.toLowerCase().startsWith('collection()')) varMap[name] = { type: 'List' };
                else if (val.toLowerCase().startsWith('invokeurl')) varMap[name] = { type: 'Map' };
                else if (val.startsWith('{')) {
                    varMap[name] = { type: 'Map', isLiteral: true };
                }
                else if (varMap[val]) {
                    varMap[name] = { ...varMap[val] };
                }
            }

            const funcParamRegex = /(?:void|string|int|decimal|boolean|map|list)\s+[a-zA-Z_]\w*\s*\(([^)]*)\)/gi;
            while ((match = funcParamRegex.exec(cleanCode)) !== null) {
                const params = match[1].split(',');
                params.forEach(p => {
                    const parts = p.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const type = parts[0].trim();
                        const name = parts[parts.length - 1].trim();
                        varMap[name] = { type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() };
                    } else if (parts.length === 1 && parts[0]) {
                        varMap[parts[0]] = { type: 'Object' };
                    }
                });
            }

            const forEachRegex = /for\s+each\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)/gi;
            while ((match = forEachRegex.exec(cleanCode)) !== null) {
                varMap[match[1]] = { type: 'Object' };
            }

            const catchRegex = /catch\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
            while ((match = catchRegex.exec(cleanCode)) !== null) {
                varMap[match[1]] = { type: 'Error' };
            }

            return varMap;
        }

        function inferVarType(varName, code) {
            const vars = extractVariables(code);
            return vars[varName] ? vars[varName].type : null;
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

            const varMap = extractVariables(code);

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

                const skipKeywords = ['if', 'for', 'each', 'in', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'true', 'false', 'null'];
                const startsWithKeyword = skipKeywords.some(kw => {
                    const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                    return regex.test(trimmed);
                });
                const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[') || trimmed.toLowerCase().endsWith('invokeurl') || trimmed.toLowerCase().endsWith('sendmail');

                if (!endsWithSpecial && !startsWithKeyword && openBrackets === 0 && openBraces === 0 && openParens === 0) {
                    markers.push({
                        message: 'Missing semicolon',
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: i + 1, startColumn: line.length + 1,
                        endLineNumber: i + 1, endColumn: line.length + 2,
                        code: 'missing-semicolon'
                    });
                }

                const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_\-]*\b/g;
                let wordMatch;
                while ((wordMatch = wordRegex.exec(line)) !== null) {
                    const word = wordMatch[0];
                    const index = wordMatch.index;
                    if (skipKeywords.includes(word)) continue;
                    if (varMap[word]) continue;
                    const before = line.substring(0, index);
                    const after = line.substring(index + word.length);
                    if ((before.match(/"/g) || []).length % 2 === 1 && (after.match(/"/g) || []).length % 2 === 1) continue;
                    if ((before.match(/'/g) || []).length % 2 === 1 && (after.match(/'/g) || []).length % 2 === 1) continue;
                    const restOfLine = after.trim();
                    if (restOfLine.startsWith('(') || restOfLine.startsWith('.') || restOfLine.startsWith(':')) continue;
                    if (restOfLine.startsWith('=')) continue;
                    if (window.interfaceMappings && window.interfaceMappings[word]) continue;

                    markers.push({
                        message: `Undefined variable: '${word}'`,
                        severity: monaco.MarkerSeverity.Warning,
                        startLineNumber: i + 1, startColumn: index + 1,
                        endLineNumber: i + 1, endColumn: index + word.length + 1
                    });
                }

                for (const [fn, count] of Object.entries(MANDATORY_PARAMS)) {
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

                for (const type in typeMethods) {
                    const method = typeMethods[type].find(m => m.label.startsWith(word.word + '('));
                    if (method && method.doc) {
                        return {
                            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                            contents: [
                                { value: `**${method.label}**` },
                                { value: method.doc }
                            ]
                        };
                    }
                }

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
