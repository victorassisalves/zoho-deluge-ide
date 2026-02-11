(function() {
    let mySnippets = [];
    let editingSnippetId = null;
    let snippetEditor = null;

    const snippetsList = document.getElementById('my-snippets-list');
    const searchInput = document.getElementById('my-snippets-search');
    const modal = document.getElementById('snippet-modal');
    const modalTitle = document.getElementById('snippet-modal-title');
    const saveBtn = document.getElementById('snippet-modal-save');
    const categoryList = document.getElementById('category-list');

    function init() {
        loadSnippets();
        setupEventListeners();
        initSnippetEditor();
    }

    function initSnippetEditor() {
        const container = document.getElementById('snippet-code-editor');
        if (!container || snippetEditor) return;

        // Ensure monaco is available
        if (typeof monaco === 'undefined') {
            setTimeout(initSnippetEditor, 100);
            return;
        }

        snippetEditor = monaco.editor.create(container, {
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

    function loadSnippets() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['my_snippets'], (result) => {
                mySnippets = result.my_snippets || [];
                finalizeLoad();
            });
        } else {
            // Fallback for development/testing
            try {
                const data = localStorage.getItem('my_snippets');
                mySnippets = data ? JSON.parse(data) : [];
            } catch (e) { mySnippets = []; }
            finalizeLoad();
        }
    }

    function finalizeLoad() {
        renderSnippets();
        updateCategoryDatalist();
        // Expose snippets to window so deluge-lang.js can access them
        window.mySnippets = mySnippets;
    }

    function saveSnippets() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'my_snippets': mySnippets }, () => {
                finalizeSave();
            });
        } else {
            // Fallback for development/testing
            localStorage.setItem('my_snippets', JSON.stringify(mySnippets));
            finalizeSave();
        }
    }

    function finalizeSave() {
        renderSnippets();
        updateCategoryDatalist();
        window.mySnippets = mySnippets;
    }

    function renderSnippets() {
        if (!snippetsList) return;
        const term = searchInput.value.toLowerCase();
        snippetsList.innerHTML = '';

        if (mySnippets.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'font-size:11px; opacity:0.5; text-align:center; margin-top:20px;';
            empty.textContent = 'No snippets found. Click the + icon to add your first snippet.';
            snippetsList.appendChild(empty);
            return;
        }

        const filtered = mySnippets.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.trigger.toLowerCase().includes(term) ||
            (s.category && s.category.toLowerCase().includes(term)) ||
            (s.comments && s.comments.toLowerCase().includes(term))
        );

        if (filtered.length === 0) {
            const noMatch = document.createElement('div');
            noMatch.style.cssText = 'font-size:11px; opacity:0.5; text-align:center; margin-top:20px;';
            noMatch.textContent = 'No matching snippets found.';
            snippetsList.appendChild(noMatch);
            return;
        }

        // Group by category
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

                const header = document.createElement('div');
                header.className = 'my-snippet-header';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'my-snippet-name';
                nameSpan.textContent = snippet.name;

                const triggerSpan = document.createElement('span');
                triggerSpan.className = 'my-snippet-trigger';
                triggerSpan.textContent = '/' + snippet.trigger;

                header.appendChild(nameSpan);
                header.appendChild(triggerSpan);
                item.appendChild(header);

                if (snippet.comments) {
                    const commentsDiv = document.createElement('div');
                    commentsDiv.className = 'my-snippet-comments';
                    commentsDiv.textContent = snippet.comments;
                    item.appendChild(commentsDiv);
                }

                const actions = document.createElement('div');
                actions.className = 'my-snippet-actions';

                const editBtn = document.createElement('button');
                editBtn.className = 'my-snippet-action-btn edit';
                editBtn.title = 'Edit Snippet';
                editBtn.innerHTML = '<span class="material-icons" style="font-size:14px;">edit</span>';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'my-snippet-action-btn delete';
                deleteBtn.title = 'Delete Snippet';
                deleteBtn.innerHTML = '<span class="material-icons" style="font-size:14px;">delete</span>';

                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                item.appendChild(actions);

                item.onclick = () => {
                    insertMySnippet(snippet.code);
                };

                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    openModal(snippet);
                };

                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete snippet "${snippet.name}"?`)) {
                        mySnippets = mySnippets.filter(s => s.id !== snippet.id);
                        saveSnippets();
                    }
                };

                groupDiv.appendChild(item);
            });
            snippetsList.appendChild(groupDiv);
        });
    }

    function insertMySnippet(code) {
        if (!window.editor) return;
        const editor = window.editor;
        const selection = editor.getSelection();
        const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);

        const contribution = editor.getContribution('snippetController2');
        if (contribution) {
            contribution.insert(code, range);
        } else {
            editor.executeEdits("snippet", [{ range: range, text: code.replace(/\$\d|\$\{ \d:[^}]+\}/g, ''), forceMoveMarkers: true }]);
        }
        editor.focus();
    }

    function updateCategoryDatalist() {
        if (!categoryList) return;
        const categories = new Set();
        mySnippets.forEach(s => { if (s.category) categories.add(s.category); });
        categoryList.innerHTML = '';
        Array.from(categories).sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            categoryList.appendChild(opt);
        });
    }

    function setupEventListeners() {
        const addBtn = document.getElementById('add-my-snippet-btn');
        if (addBtn) addBtn.onclick = () => openModal();

        const closeBtn = document.getElementById('snippet-modal-close');
        if (closeBtn) closeBtn.onclick = closeModal;

        const cancelBtn = document.getElementById('snippet-modal-cancel');
        if (cancelBtn) cancelBtn.onclick = closeModal;

        if (saveBtn) saveBtn.onclick = saveSnippetFromModal;

        if (searchInput) searchInput.oninput = renderSnippets;

        const exportBtn = document.getElementById('export-snippets-btn');
        if (exportBtn) exportBtn.onclick = exportSnippets;

        const importBtn = document.getElementById('import-snippets-btn');
        if (importBtn) importBtn.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (re) => {
                    try {
                        const imported = JSON.parse(re.target.result);
                        if (Array.isArray(imported)) {
                            const validSnippets = imported.filter(validateSnippet);
                            if (validSnippets.length === 0) {
                                alert('No valid snippets found in the file.');
                                return;
                            }
                            if (confirm(`Import ${validSnippets.length} snippets? This will merge with your existing snippets.`)) {
                                validSnippets.forEach(s => {
                                    if (!s.id) s.id = Date.now() + Math.random().toString(36).substr(2, 9);
                                    mySnippets.push(s);
                                });
                                saveSnippets();
                                alert('Snippets imported successfully.');
                            }
                        } else {
                            alert('Invalid snippets file format.');
                        }
                    } catch (err) {
                        alert('Error parsing JSON file.');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };
    }

    function validateSnippet(s) {
        return s && typeof s === 'object' &&
               typeof s.name === 'string' && s.name.trim() !== '' &&
               typeof s.trigger === 'string' && s.trigger.trim() !== '' &&
               typeof s.code === 'string' && s.code.trim() !== '';
    }

    function openModal(snippet = null) {
        if (!modal) return;
        editingSnippetId = snippet ? snippet.id : null;
        modalTitle.innerText = snippet ? 'Edit Snippet' : 'Add Snippet';

        document.getElementById('snippet-name').value = snippet ? snippet.name : '';
        document.getElementById('snippet-trigger').value = snippet ? snippet.trigger : '';
        document.getElementById('snippet-category').value = snippet ? snippet.category : '';
        document.getElementById('snippet-comments').value = snippet ? snippet.comments : '';

        if (snippetEditor) {
            snippetEditor.setValue(snippet ? snippet.code : '');
        }

        modal.style.display = 'flex';
        setTimeout(() => {
            if (snippetEditor) snippetEditor.layout();
        }, 100);
    }

    function closeModal() {
        if (modal) modal.style.display = 'none';
        editingSnippetId = null;
    }

    function saveSnippetFromModal() {
        const name = document.getElementById('snippet-name').value.trim();
        const trigger = document.getElementById('snippet-trigger').value.trim().replace(/^\//, ''); // Strip leading /
        const category = document.getElementById('snippet-category').value.trim() || 'Uncategorized';
        const code = snippetEditor ? snippetEditor.getValue() : '';
        const comments = document.getElementById('snippet-comments').value.trim();

        if (!name || !trigger || !code) {
            alert('Name, Trigger, and Code are required.');
            return;
        }

        if (editingSnippetId) {
            const idx = mySnippets.findIndex(s => s.id === editingSnippetId);
            if (idx !== -1) {
                mySnippets[idx] = { ...mySnippets[idx], name, trigger, category, code, comments };
            }
        } else {
            mySnippets.push({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                name,
                trigger,
                category,
                code,
                comments
            });
        }

        saveSnippets();
        closeModal();
    }

    function exportSnippets() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mySnippets, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "deluge_snippets_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
