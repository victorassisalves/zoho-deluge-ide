class MySnippets {
    constructor(listId, searchId) {
        this.listId = listId;
        this.searchId = searchId;
        this.mySnippets = [];
        this.editingSnippetId = null;
        this.snippetEditor = null;
    }

    async init() {
        this.loadSnippets();
        this.setupEventListeners();
        this.initSnippetEditor();
    }

    initSnippetEditor() {
        const container = document.getElementById('snippet-code-editor');
        if (!container || this.snippetEditor) return;

        if (typeof monaco === 'undefined') {
            setTimeout(() => this.initSnippetEditor(), 100);
            return;
        }

        this.snippetEditor = monaco.editor.create(container, {
            value: '',
            language: 'deluge',
            theme: 'dracula',
            automaticLayout: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontSize: 13,
            roundedSelection: false,
            cursorStyle: 'line'
        });
    }

    loadSnippets() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['my_snippets'], (result) => {
                this.mySnippets = result.my_snippets || [];
                this.finalizeLoad();
            });
        } else {
            try {
                const data = localStorage.getItem('my_snippets');
                this.mySnippets = data ? JSON.parse(data) : [];
            } catch (e) { this.mySnippets = []; }
            this.finalizeLoad();
        }
    }

    finalizeLoad() {
        this.render();
        this.updateCategoryDatalist();
        window.mySnippets = this.mySnippets;
    }

    saveSnippets() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'my_snippets': this.mySnippets }, () => {
                this.finalizeSave();
            });
        } else {
            localStorage.setItem('my_snippets', JSON.stringify(this.mySnippets));
            this.finalizeSave();
        }
    }

    finalizeSave() {
        this.render();
        this.updateCategoryDatalist();
        window.mySnippets = this.mySnippets;
    }

    render() {
        const snippetsList = document.getElementById(this.listId);
        const searchInput = document.getElementById(this.searchId);
        if (!snippetsList) return;
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        snippetsList.innerHTML = '';

        if (this.mySnippets.length === 0) {
            snippetsList.innerHTML = '<div style="font-size:11px; opacity:0.5; text-align:center; margin-top:20px;">No snippets found. Click the + icon to add your first snippet.</div>';
            return;
        }

        const filtered = this.mySnippets.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.trigger.toLowerCase().includes(term) ||
            (s.category && s.category.toLowerCase().includes(term)) ||
            (s.comments && s.comments.toLowerCase().includes(term))
        );

        const groups = {};
        filtered.forEach(s => {
            const cat = s.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(s);
        });

        Object.keys(groups).sort().forEach(cat => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'my-snippet-category-group';
            const title = document.createElement('div');
            title.className = 'my-snippet-category-title';
            title.textContent = cat;
            groupDiv.appendChild(title);

            groups[cat].sort((a, b) => a.name.localeCompare(b.name)).forEach(snippet => {
                const item = document.createElement('div');
                item.className = 'my-snippet-item';
                item.innerHTML = `
                    <div class="my-snippet-header">
                        <span class="my-snippet-name">${snippet.name}</span>
                        <span class="my-snippet-trigger">/${snippet.trigger}</span>
                    </div>
                    ${snippet.comments ? `<div class="my-snippet-comments">${snippet.comments}</div>` : ''}
                    <div class="my-snippet-actions">
                        <button class="my-snippet-action-btn edit" title="Edit"><span class="material-icons" style="font-size:14px;">edit</span></button>
                        <button class="my-snippet-action-btn delete" title="Delete"><span class="material-icons" style="font-size:14px;">delete</span></button>
                    </div>
                `;

                item.onclick = () => this.insert(snippet.code);
                item.querySelector('.edit').onclick = (e) => { e.stopPropagation(); this.openModal(snippet); };
                item.querySelector('.delete').onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete snippet "${snippet.name}"?`)) {
                        this.mySnippets = this.mySnippets.filter(s => s.id !== snippet.id);
                        this.saveSnippets();
                    }
                };
                groupDiv.appendChild(item);
            });
            snippetsList.appendChild(groupDiv);
        });
    }

    insert(code) {
        if (!window.editor) return;
        const editor = window.editor;
        const selection = editor.getSelection();
        const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
        const contribution = editor.getContribution('snippetController2');
        if (contribution) contribution.insert(code, range);
        else editor.executeEdits("snippet", [{ range: range, text: code.replace(/\$\d|\$\{ \d:[^}]+\}/g, ''), forceMoveMarkers: true }]);
        editor.focus();
    }

    updateCategoryDatalist() {
        const categoryList = document.getElementById('category-list');
        if (!categoryList) return;
        const categories = new Set();
        this.mySnippets.forEach(s => { if (s.category) categories.add(s.category); });
        categoryList.innerHTML = '';
        Array.from(categories).sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            categoryList.appendChild(opt);
        });
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-my-snippet-btn');
        if (addBtn) addBtn.onclick = () => this.openModal();
        const searchInput = document.getElementById(this.searchId);
        if (searchInput) searchInput.oninput = () => this.render();
        const saveBtn = document.getElementById('snippet-modal-save');
        if (saveBtn) saveBtn.onclick = () => this.saveSnippetFromModal();

        // Modal close handlers
        const closeSelectors = ['snippet-modal-close', 'snippet-modal-cancel'];
        closeSelectors.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = () => this.closeModal();
        });
    }

    openModal(snippet = null) {
        const modal = document.getElementById('snippet-modal');
        if (!modal) return;
        this.editingSnippetId = snippet ? snippet.id : null;
        document.getElementById('snippet-modal-title').innerText = snippet ? 'Edit Snippet' : 'Add Snippet';
        document.getElementById('snippet-name').value = snippet ? snippet.name : '';
        document.getElementById('snippet-trigger').value = snippet ? snippet.trigger : '';
        document.getElementById('snippet-category').value = snippet ? snippet.category : '';
        document.getElementById('snippet-comments').value = snippet ? snippet.comments : '';
        if (this.snippetEditor) this.snippetEditor.setValue(snippet ? snippet.code : '');
        modal.style.display = 'flex';
        setTimeout(() => this.snippetEditor && this.snippetEditor.layout(), 100);
    }

    closeModal() {
        const modal = document.getElementById('snippet-modal');
        if (modal) modal.style.display = 'none';
        this.editingSnippetId = null;
    }

    saveSnippetFromModal() {
        const name = document.getElementById('snippet-name').value.trim();
        const trigger = document.getElementById('snippet-trigger').value.trim().replace(/^\//, '');
        const category = document.getElementById('snippet-category').value.trim() || 'Uncategorized';
        const code = this.snippetEditor ? this.snippetEditor.getValue() : '';
        const comments = document.getElementById('snippet-comments').value.trim();

        if (!name || !trigger || !code) {
            alert('Name, Trigger, and Code are required.');
            return;
        }

        if (this.editingSnippetId) {
            const idx = this.mySnippets.findIndex(s => s.id === this.editingSnippetId);
            if (idx !== -1) this.mySnippets[idx] = { ...this.mySnippets[idx], name, trigger, category, code, comments };
        } else {
            this.mySnippets.push({ id: Date.now() + Math.random().toString(36).substr(2, 9), name, trigger, category, code, comments });
        }
        this.saveSnippets();
        this.closeModal();
    }
}

export default MySnippets;
