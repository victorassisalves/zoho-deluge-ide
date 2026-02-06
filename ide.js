/**
 * Zoho Deluge Advanced IDE
 */

let editor;
let isConnected = false;
let jsonMappings = {};

function initEditor() {
    if (editor) return;

    const container = document.getElementById('editor-container');
    if (!container) return;

    if (typeof registerDelugeLanguage === 'function') {
        registerDelugeLanguage();
    }

    try {
        // Define Dracula Theme
        monaco.editor.defineTheme('dracula', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272a4' },
                { token: 'keyword', foreground: 'ff79c6' },
                { token: 'number', foreground: 'bd93f9' },
                { token: 'string', foreground: 'f1fa8c' },
                { token: 'delimiter', foreground: 'f8f8f2' },
                { token: 'operator', foreground: 'ff79c6' },
                { token: 'identifier', foreground: 'f8f8f2' },
                { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'function', foreground: '50fa7b' },
                { token: 'method', foreground: '50fa7b' },
                { token: 'variable', foreground: 'ffb86c' },
                { token: 'brackets', foreground: 'f8f8f2' }
            ],
            colors: {
                'editor.background': '#282a36',
                'editor.foreground': '#f8f8f2',
                'editorCursor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#44475a',
                'editorLineNumber.foreground': '#6272a4',
                'editor.selectionBackground': '#44475a',
                'editorIndentGuide.background': '#44475a',
                'editorIndentGuide.activeBackground': '#6272a4'
            }
        });

        editor = monaco.editor.create(container, {
            value: '// Start coding in Zoho Deluge...\n\ninfo "Hello, World!";',
            language: 'deluge',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            readOnly: false,
            fixedOverflowWidgets: true
        });

        // Add Shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            saveLocally();
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => {
            pushToZoho(true);
            saveLocally();
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
            pushToZoho(false, true);
            saveLocally();
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
            pullFromZoho();
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE, () => {
            chrome.runtime.sendMessage({ action: 'OPEN_ZOHO_EDITOR' });
        });

        editor.onDidChangeCursorPosition((e) => {
            const posEl = document.getElementById('cursor-pos');
            if (posEl) posEl.innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        // Load saved data
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['saved_deluge_code', 'json_mappings', 'gemini_api_key', 'gemini_model', 'saved_files', 'theme'], (result) => {
                if (result.saved_deluge_code && editor) {
                    editor.setValue(result.saved_deluge_code);
                }
                if (result.json_mappings) {
                    jsonMappings = result.json_mappings;
                    updateMappingsList();
                }
                if (result.gemini_api_key) {
                    const keyInput = document.getElementById('gemini-api-key');
                    if (keyInput) keyInput.value = result.gemini_api_key;
                }
                if (result.gemini_model) {
                    const modelSelector = document.getElementById('ai-model-selector');
                    if (modelSelector) modelSelector.value = result.gemini_model;
                }
                if (result.saved_files) {
                    updateSavedFilesList(result.saved_files);
                }
                if (result.theme) {
                    monaco.editor.setTheme(result.theme);
                    const selector = document.getElementById('theme-selector');
                    if (selector) selector.value = result.theme;
                }
            });
        }

        // Auto-save to draft
        let autoSaveTimeout;
        editor.onDidChangeModelContent(() => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (!editor) return;
                const code = editor.getValue();
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ 'saved_deluge_code': code });
                }
                const syncEl = document.getElementById('sync-status');
                if (syncEl) syncEl.innerText = 'Draft Saved';
            }, 2000);
        });

        setupEventHandlers();
        checkConnection();
        initResources();
        setInterval(checkConnection, 5000);

    } catch (e) {
        console.error('[ZohoIDE] Monaco Load Error:', e);
    }
}

function checkConnection() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
    chrome.runtime.sendMessage({ action: 'CHECK_CONNECTION' }, (response) => {
        const statusEl = document.getElementById('status-indicator');
        if (statusEl) {
            if (response && response.connected) {
                isConnected = true;
                statusEl.innerText = (response.isStandalone ? 'Target: ' : 'Local: ') + (response.tabTitle || 'Zoho Tab');
                statusEl.style.color = '#4ec9b0';
                window.currentTargetTab = response;
            } else {
                isConnected = false;
                statusEl.innerText = 'Disconnected';
                statusEl.style.color = '#888';
            }
        }
    });
}

function setupEventHandlers() {
    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    bind('new-btn', 'click', () => {
        if (confirm('Start a new script?')) {
            editor.setValue('// New Zoho Deluge Script\n\n');
        }
    });

    bind('pull-btn', 'click', pullFromZoho);
    bind('push-btn', 'click', () => pushToZoho(true));
    bind('save-btn', 'click', saveLocally);

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            const viewId = 'view-' + item.getAttribute('data-view');
            const view = document.getElementById(viewId);
            if (view) view.classList.add('active');
        });
    });

    bind('theme-selector', 'change', (e) => {
        const theme = e.target.value;
        monaco.editor.setTheme(theme);
        chrome.storage.local.set({ 'theme': theme });
    });

    bind('save-settings-btn', 'click', () => {
        const key = document.getElementById('gemini-api-key').value;
        const model = document.getElementById('ai-model-selector').value;
        chrome.storage.local.set({ 'gemini_api_key': key, 'gemini_model': model }, () => {
            log('Success', 'Settings saved.');
        });
    });

    bind('ai-ask-btn', 'click', askGemini);
    bind('ai-question', 'keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) askGemini();
    });

    const modal = document.getElementById('json-modal');
    bind('json-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Convert JSON to Deluge Map';
        document.getElementById('modal-convert').style.display = 'block';
        document.getElementById('modal-map-only').style.display = 'none';
        modal.style.display = 'flex';
    });

    bind('add-json-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Add JSON Mapping';
        document.getElementById('modal-convert').style.display = 'none';
        document.getElementById('modal-map-only').style.display = 'block';
        modal.style.display = 'flex';
    });

    bind('modal-cancel', 'click', () => { modal.style.display = 'none'; });

    bind('modal-convert', 'click', () => {
        const varName = document.getElementById('json-var-name').value || 'payload';
        const jsonStr = document.getElementById('json-input').value;
        try {
            const code = convertJsonToDeluge(varName, jsonStr);
            editor.executeEdits('json-convert', [{ range: editor.getSelection(), text: code }]);
            saveMapping(varName, jsonStr);
            modal.style.display = 'none';
            log('Success', 'JSON converted and mapped.');
        } catch (e) { alert('Error: ' + e.message); }
    });

    bind('modal-map-only', 'click', () => {
        const varName = document.getElementById('json-var-name').value || 'payload';
        const jsonStr = document.getElementById('json-input').value;
        saveMapping(varName, jsonStr);
        modal.style.display = 'none';
        log('Success', 'JSON mapped for autocomplete.');
    });

    bind('clear-console', 'click', () => {
        document.getElementById('console-output').innerHTML = '';
    });

    document.querySelectorAll('.panel-header .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'IDE_CONSOLE_UPDATE') {
                log('Zoho', request.data);
            }
        });
    }
}

function convertJsonToDeluge(varName, jsonStr) {
    const obj = JSON.parse(jsonStr);
    let code = `${varName} = Map();\n`;
    function process(data, path) {
        for (let key in data) {
            const val = data[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                const subVar = `${key}_map`;
                code += `${subVar} = Map();\n`;
                process(val, subVar);
                code += `${path}.put("${key}", ${subVar});\n`;
            } else if (Array.isArray(val)) {
                code += `${path}.put("${key}", { ${val.map(v => typeof v === 'string' ? '"' + v + '"' : v).join(', ')} });\n`;
            } else {
                const safeVal = typeof val === 'string' ? '"' + val + '"' : val;
                code += `${path}.put("${key}", ${safeVal});\n`;
            }
        }
    }
    process(obj, varName);
    return code;
}

function saveMapping(name, jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);
        jsonMappings[name] = obj;
        chrome.storage.local.set({ 'json_mappings': jsonMappings });
        updateMappingsList();
    } catch (e) { alert('Invalid JSON: ' + e.message); }
}

function updateMappingsList() {
    const list = document.getElementById('json-mappings-list');
    if (!list) return;
    list.innerHTML = '';
    Object.keys(jsonMappings).forEach(name => {
        const item = document.createElement('div');
        item.className = 'mapping-item';
        item.innerHTML = `<span>${name}</span><span class="delete-mapping" data-name="${name}">×</span>`;
        item.onclick = (e) => {
            if (e.target.classList.contains('delete-mapping')) {
                const n = e.target.getAttribute('data-name');
                delete jsonMappings[n];
                chrome.storage.local.set({ 'json_mappings': jsonMappings });
                updateMappingsList();
                document.getElementById('json-tree-view').innerHTML = '';
                return;
            }
            document.querySelectorAll('.mapping-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderTreeView(jsonMappings[name], name);
        };
        list.appendChild(item);
    });
}

function renderTreeView(obj, mappingName) {
    const tree = document.getElementById('json-tree-view');
    if (!tree) return;
    tree.innerHTML = '';

    function buildTree(data, container, path = "") {
        if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            keys.forEach(key => {
                const val = data[key];
                const isArr = Array.isArray(data);
                const currentPath = isArr ? `${path}.get(${key})` : `${path}.get("${key}")`;

                const node = document.createElement('div');
                node.className = 'tree-node';
                node.setAttribute('data-key', key.toLowerCase());

                const label = document.createElement('span');
                label.className = 'tree-label';

                if (typeof val === 'object' && val !== null) {
                    label.innerHTML = `<span class="tree-key">${key}</span>: ${Array.isArray(val) ? '[' : '{'}`;
                    node.appendChild(label);
                    const subContainer = document.createElement('div');
                    buildTree(val, subContainer, currentPath);
                    node.appendChild(subContainer);
                    const footer = document.createElement('div');
                    footer.innerText = Array.isArray(val) ? ']' : '}';
                    node.appendChild(footer);
                } else {
                    label.innerHTML = `<span class="tree-key">${key}</span>: <span class="tree-val">${JSON.stringify(val)}</span>`;
                    label.title = "Click to insert path";
                    label.onclick = () => {
                        const fullPath = mappingName + currentPath;
                        editor.executeEdits("tree-insert", [{ range: editor.getSelection(), text: fullPath }]);
                    };
                    node.appendChild(label);
                }
                container.appendChild(node);
            });
        }
    }
    buildTree(obj, tree);
}

function log(type, message) {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type.toLowerCase()}`;
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`;
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function pullFromZoho() {
    log('System', 'Pulling code...');
    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
        if (response && response.code) {
            editor.setValue(response.code);
            log('Success', 'Code pulled.');
        } else { log('Error', response?.error || 'No code found.'); }
    });
}

function pushToZoho(triggerSave = false, triggerExecute = false) {
    const code = editor.getValue();
    log('System', 'Pushing code...');
    chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (response) => {
        if (response && response.success) {
            log('Success', 'Code pushed.');
            if (triggerSave) {
                chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' }, (res) => {
                    if (res && res.success) log('Success', 'Zoho Save triggered.');
                });
            }
            if (triggerExecute) {
                chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' }, (res) => {
                    if (res && res.success) log('Success', 'Zoho Execute triggered.');
                });
            }
        } else { log('Error', response?.error || 'Push failed.'); }
    });
}

function saveLocally() {
    const code = editor.getValue();
    const timestamp = new Date().toLocaleString();
    const title = 'Script ' + new Date().toLocaleTimeString();
    const source = window.currentTargetTab?.tabTitle || 'Local Editor';
    const vars = extractVarsFromCode(code);
    chrome.storage.local.get(['saved_files'], (result) => {
        const files = result.saved_files || [];
        files.unshift({ title, code, timestamp, source, vars });
        const limitedFiles = files.slice(0, 20);
        chrome.storage.local.set({ 'saved_deluge_code': code, 'saved_files': limitedFiles }, () => {
            log('Success', 'Saved to Explorer.');
            updateSavedFilesList(limitedFiles);
            const syncEl = document.getElementById('sync-status');
            if (syncEl) syncEl.innerText = 'Saved ' + new Date().toLocaleTimeString();
        });
    });
}

function updateSavedFilesList(files) {
    const list = document.getElementById('saved-files-list');
    if (!list) return;
    list.innerHTML = '';
    if (files.length === 0) {
        list.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6;">No saved files yet.</div>';
        return;
    }
    files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';
        const varsText = file.vars && file.vars.length ? `<br>Vars: ${file.vars.slice(0, 3).join(', ')}${file.vars.length > 3 ? '...' : ''}` : '';
        card.innerHTML = `<div class="file-title">${file.title}</div><div class="file-meta">${file.source} • ${file.timestamp}${varsText}</div>`;
        card.onclick = () => { if (confirm('Load this saved version?')) { editor.setValue(file.code); } };
        list.appendChild(card);
    });
}

function extractVarsFromCode(code) {
    const vars = new Set();
    const regex = /([a-zA-Z0-9_]+)\s*=/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        if (!['if', 'for', 'else', 'return', 'try', 'catch', 'while'].includes(match[1])) {
            vars.add(match[1]);
        }
    }
    return Array.from(vars);
}

function initResources() {
    document.querySelectorAll('.resource-section li').forEach(li => {
        li.addEventListener('click', () => {
            const methodName = li.innerText;
            const question = `Explain the Deluge method: ${methodName} and show an example.`;
            document.getElementById('ai-question').value = question;
            document.querySelector('[data-view="ai-agent"]').click();
            askGemini();
        });
    });
}

async function askGemini() {
    const question = document.getElementById('ai-question').value;
    if (!question.trim()) return;
    const chatHistory = document.getElementById('ai-chat-history');
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerText = question;
    chatHistory.appendChild(userMsg);
    document.getElementById('ai-question').value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-msg ai';
    aiMsg.innerText = 'Thinking...';
    chatHistory.appendChild(aiMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const result = await chrome.storage.local.get(['gemini_api_key', 'gemini_model']);
    if (!result.gemini_api_key) {
        aiMsg.innerText = 'Error: Please set your Gemini API Key in Settings.';
        return;
    }
    const model = result.gemini_model || 'gemini-1.5-flash';
    try {
        const prompt = `You are a Zoho Deluge expert. Code context:\n\`\`\`deluge\n${editor.getValue()}\n\`\`\`\n\nQuestion: ${question}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${result.gemini_api_key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiMsg.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: ' + (data.error?.message || 'Unknown');
    } catch (e) { aiMsg.innerText = 'Error: ' + e.message; }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

if (document.readyState === 'complete') { initEditor(); } else { window.addEventListener('load', initEditor); }

document.getElementById('toggle-right-sidebar')?.addEventListener('click', () => {
    const sidebar = document.getElementById('right-sidebar');
    const icon = document.getElementById('toggle-right-sidebar');
    if (sidebar.style.width === '30px') {
        sidebar.style.width = '250px';
        icon.innerText = '▶';
        sidebar.querySelectorAll(':not(.right-sidebar-header, #toggle-right-sidebar)').forEach(el => el.style.display = '');
    } else {
        sidebar.style.width = '30px';
        icon.innerText = '◀';
        sidebar.querySelectorAll(':not(.right-sidebar-header, #toggle-right-sidebar)').forEach(el => el.style.display = 'none');
    }
    editor.layout();
});

// Docs search implementation
if (document.getElementById('docs-search')) {
    document.getElementById('docs-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const sections = document.querySelectorAll('.resource-section');
        sections.forEach(section => {
            const items = section.querySelectorAll('li');
            let sectionVisible = false;
            items.forEach(item => {
                if (item.textContent.toLowerCase().includes(term)) {
                    item.style.display = 'block';
                    sectionVisible = true;
                } else {
                    item.style.display = 'none';
                }
            });
            section.style.display = sectionVisible ? 'block' : 'none';
        });
    });
}

// Resizing Right Sidebar
let isResizingRight = false;
document.getElementById('right-sidebar-resizer')?.addEventListener('mousedown', (e) => {
    isResizingRight = true;
    document.body.style.userSelect = 'none';
});

window.addEventListener('mousemove', (e) => {
    if (!isResizingRight) return;
    const width = window.innerWidth - e.clientX;
    if (width > 50 && width < 600) {
        const sidebar = document.getElementById('right-sidebar');
        if (sidebar) {
            sidebar.style.width = width + 'px';
            if (editor) editor.layout();
        }
    }
});

window.addEventListener('mouseup', () => {
    isResizingRight = false;
    document.body.style.userSelect = 'auto';
});

// JSON Search
document.getElementById('json-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const nodes = document.querySelectorAll('#json-tree-view .tree-node');
    nodes.forEach(node => {
        const key = node.getAttribute('data-key');
        if (key && key.includes(term)) {
            node.classList.remove('hidden');
            let p = node.parentElement;
            while (p && p.id !== 'json-tree-view') {
                if (p.classList.contains('tree-node')) p.classList.remove('hidden');
                p = p.parentElement;
            }
        } else if (term) {
            node.classList.add('hidden');
        } else {
            node.classList.remove('hidden');
        }
    });
});
