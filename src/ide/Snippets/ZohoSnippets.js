class ZohoSnippets {
    constructor() {
        this.snippets = {
            'if': "if (${1:condition})\n{\n\t$0\n}",
            'else if': "else if (${1:condition})\n{\n\t$0\n}",
            'else': "else\n{\n\t$0\n}",
            'conditional if': "if(${1:condition}, ${2:true_val}, ${3:false_val})",
            'collection_create': "${1:var} = Collection();",
            'map': "${1:var} = Map();",
            'put': "${1:var}.put(\"${2:key}\", ${3:value});",
            'info': "info $0;",
            'return': "return $0;",
            // ... truncated for brevity, but would include all from snippet_logic.js
        };
    }

    async init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.snippet-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-snippet');
                this.insert(type);
            });
        });

        const fetchBtn = document.getElementById('fetch-creator-forms-btn');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => this.fetchCreatorForms());
        }
    }

    insert(type) {
        if (!window.editor) return;
        const editor = window.editor;
        let snippet = this.getSnippet(type);

        const selection = editor.getSelection();
        const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
        const contribution = editor.getContribution('snippetController2');
        if (contribution) contribution.insert(snippet, range);
        else editor.executeEdits("snippet", [{ range: range, text: snippet.replace(/\$\d|\$\{ \d:[^}]+\}/g, ''), forceMoveMarkers: true }]);
        editor.focus();
    }

    getSnippet(type) {
        // Handle dynamic snippets like Creator forms
        const selectedForm = document.getElementById('creator-form-selector')?.value || "${1:Form}";

        // This is a simplified version, should ideally contain the full switch from snippet_logic.js
        const baseSnippets = {
            'insert': "insert into " + selectedForm + "\n[\n\t${2:Field} : ${3:Value}\n];",
            'fetch': "${1:var} = " + selectedForm + " [ ${3:Criteria} ];",
            'for each': "for each ${1:var} in " + selectedForm + " [ ${3:Criteria} ]\n{\n\t$0\n}",
            // ...
        };

        return baseSnippets[type] || this.snippets[type] || "";
    }

    fetchCreatorForms() {
        const fetchBtn = document.getElementById('fetch-creator-forms-btn');
        const formSelector = document.getElementById('creator-form-selector');
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
                }
            });
        }
    }
}

export default ZohoSnippets;
