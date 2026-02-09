export const apiLibrary = {
    crm: [
        { group: "Deluge Tasks (Native)", items: [
            { title: "Get Record by ID", desc: "Fetch a specific CRM record", code: "zoho.crm.getRecordById(\"${1:Module}\", ${2:id})", tags: ["get", "v8"] },
            { title: "Get Records", desc: "List records with pagination", code: "zoho.crm.getRecords(\"${1:Module}\", ${2:page}, ${3:per_page})", tags: ["get", "list", "v8"] },
            { title: "Search Records", desc: "Search using criteria", code: "zoho.crm.searchRecords(\"${1:Module}\", \"(${2:Criteria})\")", tags: ["search", "v8"] },
            { title: "Create Record", desc: "Insert a new record", code: "zoho.crm.createRecord(\"${1:Module}\", ${2:data_map})", tags: ["create", "v8"] },
            { title: "Update Record", desc: "Modify an existing record", code: "zoho.crm.updateRecord(\"${1:Module}\", ${2:id}, ${3:data_map})", tags: ["update", "v8"] },
            { title: "Get Related Records", desc: "Get children records", code: "zoho.crm.getRelatedRecords(\"${1:Relation}\", \"${2:Module}\", ${3:id})", tags: ["get", "related", "v8"] }
        ]},
        { group: "CRM REST API V8", items: [
            { title: "List Records", desc: "GET /crm/v8/{module}", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v8/${1:Module_API_Name}\"\n\ttype: GET\n\tconnection: \"${2:crm_connection}\"\n];", tags: ["rest", "v8"] },
            { title: "Get Record", desc: "GET /crm/v8/{module}/{id}", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v8/${1:Module}/${2:id}\"\n\ttype: GET\n\tconnection: \"${3:crm_connection}\"\n];", tags: ["rest", "v8"] },
            { title: "Upsert Record", desc: "POST /crm/v8/{module}/upsert", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v8/${1:Module}/upsert\"\n\ttype: POST\n\tparameters: ${2:data_map}.toString()\n\tconnection: \"${3:crm_connection}\"\n];", tags: ["rest", "v8", "upsert"] },
            { title: "COQL Query", desc: "Search using SQL-like syntax", code: "query_map = Map();\nquery_map.put(\"select_query\", \"select ${1:Field1}, ${2:Field2} from ${3:Module} where ${4:Criteria}\");\nresponse = invokeurl\n[\n\turl: \"https://www.zohoapis.com/crm/v2/coql\"\n\ttype: POST\n\tparameters: query_map.toString()\n\tconnection: \"${5:crm_connection}\"\n];", tags: ["rest", "coql"] }
        ]}
    ],
    books: [
        { group: "Deluge Tasks (V3)", items: [
            { title: "Get Invoices", desc: "List all invoices", code: "zoho.books.getRecords(\"Invoices\", \"${1:org_id}\")", tags: ["get", "v3"] },
            { title: "Get Contact", desc: "Get contact details", code: "zoho.books.getRecords(\"Contacts\", \"${1:org_id}\", ${2:contact_id})", tags: ["get", "v3"] },
            { title: "Create Invoice", desc: "Create a new invoice", code: "zoho.books.createRecord(\"Invoices\", \"${1:org_id}\", ${2:data_map})", tags: ["create", "v3"] }
        ]},
        { group: "Books REST API V3", items: [
            { title: "Get Invoices (REST)", desc: "GET /invoices", code: "invokeurl\n[\n\turl: \"https://www.zohoapis.com/books/v3/invoices?organization_id=\" + ${1:org_id}\n\ttype: GET\n\tconnection: \"${2:books_connection}\"\n];", tags: ["rest", "v3"] }
        ]}
    ],
    creator: [
        { group: "Native Scripting (V2.1)", items: [
            { title: "Add Record", desc: "insert into Form [...]", code: "insert into ${1:Form}\n[\n\t${2:Field} : ${3:Value}\n];", tags: ["native", "v2.1"] },
            { title: "Fetch Records", desc: "var = Form [Criteria]", code: "${1:var} = ${2:Form} [ ${3:Criteria} ];", tags: ["native", "v2.1"] },
            { title: "Update Records", desc: "Form [Criteria] { Field : Value }", code: "${1:Form} [ ${2:Criteria} ]\n{\n\t${3:Field} : ${4:Value}\n};", tags: ["native", "v2.1"] }
        ]},
        { group: "Deluge Tasks (V2.1)", items: [
            { title: "Upload File", desc: "zoho.creator.uploadFile", code: "zoho.creator.uploadFile(${1:file_var}, \"${2:Owner}\", \"${3:App}\", \"${4:Form}\", ${5:ID}, \"${6:Field}\")", tags: ["file", "v2.1"] },
            { title: "Get Records (Task)", desc: "zoho.creator.getRecords", code: "zoho.creator.getRecords(\"${1:Owner}\", \"${2:App}\", \"${3:Report}\", \"${4:Criteria}\", ${5:Page}, ${6:PageSize}, \"${7:Connection}\")", tags: ["get", "v2.1"] }
        ]}
    ],
    recruit: [
        { group: "Deluge Tasks (V2)", items: [
            { title: "Get Candidates", desc: "Fetch candidates", code: "zoho.recruit.getRecords(\"Candidates\", ${1:page}, ${2:per_page})", tags: ["get", "v2"] },
            { title: "Get Record by ID", desc: "Fetch candidate by ID", code: "zoho.recruit.getRecordById(\"Candidates\", ${1:id})", tags: ["get", "v2"] },
            { title: "Update Candidate", desc: "Update record", code: "zoho.recruit.updateRecord(\"Candidates\", ${1:id}, ${2:data_map})", tags: ["update", "v2"] }
        ]}
    ]
};
