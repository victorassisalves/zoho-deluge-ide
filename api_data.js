const apiLibrary = {
    crm: [
        { title: "Get Records", desc: "Fetch records from a CRM module", code: "zoho.crm.getRecords(\"${1:Module}\", ${2:page}, ${3:per_page})", tags: ["get", "records"] },
        { title: "Get Record by ID", desc: "Fetch a specific record by its ID", code: "zoho.crm.getRecordById(\"${1:Module}\", ${2:id})", tags: ["get", "records"] },
        { title: "Create Record", desc: "Insert a new record into CRM", code: "zoho.crm.createRecord(\"${1:Module}\", ${2:data_map})", tags: ["create", "records"] },
        { title: "Update Record", desc: "Update an existing CRM record", code: "zoho.crm.updateRecord(\"${1:Module}\", ${2:id}, ${3:data_map})", tags: ["update", "records"] },
        { title: "Search Records", desc: "Search records by criteria", code: "zoho.crm.searchRecords(\"${1:Module}\", \"(${2:Criteria})\")", tags: ["search", "records"] },
        { title: "Get Related Records", desc: "Get related records for a specific record", code: "zoho.crm.getRelatedRecords(\"${1:Relation}\", \"${2:Module}\", ${3:id})", tags: ["get", "related"] }
    ],
    books: [
        { title: "Get Invoices", desc: "List all invoices in Books", code: "zoho.books.getRecords(\"Invoices\", \"${1:org_id}\")", tags: ["get", "invoices"] },
        { title: "Get Contact", desc: "Get details of a specific contact", code: "zoho.books.getRecords(\"Contacts\", \"${1:org_id}\", ${2:contact_id})", tags: ["get", "contacts"] },
        { title: "Create Invoice", desc: "Create a new invoice", code: "zoho.books.createRecord(\"Invoices\", \"${1:org_id}\", ${2:data_map})", tags: ["create", "invoices"] }
    ],
    creator: [
        { title: "Add Record", desc: "Add record to a Creator form", code: "insert into ${1:Form}\n[\n\t${2:Field} : ${3:Value}\n];", tags: ["create", "records"] },
        { title: "Fetch Records", desc: "Query records from Creator", code: "${1:var} = ${2:Form} [ ${3:Criteria} ];", tags: ["get", "records"] },
        { title: "Upload File", desc: "Upload a file to a Creator field", code: "zoho.creator.uploadFile(${1:file_var}, \"${2:App_Owner}\", \"${3:App_Link_Name}\", \"${4:Form_Link_Name}\", ${5:Record_ID}, \"${6:Field_Name}\")", tags: ["upload", "file"] }
    ],
    recruit: [
        { title: "Get Candidates", desc: "Fetch candidates from Recruit", code: "zoho.recruit.getRecords(\"Candidates\", ${1:page}, ${2:per_page})", tags: ["get", "candidates"] }
    ]
};

window.initApiExplorer = function() {
    const productSelector = document.getElementById('api-product-selector');
    const searchInput = document.getElementById('api-search');
    const resultsList = document.getElementById('api-results-list');

    if (!productSelector || !searchInput || !resultsList) return;

    function renderResults() {
        const product = productSelector.value;
        const term = searchInput.value.toLowerCase();
        const apis = apiLibrary[product] || [];

        resultsList.innerHTML = '';
        const filtered = apis.filter(api =>
            api.title.toLowerCase().includes(term) ||
            api.desc.toLowerCase().includes(term) ||
            api.tags.some(t => t.toLowerCase().includes(term))
        );

        if (filtered.length === 0) {
            resultsList.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.5;">No matching APIs found.</div>';
            return;
        }

        filtered.forEach(api => {
            const item = document.createElement('div');
            item.className = 'api-item';
            item.innerHTML = `
                <div class="api-item-title">
                    ${api.tags.map(t => `<span class="api-item-tag">${t}</span>`).join('')}
                    ${api.title}
                </div>
                <div class="api-item-desc">${api.desc}</div>
            `;
            item.onclick = () => {
                if (window.editor) {
                    const selection = editor.getSelection();
                    const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
                    const contribution = editor.getContribution('snippetController2');
                    if (contribution) {
                        contribution.insert(api.code, range);
                    } else {
                        editor.executeEdits("api", [{ range: range, text: api.code.replace(/\$\d|\$\{ \d:[^}]+\}/g, ''), forceMoveMarkers: true }]);
                    }
                    editor.focus();
                }
            };
            resultsList.appendChild(item);
        });
    }

    productSelector.addEventListener('change', renderResults);
    searchInput.addEventListener('input', renderResults);
    renderResults();
};
