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
        // --- User Configuration ---
        // Add your own methods here to have them appear in autocomplete
        const userMethods = {
            // example: [ { label: 'myMethod()', insertText: 'myMethod()', doc: 'My custom method' } ]
        };

                        const staticSuggestions = [
            { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
            { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
            { label: 'Collection()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Collection()' },
            { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition})\n{\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list}\n{\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try\n{\n\t$1\n}\ncatch (${2:err})\n{\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2)\n{\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\n[\n\turl: "$1"\n\ttype: ${2|GET,POST,PUT,DELETE,PATCH|}\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'sendmail', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: "$1"\n\tsubject: "$2"\n\tmessage: "$3"\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'daysBetween', kind: monaco.languages.CompletionItemKind.Function, insertText: 'daysBetween(${1:d1}, ${2:d2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
        ];

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
            ],
            zoho: [
                { label: 'zoho.crm.getRecordById(module, id)', insertText: 'crm.getRecordById("${1:Leads}", ${2:id})' },
                { label: 'zoho.crm.updateRecord(module, id, map)', insertText: 'crm.updateRecord("${1:Leads}", ${2:id}, ${3:dataMap})' },
                { label: 'zoho.crm.createRecord(module, map)', insertText: 'crm.createRecord("${1:Leads}", ${2:dataMap})' },
                { label: 'zoho.crm.searchRecords(module, criteria)', insertText: 'crm.searchRecords("${1:Leads}", "(${2:Email} == \'${3:test@example.com}\')")' },
                { label: 'zoho.books.getRecords(module, orgId)', insertText: 'books.getRecords("${1:Invoices}", "${2:organization_id}")' },
                { label: 'zoho.books.createRecord(module, orgId, map)', insertText: 'books.createRecord("${1:Invoices}", "${2:organization_id}", ${3:dataMap})' },
                { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'recruit.getRecordById("${1:Candidates}", ${2:id})' },
                { label: 'zoho.recruit.updateRecord(module, id, map)', insertText: 'recruit.updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
            ],
            crm: [
                { label: 'getRecordById(module, id)', insertText: 'getRecordById("${1:Leads}", ${2:id})' },
                { label: 'getRecords(module, page, per_page)', insertText: 'getRecords("${1:Leads}", ${2:1}, ${3:20})' },
                { label: 'searchRecords(module, criteria)', insertText: 'searchRecords("${1:Leads}", "(${2:Email} == \'${3:test@example.com}\')")' },
                { label: 'createRecord(module, map)', insertText: 'createRecord("${1:Leads}", ${2:dataMap})' },
                { label: 'updateRecord(module, id, map)', insertText: 'updateRecord("${1:Leads}", ${2:id}, ${3:dataMap})' },
                { label: 'getRelatedRecords(relation, module, id)', insertText: 'getRelatedRecords("${1:Relation}", "${2:Leads}", ${3:id})' }
            ],
            books: [
                { label: 'getRecords(module, orgId)', insertText: 'getRecords("${1:Invoices}", "${2:organization_id}")' },
                { label: 'createRecord(module, orgId, map)', insertText: 'createRecord("${1:Invoices}", "${2:organization_id}", ${3:dataMap})' }
            ],
            creator: [
                { label: 'uploadFile(file, owner, app, form, id, field)', insertText: 'uploadFile(${1:file_var}, "${2:Owner}", "${3:App}", "${4:Form}", ${5:id}, "${6:Field}")' },
                { label: 'getRecords(owner, app, report, criteria, page, size, conn)', insertText: 'getRecords("${1:Owner}", "${2:App}", "${3:Report}", "${4:Criteria}", ${5:1}, ${6:100}, "${7:Connection}")' }
            ],
            recruit: [
                { label: 'getRecords(module, page, per_page)', insertText: 'getRecords("${1:Candidates}", ${2:1}, ${3:20})' },
                { label: 'getRecordById(module, id)', insertText: 'getRecordById("${1:Candidates}", ${2:id})' },
                { label: 'updateRecord(module, id, map)', insertText: 'updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
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

        monaco.languages.registerCompletionItemProvider('deluge', {
            triggerCharacters: ['.', '"', "'", '/'],
            provideCompletionItems: (model, position) => {
                const lineUntilPos = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                const code = model.getValue();
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: model.getWordUntilPosition(position).startColumn,
                    endColumn: position.column
                };

                // 1. Interface Manager Autocomplete (Auto-Trigger on Get or Dot)
                // We use \b to ensure we match whole variable names
                const interfaceGetMatch = lineUntilPos.match(/\b([a-zA-Z_]\w*)\s*((?:\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"][^'"]*['"]|\d+)\s*\))*)\s*\.\s*get(?:JSON)?\s*\(\s*['"]([^'"]*)$/);
                const interfaceDotMatch = lineUntilPos.match(/\b([a-zA-Z_]\w*)\s*((?:\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"][^'"]*['"]|\d+)\s*\))*)\s*\.\s*([a-zA-Z_]\w*)?$/);

                if (interfaceGetMatch || interfaceDotMatch) {
                    const isDot = !!interfaceDotMatch;
                    const match = isDot ? interfaceDotMatch : interfaceGetMatch;
                    const varName = match[1];
                    const path = match[2];

                    const varMap = extractVariables(code);
                    const varInfo = varMap[varName];
                    const mappings = window.interfaceMappings || {};

                    let mappingName = (varInfo && typeof varInfo === 'object' && varInfo.mapping) ? varInfo.mapping : (mappings[varName] ? varName : null);
                    let initialPath = (varInfo && typeof varInfo === 'object' && varInfo.path) ? varInfo.path : [];

                    if (mappingName && mappings[mappingName]) {
                        let currentObj = mappings[mappingName];
                        for (const p of initialPath) {
                            if (currentObj) currentObj = currentObj[p];
                        }
                        const pathParts = path.match(/\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/g) || [];
                        for (const part of pathParts) {
                            const keyMatch = part.match(/\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/);
                            if (keyMatch && currentObj && typeof currentObj === 'object') {
                                const key = keyMatch[1] !== undefined ? keyMatch[1] : keyMatch[2];
                                currentObj = currentObj[key];
                            }
                        }

                        if (currentObj && typeof currentObj === 'object') {
                            let suggestions = [];
                            let prefix = "";
                            let type = Array.isArray(currentObj) ? 'list' : 'map';

                            // 1. Key Suggestions
                            let objForKeys = null;
                            if (type === 'list') {
                                if (currentObj.length > 0 && typeof currentObj[0] === 'object' && currentObj[0] !== null) {
                                    objForKeys = currentObj[0];
                                    prefix = "get(0).";
                                }
                            } else {
                                objForKeys = currentObj;
                            }

                            if (objForKeys && typeof objForKeys === 'object' && !Array.isArray(objForKeys)) {
                                Object.keys(objForKeys).forEach(key => {
                                    const val = objForKeys[key];
                                    const isComplex = typeof val === 'object' && val !== null;
                                    const method = isComplex ? 'getJSON' : 'get';

                                    suggestions.push({
                                        label: key,
                                        kind: monaco.languages.CompletionItemKind.Property,
                                        detail: (isComplex ? (Array.isArray(val) ? 'List' : 'Map') : typeof val) + " (Interface)",
                                        insertText: isDot ? `${prefix}${method}("${key}")` : key,
                                        sortText: '00' + key,
                                        range: isDot ? {
                                            startLineNumber: position.lineNumber,
                                            endLineNumber: position.lineNumber,
                                            startColumn: match.index + match[0].lastIndexOf('.') + 2,
                                            endColumn: position.column
                                        } : range,
                                        command: { id: 'editor.action.triggerSuggest', title: 'Re-trigger' }
                                    });
                                });
                            }

                            // 2. Method Suggestions (Only if it's a dot trigger)
                            if (isDot) {
                                const methods = typeMethods[type] || [];
                                const common = typeMethods.common || [];
                                [...methods, ...common].forEach((m, index) => {
                                    suggestions.push({
                                        ...m,
                                        kind: monaco.languages.CompletionItemKind.Method,
                                        detail: m.doc + " (Method)",
                                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                        sortText: '01' + (m.label === 'isNull()' || m.label === 'toString()' ? 'zzz' : String.fromCharCode(97 + index)),
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            endLineNumber: position.lineNumber,
                                            startColumn: match.index + match[0].lastIndexOf('.') + 2,
                                            endColumn: position.column
                                        }
                                    });
                                });
                            }

                            if (suggestions.length > 0) {
                                return { suggestions };
                            }
                        }
                    }
                }

                // 2. Zoho suggestions (handle zoho. and zoho.crm. etc)
                if (lineUntilPos.match(/zoho\.[a-zA-Z0-9_.]*$/)) {
                    const parts = lineUntilPos.split('.');
                    const lastPart = parts[parts.length - 1];
                    const isDirectZoho = parts.length === 2 && lastPart === '';

                    let suggestions = [];
                    if (isDirectZoho) {
                        // Sub-namespaces
                        suggestions = [
                            { label: 'crm', kind: monaco.languages.CompletionItemKind.Module, insertText: 'crm.' },
                            { label: 'books', kind: monaco.languages.CompletionItemKind.Module, insertText: 'books.' },
                            { label: 'creator', kind: monaco.languages.CompletionItemKind.Module, insertText: 'creator.' },
                            { label: 'recruit', kind: monaco.languages.CompletionItemKind.Module, insertText: 'recruit.' },
                            { label: 'currenttime', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'currenttime' },
                            { label: 'currentdate', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'currentdate' },
                            { label: 'adminuserid', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'adminuserid' }
                        ];
                        // Add legacy methods too
                        suggestions = suggestions.concat(typeMethods.zoho.map(m => ({
                            ...m,
                            kind: monaco.languages.CompletionItemKind.Function
                        })));
                    } else {
                        const namespace = parts[1];
                        const methods = typeMethods[namespace] || [];
                        suggestions = methods.map(m => ({
                            ...m,
                            kind: monaco.languages.CompletionItemKind.Method
                        }));
                    }

                    if (suggestions.length > 0) {
                        return {
                            suggestions: suggestions.map(s => ({
                                ...s,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                range: range
                            }))
                        };
                    }
                }

                // 3. Method Suggestion after a dot (generic)
                const dotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\.$/);
                if (dotMatch) {
                    const varName = dotMatch[1];
                    if (varName !== 'zoho') {
                        const type = inferVarType(varName, code) || 'map';
                        const methods = typeMethods[type.toLowerCase()] || typeMethods.map;
                        const common = typeMethods.common || [];
                        const user = userMethods[type.toLowerCase()] || [];

                        return {
                            suggestions: [...methods, ...user, ...common].map((m, index) => ({
                                ...m,
                                kind: monaco.languages.CompletionItemKind.Method,
                                detail: m.doc,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                range: range,
                                sortText: (m.label === 'isNull()' || m.label === 'toString()') ? 'zzz' : String.fromCharCode(97 + index)
                            }))
                        };
                    }
                }

                // 4. My Snippets (handle / trigger)
                const mySnippetMatch = lineUntilPos.match(/(?:^|\s)\/([a-zA-Z0-9_]*)$/);
                if (mySnippetMatch) {
                    const triggerText = mySnippetMatch[1];
                    const slashIndex = lineUntilPos.lastIndexOf('/' + triggerText);
                    const textBeforeSlash = lineUntilPos.substring(0, slashIndex);

                    // Avoid triggering inside comments or strings (naive but effective for common cases)
                    const isComment = textBeforeSlash.includes('//') || textBeforeSlash.includes('/*');
                    const isString = (textBeforeSlash.match(/"/g) || []).length % 2 !== 0 || (textBeforeSlash.match(/'/g) || []).length % 2 !== 0;

                    if (!isComment && !isString) {
                        const snippets = window.mySnippets || [];
                        return {
                            suggestions: snippets.map(s => ({
                                label: '/' + s.trigger,
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                detail: s.name + (s.comments ? ` - ${s.comments}` : ""),
                                documentation: { value: "```deluge\n" + s.code + "\n```" },
                                insertText: s.code,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                range: {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: slashIndex + 1,
                                    endColumn: position.column
                                }
                            }))
                        };
                    }
                }

                // 5. Default suggestions
                const varMap = extractVariables(code);
                const varSuggestions = Object.keys(varMap).map(v => ({
                    label: v,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    detail: varMap[v].type + (varMap[v].mapping ? ` (Mapped: ${varMap[v].mapping})` : ""),
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
            // Robustly remove comments while preserving strings (to avoid strings with // breaking things)
            const cleanCode = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, group1) => {
                if (group1) return group1; // Keep the string
                return ""; // Remove the comment
            });

            const varMap = {
                'input': { type: 'Map' },
                'zoho': { type: 'Namespace' },
                'thisapp': { type: 'Namespace' },
                'standalone': { type: 'Namespace' },
                'today': { type: 'Date' },
                'now': { type: 'DateTime' }
            };

            // 0. Magic Comment Bindings: // @type myVar : InterfaceName
            const magicCommentRegex = /\/\/\s*@type\s+([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)/g;
            let match;
            while ((match = magicCommentRegex.exec(code)) !== null) {
                const varName = match[1];
                const interfaceName = match[2];
                varMap[varName] = { type: 'Map', mapping: interfaceName, path: [] };
            }

            // 0.1 Interface Mappings (Global/Legacy)
            if (window.interfaceMappings) {
                for (const name in window.interfaceMappings) {
                    if (!varMap[name]) {
                        varMap[name] = { type: 'Map', mapping: name, path: [] };
                    }
                }
            }

            const keywords = new Set(['if', 'else', 'for', 'each', 'in', 'return', 'info', 'true', 'false', 'null', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'collection', 'zoho', 'thisapp', 'standalone', 'input', 'today', 'now', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

            // 1. Explicit Declarations: string name = "..."
            const declRegex = /\b(string|int|decimal|boolean|map|list)\s+([a-zA-Z_]\w*)/gi;
            while ((match = declRegex.exec(cleanCode)) !== null) {
                varMap[match[2]] = { type: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() };
            }

            // 2. Assignments: name = ...
            const assignRegex = /([a-zA-Z_]\w*)\s*=\s*([^;]+)/g;
            while ((match = assignRegex.exec(cleanCode)) !== null) {
                const name = match[1];
                const val = match[2].trim();
                if (keywords.has(name)) continue;

                // Initialize as Object to ensure it's recognized even if type inference fails
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
                    // Basic literal key extraction for dynamic autocomplete
                    const keysMatch = val.match(/['"]([^'"]+)['"]\s*:/g);
                    if (keysMatch) {
                        const literalMapping = {};
                        keysMatch.forEach(k => {
                            const key = k.match(/['"]([^'"]+)['"]/)[1];
                            literalMapping[key] = "Object";
                        });
                        if (!window.interfaceMappings) window.interfaceMappings = {};
                        const mappingName = `_literal_${name}`;
                        window.interfaceMappings[mappingName] = literalMapping;
                        varMap[name].mapping = mappingName;
                        varMap[name].path = [];
                    }
                }

                // Trace assignments from other variables: data = resp.get("data")
                const getMatch = val.match(/\b([a-zA-Z_]\w*)\s*((?:\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"][^'"]*['"]|\d+)\s*\))+)\s*$/);
                if (getMatch) {
                    const sourceVar = getMatch[1];
                    const pathStr = getMatch[2];
                    const sourceInfo = varMap[sourceVar] || (window.interfaceMappings && window.interfaceMappings[sourceVar] ? { mapping: sourceVar, path: [] } : null);

                    if (sourceInfo && (sourceInfo.mapping || (window.interfaceMappings && window.interfaceMappings[sourceVar]))) {
                        const mappingName = sourceInfo.mapping || sourceVar;
                        const newPath = [...(sourceInfo.path || [])];
                        const pathParts = pathStr.match(/\s*\.\s*get(?:JSON)?\s*\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/g) || [];
                        for (const part of pathParts) {
                            const keyMatch = part.match(/\(\s*(?:['"]([^'"]*)['"]|(\d+))\s*\)/);
                            if (keyMatch) {
                                const key = keyMatch[1] !== undefined ? keyMatch[1] : keyMatch[2];
                                newPath.push(key);
                            }
                        }
                        varMap[name] = { type: 'Map', mapping: mappingName, path: newPath };
                    }
                } else if (varMap[val]) {
                    // Direct assignment: v2 = v1
                    varMap[name] = { ...varMap[val] };
                }
            }

            // 3. Function params
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

            // 4. Loops
            const forEachRegex = /for\s+each\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)/gi;
            while ((match = forEachRegex.exec(cleanCode)) !== null) {
                varMap[match[1]] = { type: 'Object' };
            }

            // 5. Catch
            const catchRegex = /catch\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
            while ((match = catchRegex.exec(cleanCode)) !== null) {
                varMap[match[1]] = { type: 'Error' };
            }

            // 6. Heuristics from usage
            const methodUsageRegex = /([a-zA-Z_]\w*)\.(put|get|keys|remove|size|isEmpty|containsKey|containsValue|clear|add|addAll|sort|distinct)\(/g;
            while ((match = methodUsageRegex.exec(cleanCode)) !== null) {
                const name = match[1];
                const method = match[2];
                if (keywords.has(name) || (varMap[name] && varMap[name].type && varMap[name].type !== 'Object')) continue;

                if (['put', 'keys', 'containsKey', 'containsValue'].includes(method)) varMap[name] = { type: 'Map' };
                else if (['add', 'addAll', 'sort', 'distinct'].includes(method)) varMap[name] = { type: 'List' };
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

            // 1. Collect defined variables
            const varMap = extractVariables(code);

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

                const skipKeywords = ['if', 'for', 'each', 'in', 'else', 'try', 'catch', 'void', 'string', 'int', 'decimal', 'boolean', 'map', 'list', 'break', 'continue', 'return', 'info', 'invokeurl', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'true', 'false', 'null'];
                const startsWithKeyword = skipKeywords.some(kw => {
                    const regex = new RegExp('^' + kw + '(\\s|\\(|$)', 'i');
                    return regex.test(trimmed);
                });
                const endsWithSpecial = trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('[') || trimmed.toLowerCase().endsWith('invokeurl') || trimmed.toLowerCase().endsWith('sendmail');

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
                // Use a regex that respects word boundaries and ignores matches inside strings
                const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_\-]*\b/g;
                let wordMatch;
                while ((wordMatch = wordRegex.exec(line)) !== null) {
                    const word = wordMatch[0];
                    const index = wordMatch.index;

                    if (skipKeywords.includes(word)) continue;
                    if (varMap[word]) continue;

                    // Check if it's part of a string
                    const before = line.substring(0, index);
                    const after = line.substring(index + word.length);
                    if ((before.match(/"/g) || []).length % 2 === 1 && (after.match(/"/g) || []).length % 2 === 1) continue;
                    if ((before.match(/'/g) || []).length % 2 === 1 && (after.match(/'/g) || []).length % 2 === 1) continue;

                    // Check if it's followed by ( or . (might be a function/namespace) or : (a key)
                    const restOfLine = after.trim();
                    if (restOfLine.startsWith('(') || restOfLine.startsWith('.') || restOfLine.startsWith(':')) continue;

                    // If it's on the left of =, it's being defined now
                    if (restOfLine.startsWith('=')) continue;

                    // If it's part of a mapping name, it's valid
                    if (window.interfaceMappings && window.interfaceMappings[word]) continue;

                    markers.push({
                        message: `Undefined variable: '${word}'`,
                        severity: monaco.MarkerSeverity.Warning,
                        startLineNumber: i + 1, startColumn: index + 1,
                        endLineNumber: i + 1, endColumn: index + word.length + 1
                    });
                }

                // Mandatory Parameter Check
                for (const [fn, count] of Object.entries(MANDATORY_PARAMS)) {
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

                // Try to find method documentation
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
