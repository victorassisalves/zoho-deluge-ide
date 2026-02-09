import sys

file_path = "deluge-lang.js"
with open(file_path, "r") as f:
    content = f.read()

marker_start = "const staticSuggestions = ["
marker_end = "];"

start_idx = content.find(marker_start)
if start_idx != -1:
    # Find the matching ]; after the staticSuggestions block
    # We know it ends before const typeMethods
    type_methods_idx = content.find("const typeMethods = {")
    end_idx = content.rfind("];", start_idx, type_methods_idx) + 2

    new_static = """const staticSuggestions = [
            { label: 'Map()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Map()' },
            { label: 'List()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'List()' },
            { label: 'Collection()', kind: monaco.languages.CompletionItemKind.Constructor, insertText: 'Collection()' },
            { label: 'info', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'info $0', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'for each', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for each ${1:var} in ${2:list} {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'try catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\\n\\t$1\\n} catch (${2:err}) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'void function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void ${1:name}($2) {\\n\\t$0\\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'invokeurl', kind: monaco.languages.CompletionItemKind.Function, insertText: 'invokeurl\\n[\\n\\turl: "$1"\\n\\ttype: ${2|GET,POST,PUT,DELETE|}\\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'sendmail', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'sendmail\\n[\\n\\tfrom: zoho.adminuserid\\n\\tto: "$1"\\n\\tsubject: "$2"\\n\\tmessage: "$3"\\n];', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'today', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'today' },
            { label: 'now', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'now' },
            { label: 'daysBetween', kind: monaco.languages.CompletionItemKind.Function, insertText: 'daysBetween(${1:d1}, ${2:d2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
        ];"""

    content = content[:start_idx] + new_static + content[end_idx:]

with open(file_path, "w") as f:
    f.write(content)
