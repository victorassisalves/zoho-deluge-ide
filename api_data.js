const apiLibrary = {
    crm: [
        { group: "Deluge Tasks", items: [
            { title: "Get Record by ID", desc: "Fetch a specific CRM record", code: "zoho.crm.getRecordById(\"${1:Module}\", ${2:id})", tags: ["get"] },
            { title: "Get Records", desc: "List records with pagination", code: "zoho.crm.getRecords(\"${1:Module}\", ${2:page}, ${3:per_page})", tags: ["get", "list"] },
            { title: "Search Records", desc: "Search using criteria", code: "zoho.crm.searchRecords(\"${1:Module}\", \"(${2:Criteria})\")", tags: ["search"] },
            { title: "Create Record", desc: "Insert a new record", code: "zoho.crm.createRecord(\"${1:Module}\", ${2:data_map})", tags: ["create"] },
            { title: "Update Record", desc: "Modify an existing record", code: "zoho.crm.updateRecord(\"${1:Module}\", ${2:id}, ${3:data_map})", tags: ["update"] },
            { title: "Get Related Records", desc: "Get children records", code: "zoho.crm.getRelatedRecords(\"${1:Relation}\", \"${2:Module}\", ${3:id})", tags: ["get", "related"] }
        ]},
        { group: "REST API v8 (invokeurl)", items: [
            { title: "List Records", desc: "GET /crm/v8/{module}", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v8/${1:Module_API_Name}\"\n\ttype: GET\n\tconnection: \"${2:crm_connection}\"\n];", tags: ["rest", "v8"] },
            { title: "Get Record", desc: "GET /crm/v8/{module}/{id}", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v8/${1:Module}/${2:id}\"\n\ttype: GET\n\tconnection: \"${3:crm_connection}\"\n];", tags: ["rest", "v8"] },
            { title: "Upsert Record", desc: "POST /crm/v8/{module}/upsert", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v8/${1:Module}/upsert\"\n\ttype: POST\n\tparameters: ${2:data_map}.toString()\n\tconnection: \"${3:crm_connection}\"\n];", tags: ["rest", "v8", "upsert"] }
        ]}
    ],
    books: [
        { group: "Deluge Tasks", items: [
            { title: "Get Invoices", desc: "List all invoices", code: "zoho.books.getRecords(\"Invoices\", \"${1:org_id}\")", tags: ["get"] },
            { title: "Get Contact", desc: "Get contact details", code: "zoho.books.getRecords(\"Contacts\", \"${1:org_id}\", ${2:contact_id})", tags: ["get"] },
            { title: "Create Invoice", desc: "Create a new invoice", code: "zoho.books.createRecord(\"Invoices\", \"${1:org_id}\", ${2:data_map})", tags: ["create"] }
        ]},
        { group: "REST API", items: [
            { title: "Get Invoices (REST)", desc: "GET /invoices", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/books/v3/invoices?organization_id=\" + ${1:org_id}\n\ttype: GET\n\tconnection: \"${2:books_connection}\"\n];", tags: ["rest"] }
        ]}
    ],
    creator: [
        { group: "Internal (Native)", items: [
            { title: "Add Record", desc: "insert into Form [...]", code: "insert into ${1:Form}\n[\n\t${2:Field} : ${3:Value}\n];", tags: ["native"] },
            { title: "Fetch Records", desc: "var = Form [Criteria]", code: "${1:var} = ${2:Form} [ ${3:Criteria} ];", tags: ["native"] }
        ]},
        { group: "Deluge Tasks", items: [
            { title: "Upload File", desc: "zoho.creator.uploadFile", code: "zoho.creator.uploadFile(${1:file_var}, \"${2:Owner}\", \"${3:App}\", \"${4:Form}\", ${5:ID}, \"${6:Field}\")", tags: ["file"] }
        ]}
    ],
    recruit: [
        { group: "Deluge Tasks", items: [
            { title: "Get Candidates", desc: "Fetch candidates", code: "zoho.recruit.getRecords(\"Candidates\", ${1:page}, ${2:per_page})", tags: ["get"] }
        ]}
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
        const categories = apiLibrary[product] || [];

        resultsList.innerHTML = '';

        categories.forEach(cat => {
            const filteredItems = cat.items.filter(item =>
                item.title.toLowerCase().includes(term) ||
                item.desc.toLowerCase().includes(term) ||
                item.tags.some(t => t.toLowerCase().includes(term))
            );

            if (filteredItems.length > 0) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'api-group-header';
                groupHeader.innerText = cat.group;
                groupHeader.style = "padding: 5px 10px; background: #333; color: #aaa; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 10px; border-radius: 3px;";
                resultsList.appendChild(groupHeader);

                filteredItems.forEach(api => {
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
        });

        if (resultsList.children.length === 0) {
            resultsList.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.5;">No matching APIs found.</div>';
        }
    }

    productSelector.addEventListener('change', renderResults);
    searchInput.addEventListener('input', renderResults);
    renderResults();
};
