    function insertSnippet(type) {
        if (!editor) return;
        let snippet = "";
        switch (type) {
            case 'if': snippet = "if (${1:condition}) \n{\n\t$0\n}"; break;
            case 'else if': snippet = "else if (${1:condition}) \n{\n\t$0\n}"; break;
            case 'else': snippet = "else \n{\n\t$0\n}"; break;
            case 'conditional if': snippet = "if(${1:condition}, ${2:true_val}, ${3:false_val})"; break;
            case 'insert': snippet = "insert into ${1:Form}\n[\n\t${2:Field} : ${3:Value}\n];"; break;
            case 'fetch': snippet = "${1:var} = ${2:Form} [ ${3:Criteria} ];"; break;
            case 'aggregate': snippet = "${1:var} = ${2:Form} [ ${3:Criteria} ].count();"; break;
            case 'update': snippet = "${1:Form} [ ${2:Criteria} ]\n{\n\t${3:Field} : ${4:Value}\n};"; break;
            case 'for each': snippet = "for each ${1:var} in ${2:Form} [ ${3:Criteria} ]\n{\n\t$0\n}"; break;
            case 'delete': snippet = "delete from ${1:Form} [ ${2:Criteria} ];"; break;
            case 'list': snippet = "${1:var} = List();"; break;
            case 'add': snippet = "${1:var}.add($0);"; break;
            case 'remove': snippet = "${1:var}.remove(${2:index});"; break;
            case 'clear': snippet = "${1:var}.clear();"; break;
            case 'sort': snippet = "${1:var}.sort(${2:true});"; break;
            case 'map': snippet = "${1:var} = Map();"; break;
            case 'put': snippet = "${1:var}.put(\"${2:key}\", ${3:value});"; break;
            case 'remove_key': snippet = "${1:var}.remove(\"${2:key}\");"; break;
            case 'clear_map': snippet = "${1:var}.clear();"; break;
            case 'variable': snippet = "${1:var} = ${2:value};"; break;
            case 'function': snippet = "thisapp.${1:function_name}($0);"; break;
            case 'mail': snippet = "sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: \"${1:recipient}\"\n\tsubject: \"${2:subject}\"\n\tmessage: \"${3:message}\"\n];"; break;
            case 'info': snippet = "info $0;"; break;
        }

        const selection = editor.getSelection();
        const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);

        // Use snippet controller for better indentation and placeholders
        const contribution = editor.getContribution('snippetController2');
        if (contribution) {
            contribution.insert(snippet, range);
        } else {
            editor.executeEdits("snippet", [{ range: range, text: snippet.replace(/\$\d|\$\{ \d:[^}]+\}/g, ''), forceMoveMarkers: true }]);
        }
        editor.focus();
    }

    document.querySelectorAll('.snippet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-snippet');
            insertSnippet(type);
        });
    });
