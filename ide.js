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
var lastActionTime = 0;

var AppState = {
    activeTabs: [], // { id, name, isModified }
    models: {}, // id -> { model, originalCode }
    currentFileId: null,
    onlineIds: new Set(),
    isBlacklisted: false,
    virtualLists: {}
};
window.AppState = AppState;

// Robust service access
const getFileManager = () => window.FileManager || { getFile: async () => null, getAllFilesMetadata: async () => [], saveFile: async () => {} };
const getInterfaceManager = () => window.InterfaceManager || { getInterfacesByOwner: async () => [], resolveInterface: async () => null };

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
                { token: '', foreground: 'f8f8f2' },
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
                { token: 'brackets', foreground: 'f8f8f2' },
                { token: 'tag', foreground: 'ff79c6' },
                { token: 'attribute.name', foreground: '50fa7b' },
                { token: 'attribute.value', foreground: 'f1fa8c' }
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
            wordBasedSuggestions: false,
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

        // Force language and theme after a short delay to ensure registry is ready
        setTimeout(() => {
            if (editor) {
                monaco.editor.setModelLanguage(editor.getModel(), 'deluge');
                monaco.editor.setTheme('dracula');
            }
        }, 1000);

        if (typeof validateDelugeModel === "function") validateDelugeModel(editor.getModel());
        window.addEventListener('resize', () => { if (editor) editor.layout(); });
    // Ensure editor layouts correctly after initialization
    setTimeout(() => { if (editor) editor.layout(); }, 500);
    setTimeout(() => { if (editor) editor.layout(); }, 2000);



        // Keyboard Shortcuts & Overrides
        editor.addAction({
            id: 'zide-save-local',
            label: 'Save Locally',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => { saveLocally(); }
        });
        editor.addAction({
            id: 'zide-push-zoho',
            label: 'Push to Zoho',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
            run: () => { pushToZoho(true); }
        });
        editor.addAction({
            id: 'zide-push-execute-zoho',
            label: 'Push and Execute',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
            run: () => { pushToZoho(true, true); }
        });
        editor.addAction({
            id: 'zide-pull-zoho',
            label: 'Pull from Zoho',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP],
            run: () => {
                console.log('[ZohoIDE] Shortcut: Pull from Zoho');
                pullFromZoho();
            }
        });

        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "CMD_SYNC_SAVE") {
                    console.log('[ZohoIDE] Command: Sync & Save');
                    pushToZoho(true);
                } else if (request.action === "CMD_SYNC_SAVE_EXECUTE") {
                    console.log('[ZohoIDE] Command: Sync & Execute');
                    pushToZoho(true, true);
                } else if (request.action === "CMD_PULL_CODE") {
                    console.log('[ZohoIDE] Command: Pull Code');
                    pullFromZoho();
                } else if (request.action === "CONTEXT_SWITCH") {
                    console.log('[ZohoIDE] Event: Context Switch', request.tabId);
                    checkConnection();
                }
            });
        }

        editor.onDidChangeModelContent(() => {
            const model = editor.getModel();
            const code = model.getValue();

            if (AppState.currentFileId) {
                const state = AppState.models[AppState.currentFileId];
                if (state) {
                    const isModified = code !== state.originalCode;
                    const tab = AppState.activeTabs.find(t => t.id === AppState.currentFileId);
                    if (tab && tab.isModified !== isModified) {
                        tab.isModified = isModified;
                        updateGranularStatus(tab.id, isModified);
                    }
                }
            }

            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ 'saved_deluge_code': code });
            }
            if (window.validateDelugeModel) window.validateDelugeModel(model);
        renderOpenEditors();
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
        renderOpenEditors();
        checkConnection();

    } catch (e) {
        console.error("[ZohoIDE] initEditor Error:", e);
        console.error('[ZohoIDE] Monaco Load Error:', e);
    }
}

let currentFileId = null;

function checkConnection() {
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "CHECK_CONNECTION" }, async (response) => {
            if (response && response.connected) {
                isConnected = true;
                const msg = (response.isStandalone ? "Connected to Target: " : "Connected Local: ") + (response.name || response.tabTitle || "Zoho Tab");
                showStatus(msg, "success");
                window.currentTargetTab = response;

                // Update Online IDs
                AppState.onlineIds.clear();
                if (response.allOnlineTabs) {
                    response.allOnlineTabs.forEach(tab => {
                        let id = "global";
                        if (tab.orgId && tab.system && tab.functionId && tab.orgId !== 'unknown' && tab.functionId !== 'unknown') {
                            id = `${tab.orgId}:${tab.system}:${tab.functionId}`;
                        } else {
                            id = tab.url || "global";
                        }
                        AppState.onlineIds.add(id);
                    });
                }

                // Identify stable ID: OrgID:System:FunctionID
                let stableId = "global";
                if (response.orgId && response.system && response.functionId && response.orgId !== 'unknown' && response.functionId !== 'unknown') {
                    stableId = `${response.orgId}:${response.system}:${response.functionId}`;
                } else {
                    stableId = response.url || "global";
                }

                if (stableId !== currentFileId) {
                    // Context switch detected
                    if (currentFileId && editor && editor.getValue().trim() !== "" && !editor.getValue().startsWith("// Start coding")) {
                        await saveLocally();
                    }
                    currentFileId = stableId;
                    window.currentFileId = currentFileId;
                    zideProjectUrl = response.url;
                    window.zideProjectUrl = zideProjectUrl;

                    await loadProjectData();
                    await performDriftCheck();

                    // Cloud Auto-Detection
                    if (typeof CloudUI !== 'undefined' && CloudUI.activeOrgId && zideProjectUrl !== 'global') {
                        CloudUI.checkForCloudFiles(zideProjectUrl);
                    }
                } else {
                    // Same file, but maybe content changed in Zoho
                    await performDriftCheck();
                }
            } else {
                isConnected = false;
                showStatus("Disconnected from Zoho", "info");
                if (currentFileId !== "global") {
                    currentFileId = "global";
                    window.currentFileId = currentFileId;
                    zideProjectUrl = "global";
                    window.zideProjectUrl = zideProjectUrl;
                    await loadProjectData();
                }
            }
        });
    }
}

async function loadProjectData() {
    if (!currentFileId) return;
    AppState.currentFileId = currentFileId;

    const FileManager = getFileManager();
    const InterfaceManager = getInterfaceManager();

    console.log('[ZohoIDE] Loading project data for:', currentFileId);

    // Clean up models not in RAM (not online and not current)
    Object.keys(AppState.models).forEach(id => {
        if (id !== currentFileId && !AppState.onlineIds.has(id)) {
            console.log('[ZohoIDE] Lazy Loading: Disposing model for', id);
            if (AppState.models[id].model) AppState.models[id].model.dispose();
            delete AppState.models[id];
        }
    });

    // 1. Load File from VFS
    const file = await FileManager.getFile(currentFileId);

    // 2. Load all files metadata for explorer
    const allMetadata = await FileManager.getAllFilesMetadata();
    updateSavedFilesList(allMetadata);

    if (file) {
        zideProjectName = file.name || "Untitled Project";

        // Handle Monaco Model
        if (!AppState.models[currentFileId]) {
            const model = monaco.editor.createModel(file.code, 'deluge');
            AppState.models[currentFileId] = { model, originalCode: file.code };
        }

        if (editor) {
            editor.setModel(AppState.models[currentFileId].model);
        }

        // Add to tabs
        if (!AppState.activeTabs.find(t => t.id === currentFileId)) {
            AppState.activeTabs.push({ id: currentFileId, name: zideProjectName, isModified: false });
        }
    } else {
        zideProjectName = (window.currentTargetTab && window.currentTargetTab.name) || "Untitled Project";
        // Handle "New" or unsaved tab
        if (!AppState.models[currentFileId]) {
            const defaultCode = '// Start coding in Zoho Deluge...\n\n';
            const model = monaco.editor.createModel(defaultCode, 'deluge');
            AppState.models[currentFileId] = { model, originalCode: defaultCode };
        }
        if (editor) editor.setModel(AppState.models[currentFileId].model);

        if (!AppState.activeTabs.find(t => t.id === currentFileId)) {
            AppState.activeTabs.push({ id: currentFileId, name: zideProjectName, isModified: false });
        }
    }

    window.zideProjectName = zideProjectName;
    const nameInput = document.getElementById("project-name-input");
    if (nameInput) nameInput.value = zideProjectName;

    // 3. Load Interfaces
    const interfaces = await InterfaceManager.getInterfacesByOwner(currentFileId);
    // Transform to mapping format for ide.js legacy compatibility if needed
    interfaceMappings = {};
    interfaces.forEach(i => {
        interfaceMappings[i.name] = i.structure;
    });
    window.interfaceMappings = interfaceMappings;
    updateInterfaceMappingsList();

    // 4. Blacklist Check
    AppState.isBlacklisted = await isIdBlacklisted(currentFileId);
    updateNoFollowUI();

    renderTabs();
    renderOpenEditors();
    performDriftCheck();
}

async function isIdBlacklisted(id) {
    if (!id) return false;
    return new Promise((resolve) => {
        chrome.storage.local.get(['zide_blacklist'], (result) => {
            const blacklist = result.zide_blacklist || [];
            resolve(blacklist.includes(id));
        });
    });
}

function updateNoFollowUI() {
    const btn = document.getElementById('no-follow-btn');
    if (!btn) return;

    if (AppState.isBlacklisted) {
        btn.innerHTML = '<span class="material-icons">visibility_off</span>';
        btn.style.color = '#ff5555';
        btn.title = 'No Follow: Active (Level 3 Blacklist)';
    } else {
        btn.innerHTML = '<span class="material-icons">visibility</span>';
        btn.style.color = '#aaa';
        btn.title = 'No Follow: Inactive';
    }
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    if (!container) return;

    container.innerHTML = '';
    AppState.activeTabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab-item' + (tab.id === currentFileId ? ' active' : '');
        tabEl.dataset.id = tab.id;
        tabEl.dataset.index = index;

        const isModified = tab.isModified || false;
        if (isModified) tabEl.classList.add('modified');

        tabEl.innerHTML = `
            <span class="tab-status"></span>
            <span class="tab-title">${tab.name}</span>
            <span class="tab-close material-icons">close</span>
        `;

        tabEl.onclick = async () => {
            currentFileId = tab.id;
            window.currentFileId = currentFileId;
            await loadProjectData();
        };

        const closeBtn = tabEl.querySelector('.tab-close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closeTab(tab.id);
            };
        }

        container.appendChild(tabEl);
    });
    renderOpenEditors();
}

function renderOpenEditors() {
    const container = document.getElementById('open-editors-list');
    const countEl = document.getElementById('open-editors-count');
    if (!container) return;

    if (countEl) countEl.innerText = AppState.activeTabs.length;

    if (!AppState.virtualLists.openEditors) {
        AppState.virtualLists.openEditors = new VirtualList(container, {
            itemHeight: 50,
            items: AppState.activeTabs,
            renderItem: (tab) => {
                const item = document.createElement('div');
                item.className = 'file-card' + (tab.id === currentFileId ? ' active' : '');

                const isModified = tab.isModified || false;
                const statusIcon = isModified ? '<span style="color:#ffb86c; font-size:14px; margin-right:5px;">●</span>' : '';

                item.innerHTML = `
                    <div class="file-title">${statusIcon}${tab.name}</div>
                    <div class="file-meta">Open Editor</div>
                `;

                item.onclick = async () => {
                    currentFileId = tab.id;
                    window.currentFileId = currentFileId;
                    await loadProjectData();
                };
                return item;
            }
        });
    } else {
        AppState.virtualLists.openEditors.updateItems(AppState.activeTabs);
    }
}

function closeTab(id) {
    const index = AppState.activeTabs.findIndex(t => t.id === id);
    if (index === -1) return;

    const state = AppState.models[id];
    if (state && state.model.getValue() !== state.originalCode) {
        if (!confirm('You have unsaved changes. Close anyway?')) return;
    }

    AppState.activeTabs.splice(index, 1);

    if (currentFileId === id) {
        if (AppState.activeTabs.length > 0) {
            const nextTab = AppState.activeTabs[Math.max(0, index - 1)];
            currentFileId = nextTab.id;
            window.currentFileId = currentFileId;
            loadProjectData();
        } else {
            currentFileId = 'global';
            window.currentFileId = currentFileId;
            loadProjectData();
        }
    } else {
        renderTabs();
    }
}

const bind = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
};

function setupEventHandlers() {
    bind('new-btn', 'click', () => {
        if (confirm('Start a new script?')) {
            editor.setValue('// New Zoho Deluge Script\n\n');
        }
    });

    bind('pull-btn', 'click', pullFromZoho);
    bind('push-btn', 'click', () => pushToZoho(true));
    bind('execute-btn', 'click', () => pushToZoho(true, true));
    bind('save-btn', 'click', saveLocally);

    bind('no-follow-btn', 'click', async () => {
        if (!currentFileId) return;
        AppState.isBlacklisted = !AppState.isBlacklisted;

        chrome.storage.local.get(['zide_blacklist'], async (result) => {
            let blacklist = result.zide_blacklist || [];
            if (AppState.isBlacklisted) {
                if (!blacklist.includes(currentFileId)) blacklist.push(currentFileId);
                if (window.ideDB) await window.ideDB.blacklist.add({ id: currentFileId });
            } else {
                blacklist = blacklist.filter(id => id !== currentFileId);
                if (window.ideDB) await window.ideDB.blacklist.delete(currentFileId);
            }
            chrome.storage.local.set({ 'zide_blacklist': blacklist }, () => {
                updateNoFollowUI();
                showStatus(AppState.isBlacklisted ? "Added to Blacklist" : "Removed from Blacklist", "info");
            });
        });
    });

    bind('project-name-input', 'input', async (e) => {
        zideProjectName = e.target.value;
        window.zideProjectName = zideProjectName;
        if (currentFileId && currentFileId !== 'global') {
            const file = await FileManager.getFile(currentFileId);
            if (file) {
                file.name = zideProjectName;
                await FileManager.saveFile(file);

                // Update tab name
                const tab = AppState.activeTabs.find(t => t.id === currentFileId);
                if (tab) tab.name = zideProjectName;
                renderTabs();

                const allMetadata = await FileManager.getAllFilesMetadata();
                updateSavedFilesList(allMetadata);
            }
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
        document.getElementById('interface-var-name').value = 'payload';
        document.getElementById('interface-input').value = '';
        document.getElementById('modal-json-status').innerHTML = '';

        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'block';
        document.getElementById('modal-map-only').style.display = 'none';
        document.getElementById('interface-modal').style.display = 'flex';
    });

    bind('add-interface-btn', 'click', () => {
        document.getElementById('modal-title').innerText = 'Add JSON Mapping for Autocomplete';
        document.getElementById('interface-var-name').value = 'payload';
        document.getElementById('interface-input').value = '';
        document.getElementById('modal-json-status').innerHTML = '';

        document.getElementById('modal-var-container').style.display = 'block';
        document.getElementById('modal-convert').style.display = 'none';
        document.getElementById('modal-map-only').style.display = 'block';
        document.getElementById('modal-map-only').innerText = 'Save Mapping';
        document.getElementById('interface-modal').style.display = 'flex';
    });

    bind('modal-cancel', 'click', () => { document.getElementById('interface-modal').style.display = 'none'; });
    bind('modal-close', 'click', () => { document.getElementById('interface-modal').style.display = 'none'; });

    bind('modal-paste', 'click', async () => {
        try {
            let text = await navigator.clipboard.readText();
            document.getElementById('interface-input').value = tryFixJson(text);
            validateModalJson();
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    });

    bind('interface-input', 'input', () => {
        validateModalJson();
    });

    bind('interface-input', 'paste', () => {
        setTimeout(() => {
            const input = document.getElementById('interface-input');
            if (input) {
                input.value = tryFixJson(input.value);
                validateModalJson();
            }
        }, 0);
    });

    bind('modal-fix-json', 'click', () => {
        const input = document.getElementById('interface-input');
        if (input) {
            input.value = tryFixJson(input.value);
            validateModalJson();
        }
    });

    bind('modal-convert', 'click', () => {
        const varName = document.getElementById('interface-var-name').value || 'payload';
        let jsonStr = document.getElementById('interface-input').value;

        // Final attempt to fix before processing
        jsonStr = tryFixJson(jsonStr);

        const style = document.getElementById('gen-style') ? document.getElementById('gen-style').value : 'step';
        const update = document.getElementById('gen-update') ? document.getElementById('gen-update').checked : false;
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
        let jsonStr = document.getElementById('interface-input').value;
        jsonStr = tryFixJson(jsonStr);
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

function tryFixJson(str) {
    if (!str) return str;
    let fixed = str.trim();

    // 0. Try to extract JSON if it's wrapped in other text
    const firstBrace = fixed.indexOf('{');
    const firstBracket = fixed.indexOf('[');
    let startPos = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) startPos = firstBrace;
    else if (firstBracket !== -1) startPos = firstBracket;

    if (startPos !== -1) {
        const lastBrace = fixed.lastIndexOf('}');
        const lastBracket = fixed.lastIndexOf(']');
        let endPos = -1;
        if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) endPos = lastBrace;
        else if (lastBracket !== -1) endPos = lastBracket;

        if (endPos !== -1 && endPos > startPos) {
            fixed = fixed.substring(startPos, endPos + 1);
        }
    }

    // 1. Remove comments
    fixed = fixed.replace(/\/\/.*$/gm, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Replace single quotes with double quotes for keys
    fixed = fixed.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');

    // 3. Replace single quotes with double quotes for values
    fixed = fixed.replace(/([:\[,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'/g, '$1"$2"');

    // 4. Quote unquoted keys
    const keyPattern = /([{,]\s*)([a-zA-Z0-9_.\-@$!#%^&*+]+)\s*:/g;
    fixed = fixed.replace(keyPattern, '$1"$2":');

    // Also handle keys at the start of a line (missing commas or object body)
    fixed = fixed.replace(/^(\s*)([a-zA-Z0-9_.\-@$!#%^&*+]+)\s*:/gm, '$1"$2":');

    // 5. Remove trailing commas
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    try {
        const obj = JSON.parse(fixed);
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return fixed;
    }
}

function validateModalJson() {
    const input = document.getElementById('interface-input');
    const status = document.getElementById('modal-json-status');
    const btnConvert = document.getElementById('modal-convert');
    const btnSave = document.getElementById('modal-map-only');
    const btnFix = document.getElementById('modal-fix-json');

    if (!input || !input.value.trim()) {
        if (status) status.innerHTML = '';
        if (btnFix) btnFix.style.display = 'none';
        return;
    }

    try {
        JSON.parse(input.value);
        if (status) {
            status.innerHTML = '<span style="color: #50fa7b;">✓ Valid JSON</span>';
        }
        if (btnConvert) btnConvert.disabled = false;
        if (btnSave) btnSave.disabled = false;
        if (btnFix) btnFix.style.display = 'none';
    } catch (e) {
        // Try fixing it
        const fixed = tryFixJson(input.value);
        try {
            JSON.parse(fixed);
            if (status) {
                status.innerHTML = '<span style="color: #ffb86c;">⚠ Invalid JSON (Autofix available)</span>';
            }
            if (btnFix) btnFix.style.display = 'inline-flex';
            // We allow clicking even if invalid if autofix works
            if (btnConvert) btnConvert.disabled = false;
            if (btnSave) btnSave.disabled = false;
        } catch (e2) {
            if (status) {
                status.innerHTML = `<span style="color: #ff5555;">✗ Invalid JSON: ${e.message}</span>`;
            }
            if (btnFix) btnFix.style.display = 'none';
            // if (btnConvert) btnConvert.disabled = true;
            // if (btnSave) btnSave.disabled = true;
        }
    }
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

async function saveInterfaceMapping(name, jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);

        const interfaceData = {
            name: name,
            structure: obj,
            ownerId: currentFileId || 'global',
            ownerType: currentFileId === 'global' ? 'GLOBAL' : 'FILE',
            sharedScope: 'LOCAL' // Default to local, user can promote later
        };

        await InterfaceManager.saveInterface(interfaceData);

        interfaceMappings[name] = obj;
        window.interfaceMappings = interfaceMappings;
        updateInterfaceMappingsList();
    } catch (e) {
        console.error("[ZohoIDE] saveInterfaceMapping Error:", e);
        alert('Invalid JSON: ' + e.message);
    }
}

function updateInterfaceMappingsList() {
    const list = document.getElementById('interface-mappings-list');
    const countEl = document.getElementById('mapping-count');
    if (!list) return;

    const mappings = Object.keys(interfaceMappings);
    if (countEl) countEl.innerText = mappings.length;

    list.innerHTML = '';
    mappings.forEach(name => {
        const item = document.createElement('div');
        item.className = 'mapping-item';
        if (window.activeMappingName === name) item.classList.add('active');

        const nameSpan = document.createElement('span');
        nameSpan.innerText = name;
        nameSpan.style.flex = '1';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.textOverflow = 'ellipsis';
        nameSpan.style.whiteSpace = 'nowrap';

        const actions = document.createElement('div');
        actions.className = 'mapping-actions';

        const editBtn = document.createElement('span');
        editBtn.className = 'material-icons';
        editBtn.innerHTML = 'edit';
        editBtn.title = 'Edit Mapping';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            openEditMappingModal(name);
        };

        const copyAllBtn = document.createElement('span');
        copyAllBtn.className = 'material-icons';
        copyAllBtn.innerHTML = 'content_copy';
        copyAllBtn.title = 'Copy as Deluge Map';
        copyAllBtn.onclick = (e) => {
            e.stopPropagation();
            const code = convertInterfaceToDeluge(name, JSON.stringify(interfaceMappings[name]));
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code);
                showStatus('Map code copied to clipboard', 'success');
            }
        };

        const copyJsonBtn = document.createElement('span');
        copyJsonBtn.className = 'material-icons';
        copyJsonBtn.innerHTML = 'data_object';
        copyJsonBtn.title = 'Copy as Raw JSON';
        copyJsonBtn.onclick = (e) => {
            e.stopPropagation();
            const json = JSON.stringify(interfaceMappings[name], null, 2);
            if (navigator.clipboard) {
                navigator.clipboard.writeText(json);
                showStatus('Raw JSON copied to clipboard', 'success');
            }
        };

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-mapping material-icons';
        deleteBtn.innerHTML = 'close';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Delete mapping "${name}"?`)) {
                const ifaces = await InterfaceManager.getInterfacesByOwner(currentFileId);
                const iface = ifaces.find(i => i.name === name);
                if (iface) {
                    await InterfaceManager.deleteInterface(iface.id);
                }

                delete interfaceMappings[name];
                window.interfaceMappings = interfaceMappings;
                if (window.activeMappingName === name) {
                    window.activeMappingName = null;
                    document.getElementById('interface-tree-view').innerHTML = '<div style="font-size:11px; opacity:0.5; text-align:center; margin-top:20px;">Select a mapping to explore its structure</div>';
                }
                updateInterfaceMappingsList();
            }
        };

        actions.appendChild(editBtn);
        actions.appendChild(copyAllBtn);
        actions.appendChild(copyJsonBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(nameSpan);
        item.appendChild(actions);

        item.onclick = () => {
            window.activeMappingName = name;
            document.querySelectorAll('.mapping-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderInterfaceTree(name, interfaceMappings[name]);
        };
        list.appendChild(item);
    });
}

function openEditMappingModal(name) {
    const mapping = interfaceMappings[name];
    if (!mapping) return;

    document.getElementById('modal-title').innerText = 'Edit JSON Mapping';
    document.getElementById('interface-var-name').value = name;
    document.getElementById('interface-input').value = JSON.stringify(mapping, null, 2);

    document.getElementById('modal-var-container').style.display = 'block';
    document.getElementById('modal-convert').style.display = 'none';
    document.getElementById('modal-map-only').style.display = 'block';
    document.getElementById('modal-map-only').innerText = 'Update Mapping';

    document.getElementById('interface-modal').style.display = 'flex';
    validateModalJson();
}

function renderInterfaceTree(mappingName, obj) {
    const tree = document.getElementById('interface-tree-view');
    if (!tree) return;
    tree.innerHTML = '';

    // Header for the tree view
    const treeHeader = document.createElement('div');
    treeHeader.className = 'tree-view-header';
    treeHeader.innerHTML = `
        <div class="tree-header-info">
            <span class="material-icons" style="font-size: 16px; color: #8be9fd;">account_tree</span>
            <span class="tree-header-title">${mappingName}</span>
        </div>
        <div class="tree-header-actions">
            <button id="tree-expand-all" title="Expand All"><span class="material-icons">unfold_more</span></button>
            <button id="tree-collapse-all" title="Collapse All"><span class="material-icons">unfold_less</span></button>
        </div>
    `;
    tree.appendChild(treeHeader);

    const treeContent = document.createElement('div');
    treeContent.className = 'tree-content';
    tree.appendChild(treeContent);

    bind('tree-expand-all', 'click', () => {
        treeContent.querySelectorAll('.tree-sub.collapsed').forEach(sub => sub.classList.remove('collapsed'));
        treeContent.querySelectorAll('.toggle-icon.collapsed').forEach(icon => icon.classList.remove('collapsed'));
        treeContent.querySelectorAll('.tree-footer').forEach(f => f.style.display = 'block');
    });

    bind('tree-collapse-all', 'click', () => {
        treeContent.querySelectorAll('.tree-sub').forEach(sub => sub.classList.add('collapsed'));
        treeContent.querySelectorAll('.toggle-icon').forEach(icon => icon.classList.add('collapsed'));
        treeContent.querySelectorAll('.tree-footer').forEach(f => f.style.display = 'none');
    });

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
                    iconHtml = '<span class="toggle-icon material-icons" style="font-size:12px;">arrow_drop_down</span><span class="node-icon material-icons" style="font-size:12px;">folder</span>';
                } else {
                    iconHtml = '<span class="toggle-icon material-icons" style="visibility:hidden; font-size:12px;">arrow_drop_down</span><span class="node-icon material-icons" style="font-size:12px;">description</span>';
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

                const copyJsonBtn = document.createElement('button');
                copyJsonBtn.className = 'tree-action-btn';
                copyJsonBtn.innerText = 'JSON';
                copyJsonBtn.title = 'Copy as Raw JSON to clipboard';
                copyJsonBtn.onclick = (e) => {
                    e.stopPropagation();
                    const json = JSON.stringify(val, null, 2);
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(json);
                        showStatus('Node JSON copied to clipboard', 'success');
                    }
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
                actions.appendChild(copyJsonBtn);
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
    buildTree(obj, treeContent);
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
    const now = Date.now();
    if (now - lastActionTime < 800) return;
    lastActionTime = now;

    if (!isConnected) {
        log('Error', 'No Zoho tab connected. Please open a Zoho Deluge editor tab first.');
        return;
    }
    log('System', 'Pulling code...');
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
            if (response && response.code) {
                editor.setValue(response.code);
                if (currentFileId && AppState.models[currentFileId]) {
                    AppState.models[currentFileId].originalCode = response.code;
                    const tab = AppState.activeTabs.find(t => t.id === currentFileId);
                    if (tab) tab.isModified = false;
                }
                log('Success', 'Code pulled.');
                renderTabs();
            } else { log('Error', response?.error || 'No code found.'); }
        });
    }
}

function pushToZoho(triggerSave = false, triggerExecute = false) {
    const now = Date.now();
    if (now - lastActionTime < 1000) return;
    lastActionTime = now;

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
                if (currentFileId && AppState.models[currentFileId]) {
                    AppState.models[currentFileId].originalCode = code;
                    const tab = AppState.activeTabs.find(t => t.id === currentFileId);
                    if (tab) tab.isModified = false;
                }
                renderTabs();

                if (triggerSave || triggerExecute) {
                    // Logic: Save first. If Execute is requested, wait 500ms then Execute.
                    chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' }, (res) => {
                        if (res && res.success) {
                            log('Success', 'Zoho Save triggered.');

                            if (triggerExecute) {
                                log('System', 'Waiting 700ms before execution...');
                                setTimeout(() => {
                                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' }, (execRes) => {
                                        if (execRes && execRes.success) log('Success', 'Zoho Execute triggered.');
                                        else log('Warning', 'Zoho Execute trigger failed.');
                                    });
                                }, 700);
                            }
                        } else {
                            log('Warning', 'Zoho Save trigger failed. Try clicking manually.');
                            // Still try to execute if it was requested, as some saves might be "no-op"
                            if (triggerExecute) {
                                setTimeout(() => {
                                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' }, (execRes) => {
                                        if (execRes && execRes.success) log('Success', 'Zoho Execute triggered.');
                                    });
                                }, 700);
                            }
                        }
                    });
                }
            } else {
                log('Error', response?.error || 'Push failed.');
            }
        });
    }
}

async function saveLocally() {
    if (!currentFileId) return;
    const FileManager = getFileManager();

    const state = AppState.models[currentFileId];
    if (!state) return;

    // Check for errors
    const markers = monaco.editor.getModelMarkers({ resource: state.model.uri });
    const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
    if (errors.length > 0) {
        showStatus('Sync Warning: Errors present', 'warning');
    }

    const code = state.model.getValue();
    const name = zideProjectName || 'Untitled Project';

    const fileData = {
        id: currentFileId,
        name: name,
        code: code,
        url: zideProjectUrl || ''
    };

    try {
        await FileManager.saveFile(fileData);
        log('Success', 'Saved to VFS.');

        if (AppState.models[currentFileId]) {
            AppState.models[currentFileId].originalCode = code;
            const tab = AppState.activeTabs.find(t => t.id === currentFileId);
            if (tab) tab.isModified = false;
            renderTabs();
        }

        const allMetadata = await FileManager.getAllFilesMetadata();
        updateSavedFilesList(allMetadata);

        const syncEl = document.getElementById('sync-status');
        if (syncEl) syncEl.innerText = 'Saved ' + new Date().toLocaleTimeString();

        // Cloud Sync (Legacy compatibility)
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
    } catch (err) {
        console.error('[ZohoIDE] saveLocally error:', err);
        log('Error', 'Save failed: ' + err.message);
    }
}

function updateSavedFilesList(files) {
    const container = document.getElementById('saved-files-list');
    if (!container) return;

    if (files.length === 0) {
        container.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6;">No saved files yet.</div>';
        delete AppState.virtualLists.savedFiles;
        return;
    }

    if (!AppState.virtualLists.savedFiles) {
        AppState.virtualLists.savedFiles = new VirtualList(container, {
            itemHeight: 50,
            items: files,
            renderItem: (file) => {
                const card = document.createElement('div');
                card.className = 'file-card';
                if (file.id === currentFileId) card.classList.add('active');

                const timestamp = new Date(file.updatedAt).toLocaleString();
                card.innerHTML = `
                    <div class="file-title">${file.name || 'Untitled'}</div>
                    <div class="file-meta">${file.url.substring(0, 30)}... • ${timestamp}</div>
                    <span class="material-icons file-delete-btn" title="Delete File">delete</span>
                `;

                const deleteBtn = card.querySelector('.file-delete-btn');
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await handleDeleteFile(file.id, file.name);
                };

                card.onclick = async () => {
                    if (confirm(`Load file "${file.name}"?`)) {
                        const fullFile = await FileManager.getFile(file.id);
                        if (fullFile) {
                            currentFileId = file.id;
                            window.currentFileId = currentFileId;
                            editor.setValue(fullFile.code);
                            await loadProjectData();
                        }
                    }
                };
                return card;
            }
        });
    } else {
        AppState.virtualLists.savedFiles.updateItems(files);
    }
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

    function updateGranularStatus(fileId, isModified) {
        // Update Tab Bar
        const tabEl = document.querySelector(`.tab-item[data-id="${CSS.escape(fileId)}"]`);
        if (tabEl) {
            if (isModified) tabEl.classList.add('modified');
            else tabEl.classList.remove('modified');
        }

        // Update Open Editors List (Virtual)
        if (AppState.virtualLists.openEditors) {
            AppState.virtualLists.openEditors.render();
        }
    }

    async function performDriftCheck() {
        if (!currentFileId || currentFileId === 'global' || !isConnected) {
            updateSyncUI('SYNCED');
            return;
        }

        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, async (response) => {
                if (response && response.code) {
                    const file = await FileManager.getFile(currentFileId);
                    if (!file) {
                        updateSyncUI('NEW');
                        return;
                    }

                    const domHash = await FileManager.calculateHash(response.code);
                    if (file.hash === domHash) {
                        updateSyncUI('SYNCED');
                    } else {
                        updateSyncUI('DRIFT', response.code);
                    }
                }
            });
        }
    }

    function updateSyncUI(status, domCode = null) {
        const statusEl = document.getElementById('sync-status');
        const actionsEl = document.getElementById('sync-actions');
        const editorContainer = document.getElementById('editor-container');

        if (status === 'SYNCED') {
            if (statusEl) {
                statusEl.innerText = 'Synced';
                statusEl.style.color = 'white';
            }
            if (actionsEl) actionsEl.style.display = 'none';
            if (editorContainer) editorContainer.style.outline = 'none';
        } else if (status === 'DRIFT') {
            if (statusEl) {
                statusEl.innerText = 'Drift Detected';
                statusEl.style.color = '#ffb86c';
            }
            if (actionsEl) actionsEl.style.display = 'flex';
            if (editorContainer) editorContainer.style.outline = '2px solid #ffb86c';
            if (editorContainer) editorContainer.style.outlineOffset = '-2px';

            const pullBtn = document.getElementById('resolve-pull-btn');
            const pushBtn = document.getElementById('resolve-push-btn');

            if (pullBtn) {
                pullBtn.onclick = async () => {
                    if (confirm('Overwrite local code with latest from Zoho?')) {
                        editor.setValue(domCode);
                        await saveLocally();
                        updateSyncUI('SYNCED');
                    }
                };
            }
            if (pushBtn) {
                pushBtn.onclick = async () => {
                    if (confirm('Overwrite Zoho with local code?')) {
                        await pushToZoho(true);
                        updateSyncUI('SYNCED');
                    }
                };
            }
        } else if (status === 'NEW') {
            if (statusEl) {
                statusEl.innerText = 'Offline Mode';
                statusEl.style.color = '#888';
            }
            if (actionsEl) actionsEl.style.display = 'none';
            if (editorContainer) editorContainer.style.outline = 'none';
        }
    }

    window.performDriftCheck = performDriftCheck;

    async function handleDeleteFile(fileId, fileName) {
        const InterfaceManager = getInterfaceManager();
        const FileManager = getFileManager();

        const sharedIfaces = await InterfaceManager.getSharedInterfacesByFile(fileId);
        if (sharedIfaces.length > 0) {
            const ifaceNames = sharedIfaces.map(i => i.name).join(', ');
            if (confirm(`File "${fileName}" owns shared interfaces (${ifaceNames}). Promote them to Global level before deleting?`)) {
                await InterfaceManager.adoptInterfaces(sharedIfaces.map(i => i.id), 'global', 'GLOBAL');
            } else if (!confirm('Are you sure you want to delete the file and all its interfaces?')) {
                return;
            }
        } else {
            if (!confirm(`Delete file "${fileName}"?`)) return;
        }

        await FileManager.deleteFile(fileId);
        if (currentFileId === fileId) {
            currentFileId = 'global';
            window.currentFileId = currentFileId;
            editor.setValue('// Start coding in Zoho Deluge...\n\n');
        }
        await loadProjectData();
    }

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