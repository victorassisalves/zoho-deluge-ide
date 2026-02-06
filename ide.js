/**
 * Zoho Deluge Advanced IDE - Main Logic
 */

let editor;
let isConnected = false;
let jsonMappings = {};

console.log('[ZohoIDE] ide.js loading...');

function initEditor() {
    if (editor) return;

    const container = document.getElementById('editor-container');
    if (!container) return;

    if (typeof registerDelugeLanguage === 'function') {
        registerDelugeLanguage();
    }

    try {
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

        // Add Ctrl+S support
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            saveLocally();
        });

        editor.onDidChangeCursorPosition((e) => {
            const posEl = document.getElementById('cursor-pos');
            if (posEl) posEl.innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        });

        // Load saved data
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['saved_deluge_code', 'json_mappings', 'gemini_api_key', 'saved_files'], (result) => {
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
                if (result.saved_files) {
                    updateSavedFilesList(result.saved_files);
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
        if (response && response.connected) {
            isConnected = true;
            if (statusEl) {
                statusEl.innerText = (response.isStandalone ? 'Target: ' : 'Local: ') + (response.tabTitle || 'Zoho Tab');
                statusEl.style.color = '#4ec9b0';
                window.currentTargetTab = response;
            }
        } else {
            isConnected = false;
            if (statusEl) {
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
    bind('push-btn', 'click', pushToZoho);
    bind('save-btn', 'click', saveLocally);

    // Sidebar View Switching
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

    // JSON Modal / Manager Handlers
    const modal = document.getElementById('json-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalConvertBtn = document.getElementById('modal-convert');
    const modalMapOnlyBtn = document.getElementById('modal-map-only');

    bind('json-btn', 'click', () => {
        modalTitle.innerText = 'Convert JSON to Deluge Map';
        modalConvertBtn.style.display = 'block';
        modalMapOnlyBtn.style.display = 'none';
        modal.style.display = 'flex';
        document.getElementById('json-input').focus();
    });

    bind('add-json-btn', 'click', () => {
        modalTitle.innerText = 'Add JSON Mapping';
        modalConvertBtn.style.display = 'none';
        modalMapOnlyBtn.style.display = 'block';
        modal.style.display = 'flex';
        document.getElementById('json-input').focus();
    });

    bind('modal-cancel', 'click', () => {
        modal.style.display = 'none';
    });

    bind('modal-convert', 'click', () => {
        const json = document.getElementById('json-input').value;
        const varName = document.getElementById('json-var-name').value || 'payload';
        if (!json.trim()) return;

        const delugeCode = window.jsonToDeluge(json, varName);
        const selection = editor.getSelection();
        const op = { range: selection, text: delugeCode, forceMoveMarkers: true };
        editor.executeEdits("json-to-map", [op]);

        saveMapping(varName, json);
        modal.style.display = 'none';
        log('Success', 'JSON converted and mapping saved.');
    });

    bind('modal-map-only', 'click', () => {
        const json = document.getElementById('json-input').value;
        const varName = document.getElementById('json-var-name').value || 'payload';
        if (!json.trim()) return;

        saveMapping(varName, json);
        modal.style.display = 'none';
        log('Success', `Mapping for '${varName}' saved.`);
    });

    bind('save-settings-btn', 'click', () => {
        const key = document.getElementById('gemini-api-key').value;
        chrome.storage.local.set({ 'gemini_api_key': key }, () => {
            log('Success', 'Settings saved.');
        });
    });

    bind('ai-ask-btn', 'click', askGemini);

    document.querySelectorAll('.panel-header .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });

    bind('clear-console', 'click', () => {
        document.getElementById('console-output').innerHTML = '';
    });

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'IDE_CONSOLE_UPDATE') {
                log('Zoho', request.data);
            }
        });
    }
}

function saveMapping(name, jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);
        jsonMappings[name] = obj;
        chrome.storage.local.set({ 'json_mappings': jsonMappings });
        updateMappingsList();
    } catch (e) {
        alert('Invalid JSON: ' + e.message);
    }
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
            renderTreeView(jsonMappings[name]);
        };
        list.appendChild(item);
    });
}

function renderTreeView(obj) {
    const tree = document.getElementById('json-tree-view');
    if (!tree) return;
    tree.innerHTML = '';
    function buildTree(data, container) {
        if (typeof data === 'object' && data !== null) {
            Object.keys(data).forEach(key => {
                const val = data[key];
                const node = document.createElement('div');
                node.className = 'tree-node';
                const label = document.createElement('span');
                label.className = 'tree-label';
                if (typeof val === 'object' && val !== null) {
                    label.innerHTML = `<span class="tree-key">${key}</span>: ${Array.isArray(val) ? '[' : '{'}`;
                    node.appendChild(label);
                    const subContainer = document.createElement('div');
                    buildTree(val, subContainer);
                    node.appendChild(subContainer);
                    const footer = document.createElement('div');
                    footer.innerText = Array.isArray(val) ? ']' : '}';
                    node.appendChild(footer);
                } else {
                    label.innerHTML = `<span class="tree-key">${key}</span>: <span class="tree-val">${JSON.stringify(val)}</span>`;
                    label.title = "Click to insert .get()";
                    label.onclick = () => {
                        const text = `.get("${key}")`;
                        const selection = editor.getSelection();
                        editor.executeEdits("tree-insert", [{ range: selection, text: text }]);
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
    const timestamp = new Date().toLocaleTimeString();
    entry.innerText = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function pullFromZoho() {
    log('System', 'Pulling code...');
    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
        if (response && response.code) {
            editor.setValue(response.code);
            log('Success', 'Code pulled.');
        } else {
            log('Error', response?.error || 'No code found.');
        }
    });
}

function pushToZoho() {
    const code = editor.getValue();
    log('System', 'Pushing code...');
    chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (response) => {
        if (response && response.success) {
            log('Success', 'Code pushed.');
        } else {
            log('Error', response?.error || 'Push failed.');
        }
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
        card.onclick = () => {
            if (confirm('Load this saved version?')) {
                editor.setValue(file.code);
            }
        };
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

    const result = await chrome.storage.local.get(['gemini_api_key']);
    if (!result.gemini_api_key) {
        aiMsg.innerText = 'Error: Please set your Gemini API Key in Settings.';
        return;
    }
    try {
        const prompt = `You are a Zoho Deluge expert. Code context:\n\`\`\`deluge\n${editor.getValue()}\n\`\`\`\n\nQuestion: ${question}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${result.gemini_api_key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiMsg.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: ' + (data.error?.message || 'Unknown');
    } catch (e) {
        aiMsg.innerText = 'Error: ' + e.message;
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

if (document.readyState === 'complete') {
    initEditor();
} else {
    window.addEventListener('load', initEditor);
}

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
