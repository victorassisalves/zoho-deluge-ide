import re

with open('ide.js', 'r') as f:
    content = f.read()

new_func = """
    function insertSnippet(type) {
        if (!editor) return;
        let snippet = "";
        switch (type) {
            case 'if': snippet = "if (  ) \\n{\\n\\t\\n}"; break;
            case 'else if': snippet = "else if (  ) \\n{\\n\\t\\n}"; break;
            case 'else': snippet = "else \\n{\\n\\t\\n}"; break;
            case 'conditional if': snippet = "if( , , )"; break;
            case 'insert': snippet = "insert into <Form>\\n[\\n\\t<Field> : <Value>\\n];"; break;
            case 'fetch': snippet = "<var> = <Form> [ <Criteria> ];"; break;
            case 'aggregate': snippet = "<var> = <Form> [ <Criteria> ].count();"; break;
            case 'update': snippet = "<Form> [ <Criteria> ]\\n{\\n\\t<Field> : <Value>\\n};"; break;
            case 'for each': snippet = "for each <var> in <Form> [ <Criteria> ]\\n{\\n\\t\\n}"; break;
            case 'delete': snippet = "delete from <Form> [ <Criteria> ];"; break;
            case 'list': snippet = "<var> = List();"; break;
            case 'add': snippet = "<var>.add();"; break;
            case 'remove': snippet = "<var>.remove();"; break;
            case 'clear': snippet = "<var>.clear();"; break;
            case 'sort': snippet = "<var>.sort();"; break;
            case 'map': snippet = "<var> = Map();"; break;
            case 'put': snippet = "<var>.put(\\\"\\\", \\\"\\\");"; break;
            case 'remove_key': snippet = "<var>.remove(\\\"\\\");"; break;
            case 'clear_map': snippet = "<var>.clear();"; break;
            case 'variable': snippet = "<var> = ;"; break;
            case 'function': snippet = "thisapp.<function_name>();"; break;
            case 'mail': snippet = "sendmail\\n[\\n\\tfrom: zoho.adminuserid\\n\\tto: \\\"\\\"\\n\\tsubject: \\\"\\\"\\n\\tmessage: \\\"\\\"\\n];"; break;
            case 'info': snippet = "info ;"; break;
        }
        if (snippet) {
            const selection = editor.getSelection();
            const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            editor.executeEdits("snippet-insert", [{ range: range, text: snippet, forceMoveMarkers: true }]);
            editor.focus();
        }
    }
"""

# Replace from 'function insertSnippet' to the end of its block
# This is tricky without a parser, but I know the structure.
# I'll look for 'function insertSnippet(type) {' and then the closing '}' which is followed by 'document.querySelectorAll('.snippet-btn')'

start_marker = "function insertSnippet(type) {"
end_marker = "document.querySelectorAll('.snippet-btn')"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # We want to keep the document.querySelectorAll part
    content = content[:start_idx] + new_func + "\n    " + content[end_idx:]

with open('ide.js', 'w') as f:
    f.write(content)
