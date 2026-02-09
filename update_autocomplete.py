import sys

file_path = "deluge-lang.js"
with open(file_path, "r") as f:
    content = f.read()

autocomplete_code = """
        const staticSuggestions = [
            { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
            { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
            { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\\n\\t$1\\n} catch (${2:err}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\\n[\\n\\turl: "$1"\\n\\ttype: ${2|GET,POST,PUT,DELETE|}\\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
        ];

        const typeMethods = {
            string: [
                { label: 'length()', insertText: 'length()' },
                { label: 'subString(start, end)', insertText: 'subString(${1:start}, ${2:end})' },
                { label: 'toLowerCase()', insertText: 'toLowerCase()' },
                { label: 'toUpperCase()', insertText: 'toUpperCase()' },
                { label: 'trim()', insertText: 'trim()' },
                { label: 'toList(sep)', insertText: 'toList("${1:,}")' }
            ],
            list: [
                { label: 'add(val)', insertText: 'add(${1:val})' },
                { label: 'get(index)', insertText: 'get(${1:index})' },
                { label: 'size()', insertText: 'size()' },
                { label: 'contains(val)', insertText: 'contains(${1:val})' },
                { label: 'isEmpty()', insertText: 'isEmpty()' }
            ],
            map: [
                { label: 'put(key, val)', insertText: 'put("${1:key}", ${2:val})' },
                { label: 'get(key)', insertText: 'get("${1:key}")' },
                { label: 'getJSON(key)', insertText: 'getJSON("${1:key}")' },
                { label: 'keys()', insertText: 'keys()' },
                { label: 'remove(key)', insertText: 'remove("${1:key}")' }
            ],
            zoho: [
                { label: 'zoho.crm.getRecordById(module, id)', insertText: 'zoho.crm.getRecordById("${1:Leads}", ${2:id})' },
                { label: 'zoho.crm.updateRecord(module, id, map)', insertText: 'zoho.crm.updateRecord("${1:Leads}", ${2:id}, ${3:dataMap})' },
                { label: 'zoho.crm.createRecord(module, map)', insertText: 'zoho.crm.createRecord("${1:Leads}", ${2:dataMap})' },
                { label: 'zoho.crm.searchRecords(module, criteria)', insertText: 'zoho.crm.searchRecords("${1:Leads}", "(${2:Email} == \\\'${3:test@example.com}\\\')")' },
                { label: 'zoho.books.getRecords(module, orgId)', insertText: 'zoho.books.getRecords("${1:Invoices}", "${2:organization_id}")' },
                { label: 'zoho.books.createRecord(module, orgId, map)', insertText: 'zoho.books.createRecord("${1:Invoices}", "${2:organization_id}", ${3:dataMap})' },
                { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'zoho.recruit.getRecordById("${1:Candidates}", ${2:id})' }
            ]
        };

        monaco.languages.registerCompletionItemProvider(\'deluge\', {
            triggerCharacters: [\'.\', \'"\'],
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

                // Method Suggestion after a dot
                const dotMatch = lineUntilPos.match(/([a-zA-Z0-9_]+)\\.$/);
                if (dotMatch) {
                    const varName = dotMatch[1];
                    const type = inferVarType(varName, code) || \'map\';
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
                if (lineUntilPos.endsWith(\'zoho.\')) {
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
                return {
                    suggestions: staticSuggestions.map(s => ({
                        ...s,
                        range: range
                    }))
                };
            }
        });
"""

# Insert after setMonarchTokensProvider
marker = "monaco.languages.setMonarchTokensProvider('deluge',"
# Find the end of the setMonarchTokensProvider call
tokenizer_start = content.find(marker)
comment_block_idx = content.find("comment_block:", tokenizer_start)
insert_pos = content.find("});", comment_block_idx) + 3

new_content = content[:insert_pos] + autocomplete_code + content[insert_pos:]

with open(file_path, "w") as f:
    f.write(new_content)
