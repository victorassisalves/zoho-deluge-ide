(function() {
var zideProjectUrl = null;
window.zideProjectUrl = null;
var zideProjectName = "Untitled Project";
window.zideProjectName = zideProjectName;
window.activeCloudFileId = null;

/**
 * Zoho Deluge Advanced IDE v2.0.0
 */

var editor;
var isConnected = false;
var interfaceMappings = {};
var currentResearchReport = "";
var researchPollingInterval = null;

function initEditor() {
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            if (e.key === 'S' || e.key === 's') {
                e.preventDefault();
                pushToZoho(true);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                pushToZoho(true, true);
            } else if (e.key === 'P' || e.key === 'p') {
                e.preventDefault();
                pullFromZoho();
            }
        }
    });
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
                { token: 'key', foreground: '8be9fd' },
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
        if (typeof validateDelugeModel === "function") validateDelugeModel(editor.getModel());
        window.addEventListener('resize', () => { if (editor) editor.layout(); });
    // Ensure editor layouts correctly after initialization
    setTimeout(() => { if (editor) editor.layout(); }, 500);
    setTimeout(() => { if (editor) editor.layout(); }, 2000);



        // Keyboard Shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => { saveLocally(); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => { pushToZoho(true); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => { pushToZoho(true, true); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => { pullFromZoho(); });

        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "CMD_SYNC_SAVE") {
                    pushToZoho(true);
                } else if (request.action === "CMD_SYNC_SAVE_EXECUTE") {
                    pushToZoho(true, true);
                } else if (request.action === "CMD_PULL_CODE") {
                    pullFromZoho();
                }
            });
        }

        editor.onDidChangeModelContent(() => {
            const code = editor.getValue();
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ 'saved_deluge_code': code });
            }
            if (window.validateDelugeModel) window.validateDelugeModel(editor.getModel());
        });

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.get(['saved_deluge_code', 'theme', 'activation_behavior', 'json_mappings', 'left_panel_width', 'right_sidebar_width', 'bottom_panel_height', 'font_size'], (result) => {
                if (result.saved_deluge_code) editor.setValue(result.saved_deluge_code);
        if (typeof initApiExplorer === 'function') initApiExplorer();
        if (typeof syncProblemsPanel === 'function') syncProblemsPanel();
                if (result.theme) monaco.editor.setTheme(result.theme);
                if (result.font_size) {
                    const fs = parseInt(result.font_size);
                    if (fs && editor) {
                        editor.updateOptions({ fontSize: fs });
                        document.getElementById("editor-font-size").value = fs;
                    }
                }
                if (result.activation_behavior) document.getElementById("activation-behavior").value = result.activation_behavior;
                if (result.bottom_panel_height) {
                    const bottomPanel = document.getElementById('bottom-panel');
                    if (bottomPanel) {
                        bottomPanel.style.height = result.bottom_panel_height;
                        document.documentElement.style.setProperty('--footer-height', result.bottom_panel_height);
                    }
                }
                                if (result.left_panel_width) {
                    const leftPanel = document.getElementById('left-panel-content');
                    if (leftPanel) {
                        leftPanel.style.width = result.left_panel_width;
                        leftPanel.style.setProperty('--left-sidebar-width', result.left_panel_width);
                    }
                }
                if (result.right_sidebar_width) {
                    const rightSidebar = document.getElementById("right-sidebar");
                    if (rightSidebar) rightSidebar.style.width = result.right_sidebar_width;
                }
                setTimeout(() => { if (editor) editor.layout(); }, 200);
                if (result.json_mappings) {
                    interfaceMappings = result.json_mappings;
                    window.interfaceMappings = interfaceMappings;
                    updateInterfaceMappingsList();
                }
            });
        }



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
        interfaceMappings = projectMappings[zideProjectUrl] || {};
        updateInterfaceMappingsList();
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

    bind('activation-behavior', 'change', (e) => {        const behavior = e.target.value;        if (typeof chrome !== "undefined" && chrome.storage) {            chrome.storage.local.set({ 'activation_behavior': behavior });        }    });
    bind('theme-selector', 'change', (e) => {
        const theme = e.target.value;
        monaco.editor.setTheme(theme);
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'theme': theme });
        }
    });

    bind('editor-font-size', 'input', (e) => {
        let fs = parseInt(e.target.value);
        if (fs) {
            if (fs > 30) fs = 30;
            if (fs < 8) fs = 8;
            if (editor) editor.updateOptions({ fontSize: fs });
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ 'font_size': fs });
            }
        }
    });


    // AI Agents Logic



    // Tab Switching
    document.querySelectorAll('.ai-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.agent-view').forEach(v => v.classList.remove('active'));
            tab.classList.add('active');
            const agent = tab.getAttribute('data-agent');
            document.getElementById(`agent-${agent}-view`).classList.add('active');
        });
    });

    bind('ai-research-btn', 'click', startDeepResearch);
    bind('ai-research-goal', 'keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) startDeepResearch();
    });
    bind('ai-redo-plan-btn', 'click', () => {
        const resContainer = document.getElementById('research-result-container');
        if (resContainer) resContainer.style.display = 'none';
        const goalInput = document.getElementById('ai-research-goal');
        if (goalInput) goalInput.focus();
    });
    bind('ai-build-this-btn', 'click', handoffToArchitecture);

    async function startDeepResearch() {
        const goalInput = document.getElementById('ai-research-goal');
        const goal = goalInput ? goalInput.value.trim() : "";
        if (!goal) return;

        const progressContainer = document.getElementById('research-progress-container');
        const resultContainer = document.getElementById('research-result-container');
        const progressFill = document.getElementById('research-progress-fill');
        const percentText = document.getElementById('research-percent');
        const statusText = document.getElementById('research-status-text');

        if (progressContainer) progressContainer.style.display = 'block';
        if (resultContainer) resultContainer.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        if (percentText) percentText.innerText = '0%';
        if (statusText) statusText.innerText = 'Initializing...';

        const result = await chrome.storage.local.get(["gemini_api_key"]);
        if (!result.gemini_api_key) {
            if (statusText) statusText.innerText = "Error: Set API Key in Settings.";
            return;
        }

        try {
            const codeContext = editor.getValue();
            const prompt = `Task for Deep Research: ${goal}\n\nCurrent Code Context:\n` + "```deluge\n" + codeContext + "\n```\n" + `Please research the best approach to solve this task, considering Zoho environment limitations and best practices. Provide a detailed architecture and scope.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": result.gemini_api_key
                },
                body: JSON.stringify({
                    input: prompt,
                    agent: "deep-research-pro-preview-12-2025",
                    background: true
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const interactionId = data.id;
            pollResearch(interactionId, result.gemini_api_key);

        } catch (e) {
            if (statusText) statusText.innerText = "Error: " + e.message;
        }
    }

    function pollResearch(id, apiKey) {
        let progress = 5;
        updateProgress(progress, "Planning research steps...");

        if (researchPollingInterval) clearInterval(researchPollingInterval);

        researchPollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions/${id}`, {
                    headers: { "x-goog-api-key": apiKey }
                });
                const data = await response.json();

                if (progress < 90) {
                    progress += Math.random() * 3;
                    updateProgress(progress, "Searching and analyzing documentation...");
                }

                if (data.status === 'completed') {
                    clearInterval(researchPollingInterval);
                    updateProgress(100, "Research Complete");
                    const report = data.outputs?.[data.outputs.length - 1]?.text || "No output generated.";
                    showResearchResult(report);
                } else if (data.status === 'failed') {
                    clearInterval(researchPollingInterval);
                    const st = document.getElementById('research-status-text');
                    if (st) st.innerText = "Error: Research failed.";
                }
            } catch (e) {
                clearInterval(researchPollingInterval);
                const st = document.getElementById('research-status-text');
                if (st) st.innerText = "Polling Error: " + e.message;
            }
        }, 5000);
    }

    function updateProgress(percent, status) {
        const progressFill = document.getElementById('research-progress-fill');
        const percentText = document.getElementById('research-percent');
        const statusText = document.getElementById('research-status-text');
        if (progressFill) progressFill.style.width = percent + '%';
        if (percentText) percentText.innerText = Math.round(percent) + '%';
        if (status && statusText) statusText.innerText = status;
    }

    function showResearchResult(report) {
        currentResearchReport = report;
        const resContainer = document.getElementById('research-result-container');
        const reportEdit = document.getElementById('research-report-edit');
        if (resContainer) resContainer.style.display = 'flex';
        if (reportEdit) reportEdit.value = report;
    }

    function handoffToArchitecture() {
        const reportEdit = document.getElementById('research-report-edit');
        const report = reportEdit ? reportEdit.value : "";
        currentResearchReport = report;

        const archTab = document.querySelector('.ai-tab[data-agent="architecture"]');
        if (archTab) archTab.click();

        const summary = document.getElementById('arch-plan-summary');
        if (summary) {
            summary.innerHTML = `<strong>Active Plan:</strong><br>` + report.substring(0, 300).replace(/\n/g, '<br>') + `...`;
        }

        const chatHistory = document.getElementById("ai-chat-history");
        if (chatHistory) {
            const aiMsg = document.createElement("div");
            aiMsg.className = "chat-msg ai";
            aiMsg.innerText = "Plan received. I am ready to build the solution in Deluge/Client Script following best practices. How can I help you implement this plan?";
            chatHistory.appendChild(aiMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    bind('save-settings-btn', 'click', () => {
        const key = document.getElementById('gemini-api-key').value;
        const model = document.getElementById('gemini-model').value;
        let fontSize = document.getElementById('editor-font-size').value;

        // Handle font size
        let fs = parseInt(fontSize);
        if (fs) {
            if (fs > 30) fs = 30;
            if (fs < 8) fs = 8;
            fontSize = fs;
            if (editor) editor.updateOptions({ fontSize: fs });
            document.getElementById('editor-font-size').value = fs;
        }

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({
                'gemini_api_key': key,
                'gemini_model': model,
                'activation_behavior': document.getElementById('activation-behavior').value,
                'font_size': fontSize
            }, () => {
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

    bind('interface-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Convert JSON to Deluge Map';
        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'block';
        document.getElementById('modal-map-only').style.display = 'none';
        document.getElementById('interface-modal').style.display = 'flex';
    });

    bind('add-interface-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Add JSON Mapping for Autocomplete';
        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'none';
        document.getElementById('modal-map-only').style.display = 'block';
        document.getElementById('interface-modal').style.display = 'flex';
    });

    bind('modal-cancel', 'click', () => { document.getElementById('interface-modal').style.display = 'none'; });

        bind('modal-convert', 'click', () => {
        const varName = document.getElementById('interface-var-name').value || 'payload';
        const jsonStr = document.getElementById('interface-input').value;
        const style = document.getElementById('gen-style').value;
        const update = document.getElementById('gen-update').checked;
        try {
            const code = convertInterfaceToDeluge(varName, jsonStr, { style, update });
            editor.executeEdits('json-convert', [{ range: editor.getSelection(), text: code }]);
            document.getElementById('interface-modal').style.display = 'none';
        } catch (e) {
            console.error("[ZohoIDE] modal-convert Error:", e);
            alert('Invalid JSON: ' + e.message);
        }
    });

    bind('modal-map-only', 'click', () => {
        const name = document.getElementById('interface-var-name').value || 'mapping';
        const jsonStr = document.getElementById('interface-input').value;
        saveInterfaceMapping(name, jsonStr);
        document.getElementById('interface-modal').style.display = 'none';
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


}

function convertInterfaceToDeluge(varName, jsonStr, options = {}) {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    const style = options.style || 'step'; // 'step' or 'inline'
    const isUpdate = options.update || false;
    let code = "";
    let varCounter = 0;

    if (style === 'inline') {
        function toInline(val) {
            if (Array.isArray(val)) {
                return "{" + val.map(item => toInline(item)).join(", ") + "}";
            } else if (typeof val === "object" && val !== null) {
                let parts = [];
                for (const key in val) {
                    if (key.startsWith("$")) continue;
                    parts.push(`"${key}": ${toInline(val[key])}`);
                }
                return "{" + parts.join(", ") + "}";
            } else {
                if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
                return val;
            }
        }
        return `${varName} = ${toInline(obj)};`;
    }

    // Step-by-step logic (improved)
    function processValue(val, name) {
        if (Array.isArray(val)) {
            const listVar = name || `list_${++varCounter}`;
            code += `${listVar} = List();
`;
            val.forEach(item => {
                const itemVal = processValue(item);
                code += `${listVar}.add(${itemVal});
`;
            });
            return listVar;
        } else if (typeof val === "object" && val !== null) {
            const mapVar = name || `map_${++varCounter}`;
            if (!isUpdate || name !== varName) {
                code += `${mapVar} = Map();
`;
            }
            for (const key in val) {
                    if (key.startsWith("$")) continue;
                const memberVal = processValue(val[key]);
                code += `${mapVar}.put("${key}", ${memberVal});
`;
            }
            return mapVar;
        } else {
            if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
            return val;
        }
    }

    processValue(obj, varName);
    return code;
}

function saveInterfaceMapping(name, jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);
        interfaceMappings[name] = obj;
        saveCurrentMappings();
        updateInterfaceMappingsList();
    } catch (e) {
        console.error("[ZohoIDE] saveInterfaceMapping Error:", e);
        alert('Invalid JSON: ' + e.message);
    }
}

function saveCurrentMappings() {
    if (typeof chrome !== "undefined" && chrome.storage) {
        if (zideProjectUrl) {
            chrome.storage.local.get(['project_mappings'], (result) => {
                const projectMappings = result.project_mappings || {};
                projectMappings[zideProjectUrl] = interfaceMappings;
                chrome.storage.local.set({ 'project_mappings': projectMappings });
            });
        } else {
            chrome.storage.local.set({ 'json_mappings': interfaceMappings });
        }
    }
}

function updateInterfaceMappingsList() {
    const list = document.getElementById('interface-mappings-list');
    if (!list) return;
    list.innerHTML = '';
    Object.keys(interfaceMappings).forEach(name => {
        const item = document.createElement('div');
        item.className = 'mapping-item';

        const nameSpan = document.createElement('span');
        nameSpan.innerText = name;
        nameSpan.style.flex = '1';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';

        const copyAllBtn = document.createElement('span');
        copyAllBtn.innerHTML = '📋';
        copyAllBtn.title = 'Copy as Deluge Map';
        copyAllBtn.style.cursor = 'pointer';
        copyAllBtn.onclick = (e) => {
            e.stopPropagation();
            const code = convertInterfaceToDeluge(name, JSON.stringify(interfaceMappings[name]));
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code);
                showStatus('Map code copied to clipboard', 'success');
            }
        };

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-mapping';
        deleteBtn.innerHTML = '×';
        deleteBtn.style.opacity = '1';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete mapping "${name}"?`)) {
                delete interfaceMappings[name];
                saveCurrentMappings();
                updateInterfaceMappingsList();
            }
        };

        actions.appendChild(copyAllBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(nameSpan);
        item.appendChild(actions);

        item.onclick = () => {
            document.querySelectorAll('.mapping-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderInterfaceTree(name, interfaceMappings[name]);
        };
        list.appendChild(item);
    });
}

function renderInterfaceTree(mappingName, obj) {
    const tree = document.getElementById('interface-tree-view');
    if (!tree) return;
    tree.innerHTML = '';

    function buildTree(data, container, path = "", depth = 0) {
        if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            keys.forEach(key => {
                const val = data[key];
                const isObject = typeof val === 'object' && val !== null;
                const isArray = Array.isArray(val);
                const currentPath = Array.isArray(data) ? `.get(${key})` : `.get("${key}")`;
                const fullPath = mappingName + path + currentPath;

                const node = document.createElement('div');
                node.className = 'tree-node';
                node.setAttribute('data-key', key.toLowerCase());

                const label = document.createElement('div');
                label.className = 'tree-label';

                let iconHtml = '';
                if (isObject) {
                    iconHtml = '<span class="toggle-icon">▼</span><span class="node-icon">📁</span>';
                } else {
                    iconHtml = '<span class="toggle-icon" style="visibility:hidden">▼</span><span class="node-icon">📄</span>';
                }

                const keyHtml = `<span class="tree-key">${key}</span>`;
                let valHtml = '';
                let typeHtml = `<span class="tree-type">${isArray ? 'List' : (isObject ? 'Map' : typeof val)}</span>`;

                if (!isObject) {
                    valHtml = `: <span class="tree-val">${JSON.stringify(val)}</span>`;
                } else {
                    valHtml = `: ${isArray ? '[' : '{'}`;
                }

                label.innerHTML = `${iconHtml} ${keyHtml}${valHtml} ${typeHtml}`;

                // Actions container
                const actions = document.createElement('div');
                actions.className = 'tree-actions';

                const copyPathBtn = document.createElement('button');
                copyPathBtn.className = 'tree-action-btn';
                copyPathBtn.innerText = 'Path';
                copyPathBtn.title = 'Insert Path';
                copyPathBtn.onclick = (e) => {
                    e.stopPropagation();
                    editor.executeEdits("tree-insert", [{ range: editor.getSelection(), text: fullPath }]);
                };

                const copyMapBtn = document.createElement('button');
                copyMapBtn.className = 'tree-action-btn';
                copyMapBtn.innerText = 'Map';
                copyMapBtn.title = 'Generate Map for this node';
                copyMapBtn.onclick = (e) => {
                    e.stopPropagation();
                    const varName = prompt('Variable name for this map:', key);
                    if (varName) {
                        const style = confirm('Use inline nested style? (Cancel for step-by-step)') ? 'inline' : 'step';
                        const code = convertInterfaceToDeluge(varName, val, { style });
                        editor.executeEdits("tree-insert-map", [{ range: editor.getSelection(), text: code }]);
                    }
                };

                actions.appendChild(copyPathBtn);
                if (isObject) actions.appendChild(copyMapBtn);
                label.appendChild(actions);

                node.appendChild(label);

                if (isObject) {
                    const subContainer = document.createElement('div');
                    subContainer.className = 'tree-sub';
                    buildTree(val, subContainer, path + currentPath, depth + 1);
                    node.appendChild(subContainer);

                    const footer = document.createElement('div');
                    footer.className = 'tree-footer';
                    footer.style.marginLeft = '20px';
                    footer.style.opacity = '0.5';
                    footer.innerText = isArray ? ']' : '}';
                    node.appendChild(footer);

                    label.onclick = () => {
                        subContainer.classList.toggle('collapsed');
                        label.querySelector('.toggle-icon').classList.toggle('collapsed');
                        footer.style.display = subContainer.classList.contains('collapsed') ? 'none' : 'block';
                    };
                } else {
                    label.onclick = () => {
                        editor.executeEdits("tree-insert", [{ range: editor.getSelection(), text: fullPath }]);
                    };
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
        statusEl.innerText = message; statusEl.style.cursor = "pointer"; statusEl.onclick = () => { showStatus("Reconnecting..."); checkConnection(); };
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

    // Check for errors
    const markers = monaco.editor.getModelMarkers({ resource: editor.getModel().uri });
    const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
    if (errors.length > 0) {
        log('Error', 'Fix syntax errors before pushing to Zoho.');
        showStatus('Push Blocked: Errors', 'error');
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
                        else log('Warning', 'Zoho Save trigger returned false. Try clicking manually.');
                    });
                }
                if (triggerExecute) {
                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' }, (res) => {
                        if (res && res.success) log('Success', 'Zoho Execute triggered.');
                        else log('Warning', 'Zoho Execute trigger returned false. Try clicking manually.');
                    });
                }
            } else { log('Error', response?.error || 'Push failed.'); }
        });
    }
}

function saveLocally() {
    // Check for errors
    const markers = monaco.editor.getModelMarkers({ resource: editor.getModel().uri });
    const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
    if (errors.length > 0) {
        showStatus('Cloud Sync Paused: Errors', 'warning');
        // We still allow local storage save but maybe skip cloud sync if it's a hard error
    }

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
            interfaceMappings: window.interfaceMappings || {},
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
    userMsg.innerText = customPrompt ? (customPrompt.length > 50 ? "Refining code..." : customPrompt) : question;
    if (chatHistory) {
        chatHistory.appendChild(userMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    if (!customPrompt) questionInput.value = "";

    const aiMsg = document.createElement("div");
    aiMsg.className = "chat-msg ai";
    aiMsg.innerText = "Generating code...";
    if (chatHistory) {
        chatHistory.appendChild(aiMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["gemini_api_key", "gemini_model"]);
        if (!result.gemini_api_key) {
            aiMsg.innerText = "Error: Please set your Gemini API Key in Settings.";
            return;
        }
        const model = document.getElementById("gemini-model")?.value || result.gemini_model || "gemini-3-flash-preview";
        try {
            const codeContext = editor.getValue();
            let prompt = `You are a Zoho expert specializing in Deluge and Client Scripts.
Focus on best practices and clean naming conventions.

Current Code Context:
` + "```deluge\n" + codeContext + "\n```\n\n";

            if (currentResearchReport) {
                prompt += `Architectural Plan to follow:
---
${currentResearchReport}
---

`;
            }

            prompt += `User Question/Task: ${question}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${result.gemini_api_key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: " + (data.error?.message || "Unknown");
            aiMsg.innerHTML = textResponse.replace(/\n/g, "<br>").replace(/```deluge/g, "<pre>").replace(/```/g, "</pre>");
        } catch (e) {
            console.error("[ZohoIDE] askGemini Error:", e);
            aiMsg.innerText = "Error: " + e.message;
        }
    } else {
        aiMsg.innerText = "Error: Extension context unavailable.";
    }
    if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
}

function explainCode() {
    const code = editor.getValue();
    const prompt = `Please provide a detailed explanation of this Zoho Deluge code.\nInclude:\n1. A quick summary of what the code does.\n2. The main highlights and logic flow.\n3. How it works step-by-step.\n4. Any potential issues or improvements.\n\nCode:\n` + "```deluge\n" + code + "\n```";
    askGemini(prompt);
}


if (document.readyState === 'complete') { initEditor(); } else { window.addEventListener('load', initEditor); }

function toggleRightSidebar() {
    const sidebar = document.getElementById('right-sidebar');
    const resizer = document.getElementById('right-sidebar-resizer');
    if (!sidebar) return;

    const isNowCollapsing = !sidebar.classList.contains('collapsed');

    if (isNowCollapsing) {
        // Save current width before collapsing
        const currentWidth = sidebar.getBoundingClientRect().width;
        sidebar.dataset.oldWidth = currentWidth + 'px';
        sidebar.classList.add('collapsed');
        if (resizer) resizer.classList.add('collapsed');
        sidebar.style.width = ''; // Let CSS take over for collapsed state
    } else {
        sidebar.classList.remove('collapsed');
        if (resizer) resizer.classList.remove('collapsed');
        sidebar.style.width = sidebar.dataset.oldWidth || '250px';
    }

    if (editor) {
        setTimeout(() => editor.layout(), 0);
        setTimeout(() => editor.layout(), 300); // After transition
    }
}

document.getElementById('toggle-right-sidebar')?.addEventListener('click', toggleRightSidebar);
document.getElementById('toggle-right-sidebar-top')?.addEventListener('click', toggleRightSidebar);

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

// Resizing Sidebars
let isResizingRight = false;
let isResizingLeft = false;
let isResizingBottom = false;

document.getElementById('bottom-resizer')?.addEventListener('mousedown', (e) => {
    isResizingBottom = true;
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
});

document.getElementById('left-resizer')?.addEventListener('mousedown', (e) => {
    isResizingLeft = true;
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
});

document.getElementById('right-sidebar-resizer')?.addEventListener('mousedown', (e) => {
    isResizingRight = true;
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
});

window.addEventListener('mousemove', (e) => {
    if (isResizingBottom) {
        const bottomPanel = document.getElementById('bottom-panel');
        const height = window.innerHeight - e.clientY;
        if (height > 50 && height < window.innerHeight * 0.8) {
            bottomPanel.style.height = height + 'px';
            document.documentElement.style.setProperty('--footer-height', height + 'px');
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ 'bottom_panel_height': height + 'px' });
            }
            if (editor) editor.layout();
        }
    }
    if (isResizingRight) {
        const sidebar = document.getElementById('right-sidebar');
        if (!sidebar) return;
        const width = window.innerWidth - e.clientX;
        if (width > 50 && width < 600) {
            sidebar.classList.remove('collapsed');
            sidebar.style.width = width + 'px';
            if (editor) editor.layout();
        }
    } else if (isResizingLeft) {
        const leftPanel = document.getElementById('left-panel-content');
        if (!leftPanel) return;
        const sidebarWidth = document.getElementById('sidebar')?.offsetWidth || 48;
        const width = e.clientX - sidebarWidth;
        if (width > 150 && width < 600) {
            leftPanel.style.width = width + 'px';
            leftPanel.style.setProperty('--left-sidebar-width', width + 'px');
            if (editor) editor.layout();
        }
    }
});

window.addEventListener('mouseup', () => {
    if (isResizingLeft) {
        const leftPanel = document.getElementById('left-panel-content');
        if (leftPanel && typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'left_panel_width': leftPanel.style.width });
        }
    }
    if (isResizingRight) {
        const rightSidebar = document.getElementById('right-sidebar');
        if (rightSidebar && typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'right_sidebar_width': rightSidebar.style.width });
        }
    }
    if (isResizingBottom) {
        const bottomPanel = document.getElementById('bottom-panel');
        if (bottomPanel && typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'bottom_panel_height': bottomPanel.style.height });
        }
    }
    isResizingRight = false;
    isResizingLeft = false;
    isResizingBottom = false;
    document.body.style.userSelect = 'auto';
    document.body.classList.remove('resizing');
});

// Interface Search

let searchTimeout;
document.getElementById('interface-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const term = e.target.value.toLowerCase();
        const nodes = document.querySelectorAll('#interface-tree-view .tree-node');
        nodes.forEach(node => {
            const key = node.getAttribute('data-key');
            if (key && key.includes(term)) {
                node.classList.remove('hidden');
                let p = node.parentElement;
                while (p && p.id !== 'interface-tree-view') {
                    if (p.classList.contains('tree-node')) p.classList.remove('hidden');
                    p = p.parentElement;
                }
            } else if (term) {
                node.classList.add('hidden');
            } else {
                node.classList.remove('hidden');
            }
        });
    }, 300);
});

    // Expose internal functions to window for Cloud UI
    window.updateInterfaceMappingsList = updateInterfaceMappingsList;
    window.showStatus = showStatus;

    function syncProblemsPanel() {
        const list = document.getElementById('problems-list');
        if (!list) return;

        if (!editor) return;
        const model = editor.getModel();
        if (!model) return;

        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        list.innerHTML = '';

        if (markers.length === 0) {
            list.innerHTML = '<div class="log-entry">No problems detected.</div>';
            return;
        }

        markers.forEach(m => {
            const item = document.createElement('div');
            item.className = 'problem-item';
            const sevClass = m.severity === monaco.MarkerSeverity.Error ? 'problem-severity-error' : 'problem-severity-warning';
            const sevText = m.severity === monaco.MarkerSeverity.Error ? 'Error' : 'Warning';

            item.innerHTML = `
                <span class="${sevClass}">[${sevText}]</span>
                <span class="problem-msg">${m.message}</span>
                <span class="problem-loc">Ln ${m.startLineNumber}, Col ${m.startColumn}</span>
            `;

            item.onclick = () => {
                editor.setPosition({ lineNumber: m.startLineNumber, column: m.startColumn });
                editor.revealLineInCenter(m.startLineNumber);
                editor.focus();
            };

            list.appendChild(item);
        });
    }
    window.syncProblemsPanel = syncProblemsPanel;

})();