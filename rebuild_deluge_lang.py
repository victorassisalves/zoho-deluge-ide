import re

file_path = 'deluge-lang.js'
with open(file_path, 'r') as f:
    content = f.read()

# We need to find the staticSuggestions and typeMethods block and fix it.
# It starts around 'const staticSuggestions = [' and ends at 'zoho: [' or where it's broken.

new_block = """            const staticSuggestions = [
                { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
                { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
                { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                { label: 'if else', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\\n\\t$2\\n} else {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
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
                    { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'zoho.recruit.getRecordById("${1:Candidates}", ${2:id})' },
                    { label: 'zoho.recruit.updateRecord(module, id, map)', insertText: 'zoho.recruit.updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
                ]
            };"""

# Find the start of staticSuggestions and end of typeMethods
start_idx = content.find("const staticSuggestions = [")
# Find where the old typeMethods used to end, which is before "// 1. JSON Autocomplete"
end_marker = "// 1. JSON Autocomplete"
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_block + "\n\n            " + content[end_idx:]

with open(file_path, 'w') as f:
    f.write(content)
