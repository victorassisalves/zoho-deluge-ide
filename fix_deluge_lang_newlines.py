import sys

file_path = "deluge-lang.js"
with open(file_path, "r") as f:
    content = f.read()

# Replace actual newlines within single-quoted strings in staticSuggestions and typeMethods
# This is a bit tricky with regex, so I'll just rewrite the blocks correctly using raw strings in Python.

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
        ];"""

# Note: for insertText, I want the string in the file to have literal \n
# So in Python raw string r"\n" will put \ and n in the file.
# That is what I want.

import re
# Match from const staticSuggestions until ];
content = re.sub(r"const staticSuggestions = \[.*?\];", new_static_suggestions, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
