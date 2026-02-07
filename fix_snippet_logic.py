import json

file_path = 'snippet_logic.js'

snippets = {
    'if': 'if (${1:condition}) \n{\n\t$0\n}',
    'else if': 'else if (${1:condition}) \n{\n\t$0\n}',
    'else': 'else \n{\n\t$0\n}',
    'conditional if': 'if(${1:condition}, ${2:true_val}, ${3:false_val})',
    'insert': 'insert into ${1:Form}\n[\n\t${2:Field} : ${3:Value}\n];',
    'fetch': '${1:var} = ${2:Form} [ ${3:Criteria} ];',
    'aggregate': '${1:var} = ${2:Form} [ ${3:Criteria} ].count();',
    'update': '${1:Form} [ ${2:Criteria} ]\n{\n\t${3:Field} : ${4:Value}\n};',
    'for each': 'for each ${1:var} in ${2:Form} [ ${3:Criteria} ]\n{\n\t$0\n}',
    'delete': 'delete from ${1:Form} [ ${2:Criteria} ];',
    'list': '${1:var} = List();',
    'add': '${1:var}.add($0);',
    'remove': '${1:var}.remove(${2:index});',
    'clear': '${1:var}.clear();',
    'sort': '${1:var}.sort(${2:true});',
    'map': '${1:var} = Map();',
    'put': '${1:var}.put("${2:key}", ${3:value});',
    'remove_key': '${1:var}.remove("${2:key}");',
    'clear_map': '${1:var}.clear();',
    'variable': '${1:var} = ${2:value};',
    'function': 'thisapp.${1:function_name}($0);',
    'mail': 'sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: "${1:recipient}"\n\tsubject: "${2:subject}"\n\tmessage: "${3:message}"\n];',
    'info': 'info $0;'
}

switch_cases = "        switch (type) {\n"
for key, val in snippets.items():
    # Use json.dumps to get a correctly escaped JS string
    js_val = json.dumps(val)
    switch_cases += f"            case '{key}': snippet = {js_val}; break;\n"
switch_cases += "        }"

new_content = f"""    function insertSnippet(type) {{
        if (!editor) return;
        let snippet = "";
{switch_cases}

        const selection = editor.getSelection();
        const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);

        // Use snippet controller for better indentation and placeholders
        const contribution = editor.getContribution('snippetController2');
        if (contribution) {{
            contribution.insert(snippet, range);
        }} else {{
            editor.executeEdits("snippet", [{{ range: range, text: snippet.replace(/\\$\\d|\\$\\{{ \\d:[^}}]+\\}}/g, ''), forceMoveMarkers: true }}]);
        }}
        editor.focus();
    }}

    document.querySelectorAll('.snippet-btn').forEach(btn => {{
        btn.addEventListener('click', () => {{
            const type = btn.getAttribute('data-snippet');
            insertSnippet(type);
        }});
    }});
"""

with open(file_path, 'w') as f:
    f.write(new_content)
