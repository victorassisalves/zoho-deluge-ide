    function insertSnippet(type) {
        if (!editor) return;
        let snippet = "";

        const selectedForm = document.getElementById('creator-form-selector')?.value || "${1:Form}";

        switch (type) {
            // Condition
            case 'if': snippet = "if (${1:condition}) \n{\n\t$0\n}"; break;
            case 'else if': snippet = "else if (${1:condition}) \n{\n\t$0\n}"; break;
            case 'else': snippet = "else \n{\n\t$0\n}"; break;
            case 'conditional if': snippet = "if(${1:condition}, ${2:true_val}, ${3:false_val})"; break;

            // Data Access
            case 'insert': snippet = "insert into " + selectedForm + "\n[\n\t${2:Field} : ${3:Value}\n];"; break;
            case 'fetch': snippet = "${1:var} = " + selectedForm + " [ ${3:Criteria} ];"; break;
            case 'aggregate': snippet = "${1:var} = " + selectedForm + " [ ${3:Criteria} ].count();"; break;
            case 'update': snippet = selectedForm + " [ ${2:Criteria} ]\n{\n\t${3:Field} : ${4:Value}\n};"; break;
            case 'update_multiple': snippet = selectedForm + " [ ${2:Criteria} ]\n{\n\t${3:Field1} : ${4:Value1},\n\t${5:Field2} : ${6:Value2}\n};"; break;
            case 'for each': snippet = "for each ${1:var} in " + selectedForm + " [ ${3:Criteria} ]\n{\n\t$0\n}"; break;
            case 'delete': snippet = "delete from " + selectedForm + " [ ${2:Criteria} ];"; break;

            // Collection (Removing some semicolons for expression use)
            case 'collection_create': snippet = "${1:var} = Collection();"; break;
            case 'collection_insert': snippet = "${1:var}.insert(${2:value});"; break;
            case 'collection_get': snippet = "${1:var}.get(${2:index})"; break; // No semicolon
            case 'collection_insert_all': snippet = "${1:var}.insertAll(${2:other_collection});"; break;
            case 'collection_update': snippet = "${1:var}.update(${2:index}, ${3:new_value});"; break;
            case 'collection_delete': snippet = "${1:var}.delete(${2:index});"; break;
            case 'collection_keys': snippet = "${1:var}.keys()"; break; // No semicolon
            case 'collection_values': snippet = "${1:var}.values()"; break; // No semicolon
            case 'collection_contains_key': snippet = "${1:var}.containsKey(${2:key})"; break; // No semicolon
            case 'collection_contains_value': snippet = "${1:var}.containsValue(${2:value})"; break; // No semicolon
            case 'collection_clear': snippet = "${1:var}.clear();"; break;
            case 'collection_sort': snippet = "${1:var}.sort();"; break;
            case 'collection_is_empty': snippet = "${1:var}.isEmpty()"; break; // No semicolon
            case 'collection_size': snippet = "${1:var}.size()"; break; // No semicolon

            // List Manipulation
            case 'list': snippet = "${1:var} = List();"; break;
            case 'add': snippet = "${1:var}.add($0);"; break;
            case 'remove': snippet = "${1:var}.remove(${2:index});"; break;
            case 'remove_element': snippet = "${1:var}.removeElement(${2:value});"; break;
            case 'add_all': snippet = "${1:var}.addAll(${2:other_list});"; break;
            case 'clear': snippet = "${1:var}.clear();"; break;
            case 'sort': snippet = "${1:var}.sort(${2:true});"; break;
            case 'for_each_element': snippet = "for each ${1:item} in ${2:list}\n{\n\t$0\n}"; break;
            case 'for_each_index': snippet = "for ${1:i} in ${2:list}\n{\n\t$0\n}"; break;

            // Map Manipulation
            case 'map': snippet = "${1:var} = Map();"; break;
            case 'put': snippet = "${1:var}.put(\"${2:key}\", ${3:value});"; break;
            case 'put_all': snippet = "${1:var}.putAll(${2:other_map});"; break;
            case 'remove_key': snippet = "${1:var}.remove(\"${2:key}\");"; break;
            case 'clear_map': snippet = "${1:var}.clear();"; break;

            // Web Data
            case 'zoho_integration': snippet = "zoho.${1:product}.${2:operation}($0)"; break; // Removed semicolon
            case 'other_integration': snippet = "invokeurl\n[\n\turl: \"${1:url}\"\n\ttype: ${2|GET,POST,PUT,DELETE|}\n\theaders: ${3:header_map}\n\tparameters: ${4:param_map}\n];"; break;
            case 'get_url': snippet = "geturl(\"${1:url}\")"; break; // No semicolon
            case 'post_url': snippet = "posturl(\"${1:url}\", ${2:data_map})"; break; // No semicolon
            case 'invoke_url': snippet = "invokeurl\n[\n\turl: \"${1:url}\"\n\ttype: ${2|GET,POST,PUT,DELETE|}\n];"; break;
            case 'open_url': snippet = "openurl(\"${1:url}\", \"${2|same window,new window,parent window,popup window|}\");"; break;
            case 'invoke_api': snippet = "thisapp.invokeAPI(\"${1:api_name}\", ${2:param_map});"; break;
            case 'ftp': snippet = "zoho.ftp.upload(\"${1:connection}\", \"${2:path}\", ${3:file});"; break;

            // XML
            case 'xpath': snippet = "${1:xml_var}.executeXPath(\"${2:xpath_expression}\")"; break; // No semicolon

            // Miscellaneous
            case 'variable': snippet = "${1:var} = ${2:value};"; break;
            case 'function': snippet = "thisapp.${1:function_name}($0);"; break;
            case 'mail': snippet = "sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: \"${1:recipient}\"\n\tsubject: \"${2:subject}\"\n\tmessage: \"${3:message}\"\n];"; break;
            case 'add_comment': snippet = "// ${1:TODO: your comment here}"; break;
            case 'return': snippet = "return $0;"; break;
            case 'info': snippet = "info $0;"; break;
        }

        const selection = editor.getSelection();
        const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);

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

    const fetchBtn = document.getElementById('fetch-creator-forms-btn');
    const formSelector = document.getElementById('creator-form-selector');

    if (fetchBtn) {
        fetchBtn.addEventListener('click', () => {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                fetchBtn.innerText = 'Fetching...';
                chrome.runtime.sendMessage({ action: 'GET_CREATOR_FORMS' }, (response) => {
                    fetchBtn.innerText = 'Fetch Creator Forms';
                    if (response && response.forms && response.forms.length > 0) {
                        formSelector.innerHTML = '';
                        response.forms.forEach(form => {
                            const opt = document.createElement('option');
                            opt.value = form;
                            opt.innerText = form;
                            formSelector.appendChild(opt);
                        });
                        formSelector.style.display = 'block';
                    } else {
                        alert('No forms found. Make sure you are on a Zoho Creator Builder page.');
                    }
                });
            }
        });
    }
