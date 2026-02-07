(function() {
var zideProjectUrl = null;
window.zideProjectUrl = null;
var zideProjectName = "Untitled Project";
window.zideProjectName = zideProjectName;
window.activeCloudFileId = null;

/**
 * Zoho Deluge Advanced IDE v1.2.3
 */

var editor;
var isConnected = false;
var jsonMappings = {};

function initEditor() {
    if (editor) return;

    const container = document.getElementById('editor-container');
    if (!container) return;

    if (typeof registerDelugeLanguage === 'function') {
        registerDelugeLanguage();
    }

    try {
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
            value: '// Start coding in Zoho Deluge...\n\n',
            language: 'deluge',
            theme: 'dracula',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            glyphMargin: true
        });
        window.editor = editor;
    // Ensure editor layouts correctly after initialization
    setTimeout(() => { if (editor) editor.layout(); }, 500);
    setTimeout(() => { if (editor) editor.layout(); }, 2000);



        // Keyboard Shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => { saveLocally(); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => { pushToZoho(true); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => { pushToZoho(true, true); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => { pullFromZoho(); });

        editor.onDidChangeModelContent(() => {
            const code = editor.getValue();
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ 'saved_deluge_code': code });
            }
        });

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.get(['saved_deluge_code', 'theme', 'json_mappings'], (result) => {
                if (result.saved_deluge_code) editor.setValue(result.saved_deluge_code);
                if (result.theme) monaco.editor.setTheme(result.theme);
                if (result.json_mappings) {
                    jsonMappings = result.json_mappings;
                    window.jsonMappings = jsonMappings;
                    updateMappingsList();
                }
            });
        }

        // Global Fallback for Shortcuts (Incognito support)
        window.addEventListener("keydown", (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const ctrlCmd = isMac ? e.metaKey : e.ctrlKey;
            if (ctrlCmd && e.shiftKey) {
                const code = e.code;
                if (code === "KeyS") {
                    e.preventDefault();
                    e.stopPropagation();
                    pushToZoho(true);
                } else if (code === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    pushToZoho(true, true);
                } else if (code === "KeyP") {
                    e.preventDefault();
                    e.stopPropagation();
                    pullFromZoho();
                }
            }
        }, true);

        setupEventHandlers();
        checkConnection();
        setInterval(checkConnection, 5000);

    } catch (e) {
        console.error("[ZohoIDE] initEditor Error:", e);
        console.error('[ZohoIDE] Monaco Load Error:', e);
    }
}

function checkConnection() {
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "CHECK_CONNECTION" }, (response) => {
            let nextProjectUrl = "global";
            if (response && response.connected) {
                isConnected = true;
                const msg = (response.isStandalone ? "Connected to Target: " : "Connected Local: ") + (response.tabTitle || "Zoho Tab");
                showStatus(msg, "success");
                window.currentTargetTab = response;
                nextProjectUrl = response.url;
            } else {
                isConnected = false;
                showStatus("Disconnected from Zoho", "info");
                nextProjectUrl = "global";
            }

            if (nextProjectUrl !== zideProjectUrl) {
                // Context switch detected
                if (zideProjectUrl && editor && editor.getValue().trim() !== "" && !editor.getValue().startsWith("// Start coding")) {
                    saveLocally();
                }
                                zideProjectUrl = nextProjectUrl;
                window.zideProjectUrl = zideProjectUrl;
                loadProjectData();

                // Cloud Auto-Detection
                if (typeof CloudUI !== 'undefined' && CloudUI.activeOrgId && zideProjectUrl !== 'global') {
                    CloudUI.checkForCloudFiles(zideProjectUrl);
                }
            }
        });
    }
}

function loadProjectData() {
    if (!zideProjectUrl || typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get(["saved_files", "project_notes", "last_project_code", "project_names", "project_mappings"], (result) => {
        const allFiles = result.saved_files || [];
        const projectFiles = allFiles.filter(f => f.projectUrl === zideProjectUrl || (!f.projectUrl && zideProjectUrl === "global"));
        updateSavedFilesList(projectFiles);

        const projectNames = result.project_names || {};
        zideProjectName = projectNames[zideProjectUrl] || "Untitled Project";
        window.zideProjectName = zideProjectName;
        const nameInput = document.getElementById("project-name-input");
        if (nameInput) nameInput.value = zideProjectName;

        const notes = result.project_notes || {};
        const notesEl = document.getElementById("project-notes");
        if (notesEl) notesEl.value = notes[zideProjectUrl] || "";

        if (editor) {
            const lastCodes = result.last_project_code || {};
            const currentVal = editor.getValue();
            if (lastCodes[zideProjectUrl] && (!currentVal || currentVal.trim() === "" || currentVal.startsWith("// Start coding"))) {
                editor.setValue(lastCodes[zideProjectUrl]);
            }
        }

        const projectMappings = result.project_mappings || {};
        jsonMappings = projectMappings[zideProjectUrl] || {};
        updateMappingsList();
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
    bind('execute-btn', 'click', () => pushToZoho(true, true));
    bind('save-btn', 'click', saveLocally);

    bind('project-name-input', 'input', (e) => {
        zideProjectName = e.target.value;
        if (zideProjectUrl) {
            chrome.storage.local.get(['project_names'], (result) => {
                const names = result.project_names || {};
                names[zideProjectUrl] = zideProjectName;
                chrome.storage.local.set({ 'project_names': names });
            });
        }
    });

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const leftPanel = document.getElementById('left-panel-content');
            const isActive = item.classList.contains('active');

            if (isActive && leftPanel.style.display !== 'none') {
                leftPanel.style.display = 'none';
                item.classList.remove('active');
            } else {
                leftPanel.style.display = 'flex';
                document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
                item.classList.add('active');
                const viewId = 'view-' + item.getAttribute('data-view');
                const view = document.getElementById(viewId);
                if (view) view.classList.add('active');
            }
            if (editor) editor.layout();
        });
    });

    bind('theme-selector', 'change', (e) => {
        const theme = e.target.value;
        monaco.editor.setTheme(theme);
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'theme': theme });
        }
    });

    bind('save-settings-btn', 'click', () => {
        const key = document.getElementById('gemini-api-key').value;
        const model = document.getElementById('ai-model-selector').value;
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'gemini_api_key': key, 'gemini_model': model }, () => {
                log('Success', 'Settings saved.');
            });
        }
    });

    bind('ai-ask-btn', 'click', () => askGemini());
    bind('ai-explain-btn', 'click', explainCode);
    bind('ai-question', 'keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) askGemini();
    });

    bind('project-notes', 'input', (e) => {
        if (!zideProjectUrl || typeof chrome === "undefined" || !chrome.storage) return;
        const notesValue = e.target.value;
        chrome.storage.local.get(['project_notes'], (result) => {
            const notes = result.project_notes || {};
            notes[zideProjectUrl] = notesValue;
            chrome.storage.local.set({ 'project_notes': notes });
        });
    });

    bind('json-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Convert JSON to Deluge Map';
        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'block';
        document.getElementById('modal-map-only').style.display = 'none';
        document.getElementById('json-modal').style.display = 'flex';
    });

    bind('add-json-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Add JSON Mapping for Autocomplete';
        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'none';
        document.getElementById('modal-map-only').style.display = 'block';
        document.getElementById('json-modal').style.display = 'flex';
    });

    bind('modal-cancel', 'click', () => { document.getElementById('json-modal').style.display = 'none'; });

    bind('modal-convert', 'click', () => {
        const varName = document.getElementById('json-var-name').value || 'payload';
        const jsonStr = document.getElementById('json-input').value;
        try {
            const code = convertJsonToDeluge(varName, jsonStr);
            editor.executeEdits('json-convert', [{ range: editor.getSelection(), text: code }]);
            document.getElementById('json-modal').style.display = 'none';
        } catch (e) {
        console.error("[ZohoIDE] initEditor Error:", e); alert('Invalid JSON: ' + e.message); }
    });

    bind('modal-map-only', 'click', () => {
        const name = document.getElementById('json-var-name').value || 'mapping';
        const jsonStr = document.getElementById('json-input').value;
        saveMapping(name, jsonStr);
        document.getElementById('json-modal').style.display = 'none';
    });

    bind('clear-console', 'click', () => { document.getElementById('console-output').innerHTML = ''; });

    document.querySelectorAll('.panel-header .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
        });
    });

    initResources();

    function insertSnippet(type) {
        if (!editor) return;
        let snippet = "";
        switch (type) {
            case 'if': snippet = "if (  ) \n{\n\t\n}"; break;
            case 'else if': snippet = "else if (  ) \n{\n\t\n}"; break;
            case 'else': snippet = "else \n{\n\t\n}"; break;
            case 'conditional if': snippet = "if( , , )"; break;
            case 'insert': snippet = "insert into <Form>\n[\n\t<Field> : <Value>\n];"; break;
            case 'fetch': snippet = "<var> = <Form> [ <Criteria> ];"; break;
            case 'aggregate': snippet = "<var> = <Form> [ <Criteria> ].count();"; break;
            case 'update': snippet = "<Form> [ <Criteria> ]\n{\n\t<Field> : <Value>\n};"; break;
            case 'for each': snippet = "for each <var> in <Form> [ <Criteria> ]\n{\n\t\n}"; break;
            case 'delete': snippet = "delete from <Form> [ <Criteria> ];"; break;
            case 'list': snippet = "<var> = List();"; break;
            case 'add': snippet = "<var>.add();"; break;
            case 'remove': snippet = "<var>.remove();"; break;
            case 'clear': snippet = "<var>.clear();"; break;
            case 'sort': snippet = "<var>.sort();"; break;
            case 'map': snippet = "<var> = Map();"; break;
            case 'put': snippet = "<var>.put(\"\", \"\");"; break;
            case 'remove_key': snippet = "<var>.remove(\"\");"; break;
            case 'clear_map': snippet = "<var>.clear();"; break;
            case 'variable': snippet = "<var> = ;"; break;
            case 'function': snippet = "thisapp.<function_name>();"; break;
            case 'mail': snippet = "sendmail\n[\n\tfrom: zoho.adminuserid\n\tto: \"\"\n\tsubject: \"\"\n\tmessage: \"\"\n];"; break;
            case 'info': snippet = "info ;"; break;
        }
        if (snippet) {
            const selection = editor.getSelection();
            const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            editor.executeEdits("snippet-insert", [{ range: range, text: snippet, forceMoveMarkers: true }]);
            editor.focus();
        }
    }

    document.querySelectorAll('.snippet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-snippet');
            insertSnippet(type);
        });
    });

}

function convertJsonToDeluge(varName, jsonStr) {
    const obj = JSON.parse(jsonStr);
    let code = "";
    let varCounter = 0;

    function processValue(val, name) {
        if (Array.isArray(val)) {
            const listVar = name || `list_${++varCounter}`;
            code += `${listVar} = List();\n`;
            val.forEach(item => {
                const itemVar = processValue(item);
                code += `${listVar}.add(${itemVar});\n`;
            });
            return listVar;
        } else if (typeof val === "object" && val !== null) {
            const mapVar = name || `map_${++varCounter}`;
            code += `${mapVar} = Map();\n`;
            for (const key in val) {
                const memberVar = processValue(val[key]);
                code += `${mapVar}.put("${key}", ${memberVar});\n`;
            }
            return mapVar;
        } else {
            if (typeof val === "string") {
                return `"${val.replace(/"/g, '\\"')}"`;
            }
            return val;
        }
    }

    processValue(obj, varName);
    return code;
}

function saveMapping(name, jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);
        jsonMappings[name] = obj;
        if (typeof chrome !== "undefined" && chrome.storage) {
            if (zideProjectUrl) {
                chrome.storage.local.get(['project_mappings'], (result) => {
                    const projectMappings = result.project_mappings || {};
                    projectMappings[zideProjectUrl] = jsonMappings;
                    chrome.storage.local.set({ 'project_mappings': projectMappings });
                });
            } else {
                chrome.storage.local.set({ 'json_mappings': jsonMappings });
            }
        }
        updateMappingsList();
    } catch (e) {
        console.error("[ZohoIDE] initEditor Error:", e); alert('Invalid JSON: ' + e.message); }
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
                delete jsonMappings[name];
                if (typeof chrome !== "undefined" && chrome.storage) {
                    if (zideProjectUrl) {
                        chrome.storage.local.get(['project_mappings'], (result) => {
                            const projectMappings = result.project_mappings || {};
                            projectMappings[zideProjectUrl] = jsonMappings;
                            chrome.storage.local.set({ 'project_mappings': projectMappings });
                        });
                    } else {
                        chrome.storage.local.set({ 'json_mappings': jsonMappings });
                    }
                }
                updateMappingsList();
                return;
            }
            document.querySelectorAll('.mapping-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderJsonTree(name, jsonMappings[name]);
        };
        list.appendChild(item);
    });
}

function renderJsonTree(mappingName, obj) {
    const tree = document.getElementById('json-tree-view');
    tree.innerHTML = '';
    function buildTree(data, container, path = "") {
        if (typeof data === 'object' && data !== null) {
            Object.keys(data).forEach(key => {
                const val = data[key];
                const node = document.createElement('div');
                node.className = 'tree-node';
                node.setAttribute('data-key', key.toLowerCase());
                const label = document.createElement('div');
                label.className = 'tree-label';
                const currentPath = Array.isArray(data) ? `.get(${key})` : `.get("${key}")`;
                if (typeof val === 'object' && val !== null) {
                    label.innerHTML = `<span class="tree-key">${key}</span>: ${Array.isArray(val) ? '[' : '{'}`;
                    node.appendChild(label);
                    const subContainer = document.createElement('div');
                    subContainer.className = 'tree-sub';
                    buildTree(val, subContainer, path + currentPath);
                    node.appendChild(subContainer);
                    const footer = document.createElement('div');
                    footer.innerText = Array.isArray(val) ? ']' : '}';
                    node.appendChild(footer);
                } else {
                    label.innerHTML = `<span class="tree-key">${key}</span>: <span class="tree-val">${JSON.stringify(val)}</span>`;
                    label.title = "Click to insert path";
                    label.onclick = () => {
                        const fullPath = mappingName + path + currentPath;
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


function showStatus(message, type = 'info') {
    const statusEl = document.getElementById("status-indicator");
    if (statusEl) {
        statusEl.innerText = message;
        statusEl.style.color = type === 'success' ? '#4ec9b0' : (type === 'error' ? '#f44747' : '#888');
    }
    log(type, message);
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
    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Please open a Zoho Deluge editor tab first.');
        return;
    }
    log('System', 'Pulling code...');
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
            if (response && response.code) {
                editor.setValue(response.code);
                log('Success', 'Code pulled.');
            } else { log('Error', response?.error || 'No code found.'); }
        });
    }
}

function pushToZoho(triggerSave = false, triggerExecute = false) {
    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Sync/Execute failed.');
        return;
    }
    const code = editor.getValue();
    log('System', 'Pushing code...');
    if (typeof chrome !== "undefined" && chrome.runtime) {
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
}

function saveLocally() {

    const code = editor.getValue();
    const timestamp = new Date().toLocaleString();
    const title = 'Script ' + new Date().toLocaleTimeString();
    const source = window.currentTargetTab?.tabTitle || 'Local Editor';
    const vars = extractVarsFromCode(code);
    const projectUrl = zideProjectUrl || 'global';
    // Cloud Sync
    if (window.activeCloudFileId && typeof CloudService !== 'undefined') {
        CloudService.saveFile(window.activeCloudFileId, {
            code: code,
            jsonMappings: window.jsonMappings || {},
            url: zideProjectUrl
        }).then(() => {
            showStatus('Synced to Cloud', 'success');
        }).catch(err => {
            console.error('Cloud Sync failed:', err);
        });
    }


    if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(['saved_files', 'last_project_code'], (result) => {
            const files = result.saved_files || [];
            files.unshift({ title, code, timestamp, source, vars, projectUrl });
            const limitedFiles = files.slice(0, 500);

            const lastCodes = result.last_project_code || {};
            lastCodes[projectUrl] = code;

            chrome.storage.local.set({ 'saved_deluge_code': code, 'saved_files': limitedFiles, 'last_project_code': lastCodes }, () => {
                log('Success', 'Saved to Explorer.');
                const filtered = limitedFiles.filter(f => f.projectUrl === projectUrl || (!f.projectUrl && projectUrl === 'global'));
                updateSavedFilesList(filtered);
                const syncEl = document.getElementById('sync-status');
                if (syncEl) syncEl.innerText = 'Saved ' + new Date().toLocaleTimeString();
            });
        });
    }
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

async function askGemini(customPrompt = null) {
    const questionInput = document.getElementById("ai-question");
    const question = customPrompt || questionInput.value;
    if (!question.trim()) return;

    const chatHistory = document.getElementById("ai-chat-history");
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.innerText = customPrompt ? "Explain current code" : question;
    chatHistory.appendChild(userMsg);
    if (!customPrompt) questionInput.value = "";
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const aiMsg = document.createElement("div");
    aiMsg.className = "chat-msg ai";
    aiMsg.innerText = "Thinking...";
    chatHistory.appendChild(aiMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["gemini_api_key", "gemini_model"]);
        if (!result.gemini_api_key) {
            aiMsg.innerText = "Error: Please set your Gemini API Key in Settings.";
            return;
        }
        const model = document.getElementById("ai-model-selector")?.value || result.gemini_model || "gemini-3-flash-preview";
        try {
            const codeContext = editor.getValue();
            const prompt = customPrompt ? question : `You are a Zoho Deluge expert. Code context:\n\`\`\`deluge\n${codeContext}\n\`\`\`\n\nQuestion: ${question}`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${result.gemini_api_key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: " + (data.error?.message || "Unknown");
            aiMsg.innerHTML = textResponse.replace(/\n/g, "<br>").replace(/\`\`\`deluge/g, "<pre>").replace(/\`\`\`/g, "</pre>");
        } catch (e) {
        console.error("[ZohoIDE] initEditor Error:", e); aiMsg.innerText = "Error: " + e.message; }
    } else {
        aiMsg.innerText = "Error: Extension context unavailable.";
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function explainCode() {
    const code = editor.getValue();
    const prompt = `Please provide a detailed explanation of this Zoho Deluge code.\nInclude:\n1. A quick summary of what the code does.\n2. The main highlights and logic flow.\n3. How it works step-by-step.\n4. Any potential issues or improvements.\n\nCode:\n\`\`\`deluge\n${code}\n\`\`\``;
    askGemini(prompt);
}

if (document.readyState === 'complete') { initEditor(); } else { window.addEventListener('load', initEditor); }

document.getElementById('toggle-right-sidebar')?.addEventListener('click', () => {
    const sidebar = document.getElementById('right-sidebar');
    const icon = document.getElementById('toggle-right-sidebar');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        icon.innerText = '◀';
        sidebar.dataset.oldWidth = sidebar.style.width || '250px';
        sidebar.style.width = ''; // Let CSS take over
    } else {
        icon.innerText = '▶';
        sidebar.style.width = sidebar.dataset.oldWidth || '250px';
    }
    if (editor) editor.layout();
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
    const sidebar = document.getElementById('right-sidebar');
    if (!sidebar) return;

    const width = window.innerWidth - e.clientX;
    if (width > 50 && width < 600) {
        sidebar.classList.remove('collapsed');
        const icon = document.getElementById('toggle-right-sidebar');
        if (icon) icon.innerText = '▶';
        sidebar.style.width = width + 'px';
        if (editor) editor.layout();
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


    // Expose internal functions to window for Cloud UI
    window.updateMappingsList = updateMappingsList;
    window.showStatus = showStatus;
})();
