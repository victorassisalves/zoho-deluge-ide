import sys

file_path = "deluge-lang.js"
with open(file_path, "r") as f:
    content = f.read()

# We want the file to have: insertText: 'if (${1:condition}) {\n\t$0\n}'
# So in Python, we need to write the string so it contains backslash-n.

new_static_suggestions = r"""        const staticSuggestions = [
            { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
            { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
            { label: 'Collection()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Collection()' },
            { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\n\t$1\n} catch (${2:err}) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2) {\n\t$0\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\n[\n\turl: "$1"\n\ttype: ${2|GET,POST,PUT,DELETE|}\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'sendmail', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: "$1"\n\tsubject: "$2"\n\tmessage: "$3"\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'today', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'today' },
            { label: 'now', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'now' },
            { label: 'daysBetween', kind: monaco.languages.CompletionItemKind.Function, insertText: 'daysBetween(${1:d1}, ${2:d2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
        ];""".replace('\n', '\\n').replace('        ', '')

# Wait, the replace('\n', '\\n') will make it one long line.
# Let's do it better.

import re
# Match the block
content = re.sub(r"const staticSuggestions = \[.*?\];",
                 "const staticSuggestions = [\n" +
                 "            { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },\n" +
                 "            { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },\n" +
                 "            { label: 'Collection()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Collection()' },\n" +
                 "            { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },\n" +
                 "            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\\n\\t$1\\n} catch (${2:err}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\\n[\\n\\turl: \"$1\"\\n\\ttype: ${2|GET,POST,PUT,DELETE|}\\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'sendmail', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'sendmail\\n[\\n\\tfrom: zoho.adminuserid\\n\\tto: \"$1\"\\n\\tsubject: \"$2\"\\n\\tmessage: \"$3\"\\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },\n" +
                 "            { label: 'today', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'today' },\n" +
                 "            { label: 'now', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'now' },\n" +
                 "            { label: 'daysBetween', kind: monaco.languages.CompletionItemKind.Function, insertText: 'daysBetween(${1:d1}, ${2:d2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }\n" +
                 "        ];",
                 content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
