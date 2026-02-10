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
var interfaceMappings = {};
var currentResearchReport = "";
var researchPollingInterval = null;

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
            chrome.storage.local.get(['saved_deluge_code', 'theme', 'activation_behavior', 'json_mappings', 'left_panel_width', 'right_sidebar_width', 'bottom_panel_height'], (result) => {
                if (result.saved_deluge_code) editor.setValue(result.saved_deluge_code);
        if (typeof initApiExplorer === 'function') initApiExplorer();
        if (typeof syncProblemsPanel === 'function') syncProblemsPanel();
                if (result.theme) monaco.editor.setTheme(result.theme);
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
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'gemini_api_key': key, 'gemini_model': model, 'activation_behavior': document.getElementById('activation-behavior').value }, () => {
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

    const resetInterfaceModal = (defaultVar = 'payload') => {
        document.getElementById('interface-var-name').value = defaultVar;
        document.getElementById('interface-input').value = '';
        const errorDisplay = document.getElementById('modal-error-display');
        if (errorDisplay) errorDisplay.style.display = 'none';
    };

    bind('interface-btn', 'click', () => {
        resetInterfaceModal();
        document.getElementById('modal-title').innerText = 'Convert JSON to Deluge Map';
        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'block';
        document.getElementById('modal-map-only').style.display = 'none';
        document.getElementById('interface-modal').style.display = 'flex';
    });

    bind('add-interface-btn', 'click', () => {
        resetInterfaceModal('mapping');
        document.getElementById('modal-title').innerText = 'Add JSON Mapping for Autocomplete';
        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'none';
        document.getElementById('modal-map-only').style.display = 'block';
        document.getElementById('interface-modal').style.display = 'flex';
    });

    const closeModal = () => { document.getElementById('interface-modal').style.display = 'none'; };
    bind('modal-cancel', 'click', closeModal);
    bind('modal-close-x', 'click', closeModal);

    const interfaceInput = document.getElementById('interface-input');
    if (interfaceInput) {
        interfaceInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                interfaceInput.value = tryFixJson(interfaceInput.value);
                validateModalJson();
            }, 10);
        });
        interfaceInput.addEventListener('input', validateModalJson);
    }

    bind('modal-convert', 'click', () => {
        const varName = document.getElementById('interface-var-name').value || 'payload';
        let jsonStr = document.getElementById('interface-input').value;
        const style = document.getElementById('gen-style').value;
        const update = document.getElementById('gen-update').checked;

        // Auto-fix on submit too
        jsonStr = tryFixJson(jsonStr);
        document.getElementById('interface-input').value = jsonStr;

        try {
            const code = convertInterfaceToDeluge(varName, jsonStr, { style, update });
            editor.executeEdits('json-convert', [{ range: editor.getSelection(), text: code }]);
            closeModal();
        } catch (e) {
            console.error("[ZohoIDE] modal-convert Error:", e);
            const errorDisplay = document.getElementById('modal-error-display');
            if (errorDisplay) {
                errorDisplay.innerText = "Error: " + e.message;
                errorDisplay.style.color = "#f44747";
                errorDisplay.style.display = "block";
            } else {
                alert('Invalid JSON: ' + e.message);
            }
        }
    });

    bind('modal-map-only', 'click', () => {
        const name = document.getElementById('interface-var-name').value || 'mapping';
        let jsonStr = document.getElementById('interface-input').value;

        jsonStr = tryFixJson(jsonStr);
        document.getElementById('interface-input').value = jsonStr;

        if (saveInterfaceMapping(name, jsonStr)) {
            closeModal();
        } else {
            const errorDisplay = document.getElementById('modal-error-display');
            if (errorDisplay) {
                errorDisplay.innerText = "Invalid JSON. Please fix it before saving.";
                errorDisplay.style.color = "#f44747";
                errorDisplay.style.display = "block";
            }
        }
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

function tryFixJson(str) {
    if (!str || str.trim() === "") return "";

    let processed = str.trim();

    // Attempt 1: Standard JSON parse
    try {
        return JSON.stringify(JSON.parse(processed), null, 4);
    } catch (e) {
        // Fallback: Try to fix common issues

        // 1. Fix unquoted keys
        // Handles { key: "value" } and { , key: "value" }
        processed = processed.replace(/([{,]\s*)([a-zA-Z0-9_$-]+)\s*:/g, '$1"$2":');
        // Handles start of object: {key: "value"}
        processed = processed.replace(/(^\s*{\s*)([a-zA-Z0-9_$-]+)\s*:/, '$1"$2":');

        // 2. Fix single quotes to double quotes for keys and string values
        // Safer approach: replace single-quoted strings with double-quoted ones
        processed = processed.replace(/(['])((?:\\\1|.)*?)\1/g, (match, quote, content) => {
            return '"' + content.replace(/"/g, '\\"') + '"';
        });

        // 3. Remove trailing commas
        processed = processed.replace(/,\s*([\]}])/g, '$1');

        try {
            return JSON.stringify(JSON.parse(processed), null, 4);
        } catch (e2) {
            // If still failing, return the best effort fixed string
            return processed;
        }
    }
}

function validateModalJson() {
    const input = document.getElementById('interface-input').value;
    const errorDisplay = document.getElementById('modal-error-display');
    const convertBtn = document.getElementById('modal-convert');
    const saveBtn = document.getElementById('modal-map-only');

    if (!errorDisplay) return false;

    try {
        if (input.trim() === "") {
            errorDisplay.style.display = "none";
            return false;
        }
        JSON.parse(input);
        errorDisplay.innerText = "✓ Valid JSON";
        errorDisplay.style.color = "#4ec9b0";
        errorDisplay.style.display = "block";
        if (convertBtn) convertBtn.disabled = false;
        if (saveBtn) saveBtn.disabled = false;
        return true;
    } catch (e) {
        errorDisplay.innerText = "Invalid JSON: " + e.message;
        errorDisplay.style.color = "#f44747";
        errorDisplay.style.display = "block";
        // We don't disable buttons because tryFixJson might handle it during the actual action,
        // but it's better to show the error.
        return false;
    }
}

function convertInterfaceToDeluge(varName, jsonStr, options = {}) {
    let obj;
    try {
        obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    } catch (e) {
        // Try one last fix attempt
        try {
            obj = JSON.parse(tryFixJson(jsonStr));
        } catch (e2) {
            throw new Error("Could not parse JSON even after fix attempts.");
        }
    }
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
        return true;
    } catch (e) {
        console.error("[ZohoIDE] saveInterfaceMapping Error:", e);
        return false;
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
    const noMappingsMsg = document.getElementById('no-mappings-msg');
    if (!list) return;

    list.innerHTML = '';
    const keys = Object.keys(interfaceMappings);

    if (noMappingsMsg) {
        noMappingsMsg.style.display = keys.length === 0 ? 'block' : 'none';
    }

    keys.forEach(name => {
        const container = document.createElement('div');
        container.className = 'mapping-item-container';
        container.id = `mapping-${name}`;

        const header = document.createElement('div');
        header.className = 'mapping-item-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'var-name';
        nameSpan.innerText = name;

        const actions = document.createElement('div');
        actions.className = 'mapping-item-actions';

        const editBtn = document.createElement('span');
        editBtn.innerHTML = '✎';
        editBtn.title = 'Edit JSON';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('modal-title').innerText = 'Edit Interface Mapping';
            document.getElementById('interface-var-name').value = name;
            document.getElementById('interface-input').value = JSON.stringify(interfaceMappings[name], null, 4);
            document.getElementById('modal-var-container').style.display = 'block';
            document.getElementById('modal-convert').style.display = 'none';
            document.getElementById('modal-map-only').style.display = 'block';
            document.getElementById('interface-modal').style.display = 'flex';
            validateModalJson();
        };

        const copyAllBtn = document.createElement('span');
        copyAllBtn.innerHTML = '📋';
        copyAllBtn.title = 'Copy as Deluge Map';
        copyAllBtn.onclick = (e) => {
            e.stopPropagation();
            const code = convertInterfaceToDeluge(name, JSON.stringify(interfaceMappings[name]));
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code);
                showStatus('Map code copied to clipboard', 'success');
            }
        };

        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete';
        deleteBtn.style.fontSize = '18px';
        deleteBtn.style.color = '#f44747';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete mapping "${name}"?`)) {
                delete interfaceMappings[name];
                saveCurrentMappings();
                updateInterfaceMappingsList();
            }
        };

        actions.appendChild(editBtn);
        actions.appendChild(copyAllBtn);
        actions.appendChild(deleteBtn);

        header.appendChild(nameSpan);
        header.appendChild(actions);

        const treeView = document.createElement('div');
        treeView.className = 'mapping-item-tree';
        treeView.style.display = 'none';

        header.onclick = () => {
            const isOpen = treeView.style.display !== 'none';

            // Close all other accordions
            document.querySelectorAll('.mapping-item-tree').forEach(t => t.style.display = 'none');
            document.querySelectorAll('.mapping-item-header').forEach(h => h.classList.remove('active'));

            if (!isOpen) {
                treeView.style.display = 'block';
                header.classList.add('active');
                renderInterfaceTree(name, interfaceMappings[name], treeView);
                // Scroll header into view if it's sticky but maybe hidden
                header.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        container.appendChild(header);
        container.appendChild(treeView);
        list.appendChild(container);
    });
}

function makeValueEditable(el, parentObj, key) {
    const originalVal = parentObj[key];
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tree-val-edit';

    // Don't stringify if it's already a string, to avoid extra quotes
    input.value = typeof originalVal === 'string' ? originalVal : JSON.stringify(originalVal);

    const save = () => {
        let newVal = input.value;
        try {
            // Attempt to preserve types for non-strings
            if (newVal === 'true') newVal = true;
            else if (newVal === 'false') newVal = false;
            else if (newVal === 'null') newVal = null;
            else if (!isNaN(newVal) && newVal.trim() !== "") {
                newVal = Number(newVal);
            } else {
                // Check if it's a JSON string (like a list or map being inserted as a string)
                try {
                    const parsed = JSON.parse(newVal);
                    if (typeof parsed !== 'string') newVal = parsed;
                } catch (e) {
                    // Keep as string
                }
            }

            parentObj[key] = newVal;
            el.innerText = JSON.stringify(newVal);
            saveCurrentMappings();
            if (window.showStatus) showStatus('Value updated locally', 'success');
        } catch (e) {
            el.innerText = JSON.stringify(originalVal);
        }
        input.replaceWith(el);
    };

    input.onblur = save;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') {
            input.replaceWith(el);
        }
    };

    el.replaceWith(input);
    input.style.width = Math.max(input.value.length * 8, 50) + 'px';
    input.focus();
    input.select();
}

function renderInterfaceTree(mappingName, obj, container) {
    const tree = container || document.getElementById('interface-tree-view');
    if (!tree) return;
    tree.innerHTML = '';

    // If it's the standalone tree view, we might want a header.
    // In accordion mode, the header is already there.
    if (tree.id === 'interface-tree-view') {
        const header = document.createElement('div');
        header.className = 'tree-sticky-header';
        header.innerText = mappingName;
        tree.appendChild(header);
    }

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

                const keySpan = document.createElement('span');
                keySpan.className = 'tree-key';
                keySpan.innerText = key;

                const typeSpan = document.createElement('span');
                typeSpan.className = 'tree-type';
                typeSpan.innerText = isArray ? 'List' : (isObject ? 'Map' : typeof val);

                label.innerHTML = iconHtml;
                label.appendChild(keySpan);

                if (!isObject) {
                    const colon = document.createTextNode(': ');
                    label.appendChild(colon);

                    const valSpan = document.createElement('span');
                    valSpan.className = 'tree-val';
                    valSpan.innerText = JSON.stringify(val);
                    valSpan.title = 'Click to edit';
                    valSpan.onclick = (e) => {
                        e.stopPropagation();
                        makeValueEditable(valSpan, data, key);
                    };
                    label.appendChild(valSpan);
                } else {
                    const colon = document.createTextNode(`: ${isArray ? '[' : '{'}`);
                    label.appendChild(colon);
                }

                label.appendChild(typeSpan);

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

document.getElementById('toggle-right-sidebar')?.addEventListener('click', () => {
    const sidebar = document.getElementById('right-sidebar');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        sidebar.dataset.oldWidth = sidebar.style.width || '250px';
        sidebar.style.width = ''; // Let CSS take over
    } else {
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