with open('deluge-lang.js', 'r') as f:
    content = f.read()

type_methods = r"""        const typeMethods = {
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

get_nested_object = r"""    function getNestedObject(root, path) {
        if (!path) return root;
        const parts = path.match(/\.get(?:JSON)?\(([^)]+)\)/g);
        if (!parts) return root;
        let current = root;
        for (const part of parts) {
            const keyMatch = part.match(/\(([^)]+)\)/);
            if (keyMatch) {
                let key = keyMatch[1].trim();
                if (key.startsWith('"') || key.startsWith("'")) {
                    key = key.substring(1, key.length - 1);
                } else if (!isNaN(key)) {
                    key = parseInt(key);
                }
                if (current && typeof current === 'object') {
                    current = current[key];
                } else {
                    return null;
                }
            }
        }
        return current;
    }"""

if 'const typeMethods' not in content:
    content = content.replace('const staticSuggestions = [', type_methods + '\n\n        const staticSuggestions = [')

if 'function getNestedObject' not in content:
    content = content.replace('function inferVarType', get_nested_object + '\n\n        function inferVarType')

with open('deluge-lang.js', 'w') as f:
    f.write(content)
