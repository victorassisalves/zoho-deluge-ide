(function() {
var zideProjectUrl = null;
window.zideProjectUrl = null;
var zideProjectName = "Untitled Project";
window.zideProjectName = zideProjectName;
window.activeCloudFileId = null;

/**
 * Zoho Deluge Advanced IDE v2.0.0
 */

window.editor;
var isConnected = false;
window.interfaceMappings = {};
window.currentResearchReport = "";
window.researchPollingInterval = null;
window.lastActionTime = 0;

window.AppState = {
    activeTabs: [],
    ignoredTabIds: new Set(),
    savedFunctions: {}, // Tree structure
    history: [],
    currentFile: null, // { id, type: 'tab'|'saved', data: metadata }
    openEditors: [], // Files currently "open" in tabs/IDE
    renames: {}, // Manual renames: { key: newName }
    models: {}, // { key: { model, originalCode, syncStatus } }
};
window.AppState = window.AppState;

function LEGACY_getOrCreateModel(key, initialCode = "") {
    if (window.AppState.models[key]) return window.AppState.models[key];

    // Check if we have this file in IndexedDB but not in memory yet
    const model = monaco.editor.createModel(initialCode, 'deluge');
    window.AppState.models[key] = {
        model: model,
        originalCode: initialCode,
        syncStatus: 'UNKNOWN'
    };

    let saveTimeout;
    model.onDidChangeContent(() => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveModelsToStorage();
        }, 1000);

        if (window.validateDelugeModel) window.validateDelugeModel(model);
        window.renderOpenEditors();
        window.renderExplorer();
    });

    return window.AppState.models[key];
}

async function LEGACY_saveModelsToStorage() {
    // Persistent models data in IndexedDB
    const data = {};
    for (const key in window.AppState.models) {
        data[key] = {
            code: window.AppState.models[key].model.getValue(),
            originalCode: window.AppState.models[key].originalCode
        };

        // Also update the file in IndexedDB if it exists
        // Extract orgId, system, fileId from key (format: orgId:system:fileId)
        const [orgId, system, fileId] = key.split(':');
        if (fileId && fileId !== 'default' && !fileId.startsWith('id_')) {
            const file = await FileManager.getFile(fileId);
            if (file) {
                file.code = data[key].code;
                file.originalCode = data[key].originalCode;
                await DB.put('Files', file);
            }
        }
    }

    // Backup in Config for quick recovery of open tabs
    await DB.put('Config', { key: 'zide_models_data', value: data });
}

function initEditor() {
    if (window.IDEMain && window.IDEMain.editor) {
        window.editor = window.IDEMain.editor.editor;
    }
    if (!window.editor) return;

        window.editor = window.editor;
        if (typeof validateDelugeModel === "function") validateDelugeModel(window.editor.getModel());
        window.addEventListener('resize', () => { if (window.editor) window.editor.layout(); });
    // Ensure window.editor layouts correctly after initialization
    setTimeout(() => { if (window.editor) window.editor.layout(); }, 500);
    setTimeout(() => { if (window.editor) window.editor.layout(); }, 2000);



        // Keyboard Shortcuts & Overrides
        window.editor.addAction({
            id: 'zide-save-local',
            label: 'Save Locally',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => { window.saveLocally(); }
        });
        window.editor.addAction({
            id: 'zide-push-zoho',
            label: 'Push to Zoho',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
            run: () => { window.pushToZoho(true); }
        });
        window.editor.addAction({
            id: 'zide-push-execute-zoho',
            label: 'Push and Execute',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
            run: () => { window.pushToZoho(true, true); }
        });
        window.editor.addAction({
            id: 'zide-pull-zoho',
            label: 'Pull from Zoho',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP],
            run: () => {
                console.log('[ZohoIDE] Shortcut: Pull from Zoho');
                window.pullFromZoho();
            }
        });

        window.editor.addAction({
            id: 'zide-extract-interface',
            label: 'Extract to Interface',
            contextMenuGroupId: 'navigation',
            run: () => {
                const selection = window.editor.getSelection();
                const text = window.editor.getModel().getValueInRange(selection);
                if (text) {
                    window.openExtractInterfaceModal(text);
                }
            }
        });

        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "CMD_SYNC_SAVE") {
                    console.log('[ZohoIDE] Command: Sync & Save');
                    window.pushToZoho(true);
                } else if (request.action === "CMD_SYNC_SAVE_EXECUTE") {
                    console.log('[ZohoIDE] Command: Sync & Execute');
                    window.pushToZoho(true, true);
                } else if (request.action === "CMD_PULL_CODE") {
                    console.log('[ZohoIDE] Command: Pull Code');
                    window.pullFromZoho();
                } else if (request.action === "SYNC_TABS") {
                    window.syncAppTabs();
                }
            });
        }

        async function loadConfig() {
            try {
                const configItems = await DB.getAll('Config');
                const config = {};
                configItems.forEach(item => config[item.key] = item.value);

                const ignoredTabs = config.zide_ignored_tabs || [];
                window.AppState.ignoredTabIds = new Set(ignoredTabs);

                // Load manual renames
                chrome.storage.local.get(['user_renames'], (res) => {
                    if (res.user_renames) {
                        window.AppState.renames = res.user_renames;
                        window.renderOpenEditors();
                        window.renderExplorer();
                    }
                });

                if (config.zide_models_data) {
                    for (const key in config.zide_models_data) {
                        const data = config.zide_models_data[key];
                        const mInfo = window.getOrCreateModel(key, data.originalCode || "");
                        mInfo.model.setValue(data.code || "");
                        mInfo.originalCode = data.originalCode || "";
                    }
                }

                if (typeof initApiExplorer === 'function') initApiExplorer();
                if (typeof syncProblemsPanel === 'function') syncProblemsPanel();
                if (config.theme) monaco.editor.setTheme(config.theme);
                if (config.font_size) {
                    const fs = parseInt(config.font_size);
                    if (fs && window.editor) {
                        window.editor.updateOptions({ fontSize: fs });
                        document.getElementById("editor-font-size").value = fs;
                    }
                }
                if (config.activation_behavior) document.getElementById("activation-behavior").value = config.activation_behavior;

                // Fallback to chrome storage for panel widths (UI state)
                chrome.storage.local.get(['left_panel_width', 'right_sidebar_width', 'bottom_panel_height'], (res) => {
                    if (res.bottom_panel_height) {
                        const bottomPanel = document.getElementById('bottom-panel');
                        if (bottomPanel) {
                            bottomPanel.style.height = res.bottom_panel_height;
                            document.documentElement.style.setProperty('--footer-height', res.bottom_panel_height);
                        }
                    }
                    if (res.left_panel_width) {
                        const leftPanel = document.getElementById('left-panel-content');
                        if (leftPanel) {
                            leftPanel.style.width = res.left_panel_width;
                            leftPanel.style.setProperty('--left-sidebar-width', res.left_panel_width);
                        }
                    }
                    if (res.right_sidebar_width) {
                        const rightSidebar = document.getElementById("right-sidebar");
                        if (rightSidebar) rightSidebar.style.width = res.right_sidebar_width;
                    }
                    setTimeout(() => { if (window.editor) window.editor.layout(); }, 200);
                });

            } catch (e) {
                console.error('[ZohoIDE] Config load failed:', e);
            }
        }
        loadConfig();



        setupEventHandlers();
        window.syncAppTabs();
        setInterval(window.syncAppTabs, 5000);

        // Load persisted explorer state
        window.loadExplorerData();

}

async function syncAppTabs() {
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "GET_ALL_ZOHO_TABS" }, async (tabs) => {
            if (tabs && Array.isArray(tabs)) {
                window.AppState.activeTabs = tabs;

                // Update sync status for models connected to these tabs
                for (const tab of tabs) {
                    if (window.AppState.ignoredTabIds.has(tab.tabId)) continue;
                    const key = window.getRenameKey(tab);
                    const mInfo = window.AppState.models[key];
                    if (mInfo && tab.active) {
                        // Check drift in background for active tab
                        chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE', tabId: tab.tabId }, async (response) => {
                            if (response && response.code) {
                                const status = await SyncService.detectStatus(tab.functionId, response.code);
                                mInfo.syncStatus = status;
                                if (window.AppState.currentFile && window.getRenameKey(window.AppState.currentFile.data) === key) {
                                    updateDriftUI(tab.tabId, status);
                                }
                                window.renderOpenEditors();
                                window.renderExplorer();
                            }
                        });
                    }
                }

                window.renderOpenEditors();
                window.renderExplorer();

                isConnected = tabs.length > 0;
                if (isConnected) {
                    const activeTab = tabs.find(t => t.active) || tabs[0];
                    window.showStatus(`Connected: ${tabs.length} tabs`, "success");

                    const oldTabId = window.currentTargetTab?.tabId;
                    window.currentTargetTab = activeTab;

                    // Auto-switch IDE to active browser tab if it changed
                    if (activeTab.tabId !== oldTabId && activeTab.active) {
                        // Don't auto-switch if the tab is ignored
                        if (!AppState.ignoredTabIds.has(activeTab.tabId)) {
                            console.log('[ZohoIDE] Browser tab changed, auto-switching IDE:', activeTab.tabId);

                            // Check if this tab matches a saved file
                            const savedFile = await FileManager.getFileByTab(activeTab);
                            if (savedFile) {
                                selectSavedFile(savedFile.orgId, savedFile.system, savedFile.folder, savedFile.id);
                            } else if (!AppState.currentFile || AppState.currentFile.type === 'tab') {
                                selectTabFile(activeTab);
                            }
                        }
                    }

                    if (activeTab.url !== zideProjectUrl) {
                         zideProjectUrl = activeTab.url;
                         window.zideProjectUrl = zideProjectUrl;
                    }
                } else {
                    showStatus("Disconnected from Zoho", "info");
                    window.currentTargetTab = null;
                }
            }
        });
    }
}

function LEGACY_renderOpenEditors() {
    const list = document.getElementById('open-editors-list');
    if (!list) return;

    list.innerHTML = '';

    // Filter out ignored tabs
    const visibleTabs = AppState.activeTabs.filter(tab => !AppState.ignoredTabIds.has(tab.tabId));

    if (visibleTabs.length === 0) {
        list.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6; padding: 10px;">No active Zoho tabs.</div>';
        return;
    }

    visibleTabs.forEach((tab, index) => {
        const item = document.createElement('div');
        item.className = 'explorer-item';
        const isCurrent = AppState.currentFile && (AppState.currentFile.tabId === tab.tabId || (AppState.currentFile.id === tab.functionId && tab.functionId !== 'unknown'));
        if (isCurrent) item.classList.add('active');

        const iconClass = (tab.system || 'generic').toLowerCase();
        const iconLetter = (tab.system || 'Z')[0].toUpperCase();

        const displayName = getDisplayName(tab);
        const sequenceNum = tab.tabSequence || (index + 1);

        const key = getRenameKey(tab);
        const mInfo = AppState.models[key];
        const isModified = mInfo && mInfo.model.getValue() !== mInfo.originalCode;

        let statusClass = 'active';
        let statusTitle = 'Synced with Zoho';

        if (isModified) {
            statusClass = 'modified';
            statusTitle = 'Local changes (unsaved in Zoho)';
        } else if (mInfo && mInfo.syncStatus && mInfo.syncStatus !== 'SYNCED') {
            statusClass = 'drift';
            statusTitle = `Drift: ${mInfo.syncStatus}`;
            if (mInfo.syncStatus === 'CONFLICT') statusClass = 'conflict';
        }

        item.innerHTML = `
            <span class="system-icon ${iconClass}">${iconLetter}</span>
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${sequenceNum}) ${displayName}</span>
            <span class="status-dot ${statusClass}" title="${statusTitle}"></span>
        `;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';
        actions.style.alignItems = 'center';

        const renameBtn = document.createElement('span');
        renameBtn.className = 'material-icons';
        renameBtn.innerHTML = 'edit';
        renameBtn.style.fontSize = '12px';
        renameBtn.style.color = '#888';
        renameBtn.style.cursor = 'pointer';
        renameBtn.title = 'Rename';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            renameFunction(tab);
        };
        actions.appendChild(renameBtn);

        const closeBtn = document.createElement('span');
        closeBtn.className = 'material-icons';
        closeBtn.innerHTML = 'close';
        closeBtn.style.fontSize = '14px';
        closeBtn.style.color = '#888';
        closeBtn.style.cursor = 'pointer';
        closeBtn.title = 'Close / Stop following this tab';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            AppState.ignoredTabIds.add(tab.tabId);
            if (AppState.currentFile && AppState.currentFile.tabId === tab.tabId) {
                AppState.currentFile = null;
            }
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ 'zide_ignored_tabs': Array.from(AppState.ignoredTabIds) });
            }
            renderOpenEditors();
        };
        actions.appendChild(closeBtn);

        item.appendChild(actions);

        item.onclick = () => {
            selectTabFile(tab);
        };
        list.appendChild(item);
    });
}

function LEGACY_getRenameKey(metadata) {
    if (!metadata) return 'unknown';
    // Use functionId if available, otherwise fallback to URL for uniqueness
    let id = (metadata.functionId && metadata.functionId !== 'unknown') ? metadata.functionId : (metadata.url || 'global');

    // Normalize URL if used as ID (remove query params and fragments)
    if (id.startsWith('http')) {
        try {
            const u = new URL(id);
            id = u.origin + u.pathname;
        } catch(e) {}
    }

    return `${metadata.orgId}:${metadata.system}:${id}`;
}

function LEGACY_getDisplayName(metadata) {
    if (!metadata) return 'Untitled';
    const renames = AppState.renames || {};
    const key = getRenameKey(metadata);
    let name = renames[key] || metadata.functionName || metadata.title || 'Untitled';

    const cleaners = [
        /^\(\d+\)\s*/, // Remove Zoho sequence prefix like (1)
        /^Zoho - Functions - Zoho CRM - /,
        /^Zoho - CRM - Functions - /,
        /^Functions - Zoho CRM - /,
        /^Functions - /,
        /^Zoho CRM - /,
        /^Zoho - /,
        /^CRM - /,
        / - Zoho CRM$/,
        / - Zoho Creator$/,
        / - Zoho Flow$/,
        /^Zoho Creator - /,
        /^Zoho Flow - /
    ];

    let cleanName = name;
    cleaners.forEach(c => {
        cleanName = cleanName.replace(c, '');
    });

    return cleanName.trim() || name || 'Untitled';
}

function renameFunction(metadata) {
    const currentName = getDisplayName(metadata);
    const newName = prompt('Rename function:', currentName);
    if (newName && newName !== currentName) {
        const key = getRenameKey(metadata);
        AppState.renames[key] = newName;
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'user_renames': AppState.renames }, () => {
                renderExplorer();
                renderOpenEditors();
            });
        } else {
            renderExplorer();
            renderOpenEditors();
        }
    }
}

async function refreshContextualMappings() {
    if (!AppState.currentFile) return;
    try {
        const reachable = await InterfaceManager.getInterfacesForFile(AppState.currentFile.id);
        const flattened = {};

        // Group by type for precedence (lowest to highest)
        const groups = { 'GLOBAL': [], 'SYSTEM': [], 'FOLDER': [], 'FILE': [] };
        reachable.forEach(i => {
            if (groups[i.ownerType]) groups[i.ownerType].push(i);
        });

        // Apply in order so File overrides Folder, etc.
        ['GLOBAL', 'SYSTEM', 'FOLDER', 'FILE'].forEach(type => {
            groups[type].forEach(i => {
                flattened[i.name] = i.structure;
            });
        });

        window.interfaceMappings = flattened;
        updateInterfaceMappingsList();
    } catch (e) {
        console.error('[ZohoIDE] refreshContextualMappings failed:', e);
    }
}

async function selectTabFile(tab) {
    console.log('[ZohoIDE] Selecting tab:', tab.tabId, tab.functionName);
    AppState.currentFile = { id: tab.functionId, type: 'tab', tabId: tab.tabId, data: tab };
    zideProjectUrl = tab.url;
    window.zideProjectUrl = zideProjectUrl;

    const key = getRenameKey(tab);
    const mInfo = getOrCreateModel(key);
    editor.setModel(mInfo.model);

    await refreshContextualMappings();

    // Detect Drift on Selection
    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE', tabId: tab.tabId }, async (response) => {
        if (response && response.code) {
            const status = await SyncService.detectStatus(tab.functionId, response.code);
            updateDriftUI(tab.tabId, status);
        }
    });

    renderOpenEditors();
    updateExplorerActiveState();
}

function updateDriftUI(tabId, status) {
    const statusMap = {
        'SYNCED': { label: 'Synced', color: '#50fa7b' },
        'DRIFT_LOCAL_NEWER': { label: 'Local Ahead', color: '#ffb86c' },
        'DRIFT_REMOTE_NEWER': { label: 'Remote Ahead', color: '#ffb86c' },
        'CONFLICT': { label: 'Conflict!', color: '#ff5555' },
        'DRIFT': { label: 'Drift Detected', color: '#ffb86c' },
        'OFFLINE': { label: 'Offline', color: '#888' }
    };

    const info = statusMap[status] || { label: 'Ready', color: '#888' };
    const syncStatusEl = document.getElementById('sync-status');
    if (syncStatusEl) {
        syncStatusEl.innerText = info.label;
        syncStatusEl.style.color = info.color;
    }
}

function pullFromSpecificTab(tabId) {
    log('System', 'Pulling code from tab ' + tabId + '...');
    // Optional: show a loading indicator in the editor
    editor.setValue('// Loading code from Zoho tab ' + tabId + '...\n// Please wait...');

    chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE', tabId: tabId }, (response) => {
        console.log('[ZohoIDE] Pull response from tab', tabId, ':', response);
        if (response && response.code) {
            editor.setValue(response.code);
            log('Success', 'Code pulled from tab ' + tabId);
            showStatus('Code pulled from tab ' + tabId, 'success');
        } else {
            const error = response?.error || 'Failed to pull code.';
            log('Error', error);
            showStatus('Pull failed: ' + error, 'error');
            // Optionally clear editor or show message if it's a hard error
            if (response?.error === 'No editor found in any frame') {
                 // window.editor.setValue('// [No editor found in this tab]');
            }
        }
    });
}

async function safeDeleteFile(fileId, fileName) {
    try {
        const interfaces = await DB.getAll('Interfaces');
        const sharedOwned = interfaces.filter(i => i.ownerId === fileId && i.sharedScope !== 'LOCAL');

        if (sharedOwned.length > 0) {
            const modal = document.getElementById('adoption-modal');
            const list = document.getElementById('orphaned-interfaces-list');
            const msg = document.getElementById('adoption-message');

            msg.innerText = `File '${fileName}' owns shared interfaces. Promote them to System level before deleting?`;
            list.innerHTML = sharedOwned.map(i => `<div style="font-size:12px; padding:4px; border-bottom:1px solid #333;">${i.name} (${i.sharedScope})</div>`).join('');

            modal.style.display = 'flex';

            document.getElementById('adoption-confirm').onclick = async () => {
                const file = await FileManager.getFile(fileId);
                for (const i of sharedOwned) {
                    i.ownerId = file.orgId;
                    i.ownerType = 'SYSTEM';
                    await InterfaceManager.saveInterface(i);
                }
                await FileManager.deleteFile(fileId);
                modal.style.display = 'none';
                window.loadExplorerData();
                window.showStatus(`Deleted ${fileName} and promoted ${sharedOwned.length} interfaces.`, 'success');
            };
            return;
        }

        if (confirm(`Remove ${fileName} from IDE Explorer?`)) {
            await FileManager.deleteFile(fileId);
            await window.loadExplorerData();
        }
    } catch (e) {
        console.error('[ZohoIDE] safeDeleteFile failed:', e);
    }
}

async function loadExplorerData() {
    console.log('[ZohoIDE] Loading Explorer Data from IndexedDB...');
    try {
        const files = await FileManager.getAllFiles();

        // Reconstruct savedFunctions tree for legacy rendering logic
        window.AppState.savedFunctions = {};
        files.forEach(file => {
            const orgId = file.orgId || 'global';
            const system = file.system || 'Zoho';
            const folder = file.folder || 'General';

            if (!window.AppState.savedFunctions[orgId]) window.AppState.savedFunctions[orgId] = {};
            if (!window.AppState.savedFunctions[orgId][system]) window.AppState.savedFunctions[orgId][system] = {};
            if (!window.AppState.savedFunctions[orgId][system][folder]) window.AppState.savedFunctions[orgId][system][folder] = {};

            window.AppState.savedFunctions[orgId][system][folder][file.id] = file;
        });

        const history = await DB.getAll('History');
        window.AppState.history = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
        window.updateSavedFilesList(window.AppState.history);

        // Load mappings
        const currentOrg = (window.AppState.currentFile?.data?.orgId || 'global').toString().toLowerCase();
        const interfaces = await DB.getAll('Interfaces');
        window.interfaceMappings = {};
        interfaces.forEach(i => {
            // Filter by scope (simplified for now)
            if (i.ownerId === currentOrg || i.ownerId === 'global') {
                window.interfaceMappings[i.name] = i.structure;
            }
        });
        window.interfaceMappings = window.interfaceMappings;

        window.renderExplorer();
        updateInterfaceMappingsList();
    } catch (e) {
        console.error('[ZohoIDE] loadExplorerData failed:', e);
    }
}

function LEGACY_renderExplorer() {
    const treeEl = document.getElementById('project-explorer-tree');
    if (!treeEl) return;
    treeEl.innerHTML = '';

    const tree = window.AppState.savedFunctions;
    const orgs = Object.keys(tree);

    if (orgs.length === 0) {
        treeEl.innerHTML = '<div class="log-entry" style="font-size:11px; opacity:0.6; padding: 10px;">No saved projects.</div>';
        return;
    }

    orgs.forEach(orgId => {
        const orgNode = createTreeNode(`Client: ${orgId}`, 'business', 'org-' + orgId);
        let hasActiveChildInOrg = false;

        // Delete button for Client
        const orgHeader = orgNode.querySelector('.explorer-header');
        const orgDel = createDeleteBtn(`client "${orgId}"`, async () => {
            // Delete all files for this org
            const files = await FileManager.getAllFiles();
            for (const file of files) {
                if (file.orgId === orgId) await FileManager.deleteFile(file.id);
            }
            await window.loadExplorerData();
        });
        orgHeader.appendChild(orgDel);

        const systems = tree[orgId];

        Object.keys(systems).forEach(system => {
            const systemNode = createTreeNode(system, 'settings', `sys-${orgId}-${system}`);
            let hasActiveChildInSys = false;
            const sysHeader = systemNode.querySelector('.explorer-header');
            const sysDel = createDeleteBtn(`system "${system}" in client "${orgId}"`, async () => {
                const files = await FileManager.getAllFiles();
                for (const file of files) {
                    if (file.orgId === orgId && file.system === system) await FileManager.deleteFile(file.id);
                }
                await window.loadExplorerData();
            });
            sysHeader.appendChild(sysDel);

            const folders = systems[system];

            Object.keys(folders).forEach(folder => {
                const folderNode = createTreeNode(folder, 'folder', `folder-${orgId}-${system}-${folder}`);
                let hasActiveChildInFolder = false;
                const foldHeader = folderNode.querySelector('.explorer-header');
                const foldDel = createDeleteBtn(`folder "${folder}" in ${system}`, async () => {
                    const files = await FileManager.getAllFiles();
                    for (const file of files) {
                        if (file.orgId === orgId && file.system === system && file.folder === folder) {
                            await FileManager.deleteFile(file.id);
                        }
                    }
                    await window.loadExplorerData();
                });
                foldHeader.appendChild(foldDel);

                const functions = folders[folder];

                Object.keys(functions).forEach(funcId => {
                    const func = functions[funcId];
                    const funcItem = document.createElement('div');
                    funcItem.className = 'explorer-item';
                    funcItem.style.paddingLeft = '30px';
                    const isActive = window.AppState.currentFile && window.AppState.currentFile.id === funcId && window.AppState.currentFile.data.orgId === orgId;
                    if (isActive) {
                        funcItem.classList.add('active');
                        hasActiveChildInOrg = true;
                        hasActiveChildInSys = true;
                        hasActiveChildInFolder = true;
                    }

                    const isOnline = window.AppState.activeTabs.some(t => t.functionId === funcId || (t.functionName === func.name && t.orgId === orgId));

                    const key = window.getRenameKey(func.metadata);
                    const mInfo = window.AppState.models[key];
                    const isModified = mInfo && mInfo.model.getValue() !== mInfo.originalCode;

                    let statusClass = isOnline ? 'active' : 'offline';
                    let statusTitle = isOnline ? 'Online' : 'Offline';

                    if (isModified) {
                        statusClass = 'modified';
                        statusTitle = 'Unsaved local changes';
                    } else if (mInfo && mInfo.syncStatus && mInfo.syncStatus !== 'SYNCED') {
                        statusClass = 'drift';
                        statusTitle = `Drift: ${mInfo.syncStatus}`;
                        if (mInfo.syncStatus === 'CONFLICT') statusClass = 'conflict';
                    }

                    const displayName = window.getDisplayName(func.metadata);

                    funcItem.innerHTML = `
                        <span class="material-icons" style="font-size:14px; color:#ce9178;">description</span>
                        <span style="flex:1; overflow:hidden; text-overflow:ellipsis;" class="func-name-text">${displayName}</span>
                        <span class="status-dot ${statusClass}" style="margin-right: 5px;" title="${statusTitle}"></span>
                    `;

                    const renameBtn = document.createElement('span');
                    renameBtn.className = 'material-icons';
                    renameBtn.innerHTML = 'edit';
                    renameBtn.style.fontSize = '12px';
                    renameBtn.style.color = '#888';
                    renameBtn.style.cursor = 'pointer';
                    renameBtn.style.marginRight = '5px';
                    renameBtn.title = 'Rename Function';
                    renameBtn.onclick = (e) => {
                        e.stopPropagation();
                        window.renameFunction(func.metadata);
                    };
                    funcItem.appendChild(renameBtn);

                    const deleteBtn = document.createElement('span');
                    deleteBtn.className = 'material-icons';
                    deleteBtn.innerHTML = 'close';
                    deleteBtn.style.fontSize = '14px';
                    deleteBtn.style.color = '#888';
                    deleteBtn.style.cursor = 'pointer';
                    deleteBtn.title = 'Remove from IDE';
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation();
                        await window.safeDeleteFile(funcId, func.name);
                    };
                    funcItem.appendChild(deleteBtn);

                    funcItem.onclick = () => {
                        window.selectSavedFile(orgId, system, folder, funcId);
                    };

                    if (isActive) {
                        setTimeout(() => {
                            funcItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    }

                    folderNode.querySelector('.tree-sub').appendChild(funcItem);
                    if (hasActiveChildInFolder) {
                        folderNode.querySelector('.explorer-header').classList.remove('collapsed');
                        folderNode.querySelector('.tree-sub').style.display = 'block';
                    }
                });
                if (hasActiveChildInSys) {
                    systemNode.querySelector('.explorer-header').classList.remove('collapsed');
                    systemNode.querySelector('.tree-sub').style.display = 'block';
                }
                systemNode.querySelector('.tree-sub').appendChild(folderNode);
            });
            if (hasActiveChildInOrg) {
                orgNode.querySelector('.explorer-header').classList.remove('collapsed');
                orgNode.querySelector('.tree-sub').style.display = 'block';
            }
            orgNode.querySelector('.tree-sub').appendChild(systemNode);
        });
        treeEl.appendChild(orgNode);
    });
}

function createDeleteBtn(targetDesc, onDelete) {
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'material-icons explorer-action-btn';
    deleteBtn.innerHTML = 'close';
    deleteBtn.style.fontSize = '14px';
    deleteBtn.style.color = '#888';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.marginLeft = 'auto';
    deleteBtn.style.marginRight = '5px';
    deleteBtn.style.flexShrink = '0';
    deleteBtn.title = `Delete ${targetDesc} and all its functions`;
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete entire ${targetDesc} and all its saved functions?`)) {
            onDelete();
        }
    };
    return deleteBtn;
}

function createTreeNode(label, icon, id) {
    const node = document.createElement('div');
    node.className = 'explorer-section';

    const header = document.createElement('div');
    header.className = 'explorer-header collapsed';
    header.innerHTML = `
        <span class="material-icons">expand_more</span>
        <span class="material-icons" style="font-size:14px; color:#888;">${icon}</span>
        <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 5px;">${label}</span>
    `;

    const sub = document.createElement('div');
    sub.className = 'tree-sub explorer-tree';
    sub.style.display = 'none';

    header.onclick = () => {
        const isCollapsed = header.classList.toggle('collapsed');
        sub.style.display = isCollapsed ? 'none' : 'block';
    };

    node.appendChild(header);
    node.appendChild(sub);
    return node;
}

async function selectSavedFile(orgId, system, folder, funcId) {
    const func = window.AppState.savedFunctions[orgId][system][folder][funcId];
    window.AppState.currentFile = { id: funcId, type: 'saved', data: func.metadata };

    const key = window.getRenameKey(func.metadata);
    const mInfo = window.getOrCreateModel(key, func.code);
    // If we just created it from saved file, and it had no code, set it
    if (mInfo.model.getValue() === "" && func.code) {
        mInfo.model.setValue(func.code);
        mInfo.originalCode = func.code;
    }
    window.editor.setModel(mInfo.model);

    await refreshContextualMappings();

    // Check if we can reconnect to an active tab
    const matchingTab = window.AppState.activeTabs.find(t => t.functionId === funcId || (t.functionName === func.name && t.orgId === orgId));
    if (matchingTab) {
        window.AppState.currentFile.tabId = matchingTab.tabId;
        window.AppState.currentFile.type = 'tab';
        window.log('System', `Reconnected to active tab: ${matchingTab.title}`);

        // Detect Drift
        chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE', tabId: matchingTab.tabId }, async (response) => {
            if (response && response.code) {
                const status = await SyncService.detectStatus(funcId, response.code);
                updateDriftUI(matchingTab.tabId, status);
                mInfo.syncStatus = status;
                window.renderExplorer();
                window.renderOpenEditors();
            }
        });
    } else {
        window.log('System', `Opened saved file (Offline)`);
        updateDriftUI(null, 'OFFLINE');
    }

    window.renderExplorer();
    window.renderOpenEditors();
}

function updateExplorerActiveState() {
    window.renderExplorer();
}

const bind = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
};

function openExtractInterfaceModal(jsonText) {
    document.getElementById('modal-title').innerText = 'Extract to Interface';
    document.getElementById('interface-var-name').value = 'NewInterface';
    document.getElementById('interface-input').value = window.tryFixJson(jsonText);
    document.getElementById('modal-json-status').innerHTML = '';

    document.getElementById('modal-var-container').style.display = 'block';
    document.getElementById('modal-convert').style.display = 'none';
    document.getElementById('modal-map-only').style.display = 'block';
    document.getElementById('modal-map-only').innerText = 'Create Interface';
    document.getElementById('interface-modal').style.display = 'flex';
    window.validateModalJson();
}

function setupEventHandlers() {
    bind('adoption-modal-close', 'click', () => { document.getElementById('adoption-modal').style.display = 'none'; });
    bind('adoption-cancel', 'click', () => { document.getElementById('adoption-modal').style.display = 'none'; });

    bind('new-btn', 'click', () => {
        if (confirm('Start a new script?')) {
            window.editor.setValue('// New Zoho Deluge Script\n\n');
            window.AppState.currentFile = null;
            window.renderOpenEditors();
            window.renderExplorer();
        }
    });

    bind('open-editors-header', 'click', (e) => {
        if (e.target.id === 'sync-tabs-btn') return;
        const header = document.getElementById('open-editors-header');
        const list = document.getElementById('open-editors-list');
        const isCollapsed = header.classList.toggle('collapsed');
        list.style.display = isCollapsed ? 'none' : 'block';
    });

    bind('sync-tabs-btn', 'click', (e) => {
        e.stopPropagation();
        window.showStatus("Syncing tabs & Resetting ignored list...");
        window.AppState.ignoredTabIds.clear();
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'zide_ignored_tabs': [] });
        }
        window.syncAppTabs();
    });

    bind('project-explorer-header', 'click', () => {
        const header = document.getElementById('project-explorer-header');
        const list = document.getElementById('project-explorer-tree');
        const isCollapsed = header.classList.toggle('collapsed');
        list.style.display = isCollapsed ? 'none' : 'block';
    });

    bind('history-header', 'click', () => {
        const header = document.getElementById('history-header');
        const list = document.getElementById('saved-files-list');
        const isCollapsed = header.classList.toggle('collapsed');
        list.style.display = isCollapsed ? 'none' : 'block';
    });

    bind('pull-btn', 'click', window.pullFromZoho);
    bind('push-btn', 'click', () => window.pushToZoho(true));
    bind('execute-btn', 'click', () => window.pushToZoho(true, true));
    bind('save-btn', 'click', window.saveLocally);

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
            if (window.editor) window.editor.layout();
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
            if (window.editor) window.editor.updateOptions({ fontSize: fs });
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
            const codeContext = window.editor.getValue();
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

        if (window.researchPollingInterval) clearInterval(window.researchPollingInterval);

        window.researchPollingInterval = setInterval(async () => {
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
                    clearInterval(window.researchPollingInterval);
                    updateProgress(100, "Research Complete");
                    const report = data.outputs?.[data.outputs.length - 1]?.text || "No output generated.";
                    showResearchResult(report);
                } else if (data.status === 'failed') {
                    clearInterval(window.researchPollingInterval);
                    const st = document.getElementById('research-status-text');
                    if (st) st.innerText = "Error: Research failed.";
                }
            } catch (e) {
                clearInterval(window.researchPollingInterval);
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
        window.currentResearchReport = report;
        const resContainer = document.getElementById('research-result-container');
        const reportEdit = document.getElementById('research-report-edit');
        if (resContainer) resContainer.style.display = 'flex';
        if (reportEdit) reportEdit.value = report;
    }

    function handoffToArchitecture() {
        const reportEdit = document.getElementById('research-report-edit');
        const report = reportEdit ? reportEdit.value : "";
        window.currentResearchReport = report;

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
            if (window.editor) window.editor.updateOptions({ fontSize: fs });
            document.getElementById('editor-font-size').value = fs;
        }

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({
                'gemini_api_key': key,
                'gemini_model': model,
                'activation_behavior': document.getElementById('activation-behavior').value,
                'font_size': fontSize
            }, () => {
                window.log('Success', 'Settings saved.');
            });
        }
    });

    bind('ai-ask-btn', 'click', () => window.askGemini());
    bind('ai-explain-btn', 'click', window.explainCode);
    bind('ai-question', 'keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) window.askGemini();
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
            document.getElementById('interface-input').value = window.tryFixJson(text);
            window.validateModalJson();
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    });

    bind('interface-input', 'input', () => {
        window.validateModalJson();
    });

    bind('interface-input', 'paste', () => {
        setTimeout(() => {
            const input = document.getElementById('interface-input');
            if (input) {
                input.value = window.tryFixJson(input.value);
                window.validateModalJson();
            }
        }, 0);
    });

    bind('modal-fix-json', 'click', () => {
        const input = document.getElementById('interface-input');
        if (input) {
            input.value = window.tryFixJson(input.value);
            window.validateModalJson();
        }
    });

    bind('modal-convert', 'click', () => {
        const varName = document.getElementById('interface-var-name').value || 'payload';
        let jsonStr = document.getElementById('interface-input').value;

        // Final attempt to fix before processing
        jsonStr = window.tryFixJson(jsonStr);

        const style = document.getElementById('gen-style') ? document.getElementById('gen-style').value : 'step';
        const update = document.getElementById('gen-update') ? document.getElementById('gen-update').checked : false;
        try {
            const code = window.convertInterfaceToDeluge(varName, jsonStr, { style, update });
            window.editor.executeEdits('json-convert', [{ range: window.editor.getSelection(), text: code }]);
            document.getElementById('interface-modal').style.display = 'none';
        } catch (e) {
            console.error("[ZohoIDE] modal-convert Error:", e);
            alert('Invalid JSON: ' + e.message);
        }
    });

    bind('modal-map-only', 'click', () => {
        const name = document.getElementById('interface-var-name').value || 'mapping';
        let jsonStr = document.getElementById('interface-input').value;
        jsonStr = window.tryFixJson(jsonStr);
        window.saveInterfaceMapping(name, jsonStr);
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

    window.initResources();


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
        interfaceMappings[name] = obj;
        window.interfaceMappings = interfaceMappings;

        const currentOrg = (AppState.currentFile?.data?.orgId || 'global').toString().toLowerCase();

        await DB.put('Interfaces', {
            id: `${currentOrg}:${name}`,
            name: name,
            structure: obj,
            ownerId: currentOrg,
            ownerType: currentOrg === 'global' ? 'GLOBAL' : 'SYSTEM',
            sharedScope: currentOrg === 'global' ? 'GLOBAL' : 'SYSTEM'
        });

        updateInterfaceMappingsList();
    } catch (e) {
        console.error("[ZohoIDE] window.saveInterfaceMapping Error:", e);
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
                delete interfaceMappings[name];
                window.interfaceMappings = interfaceMappings;
                if (window.activeMappingName === name) {
                    window.activeMappingName = null;
                    document.getElementById('interface-tree-view').innerHTML = '<div style="font-size:11px; opacity:0.5; text-align:center; margin-top:20px;">Select a mapping to explore its structure</div>';
                }

                const currentOrg = (AppState.currentFile?.data?.orgId || 'global').toString().toLowerCase();
                await DB.delete('Interfaces', `${currentOrg}:${name}`);

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

    const targetTab = AppState.activeTabs.find(t => t.tabId === AppState.currentFile?.tabId) || window.currentTargetTab;
    const targetTabId = targetTab?.tabId;

    if (!targetTabId) {
        log('Error', 'No Zoho tab connected. Please open a Zoho Deluge editor tab first.');
        return;
    }
    log('System', 'Pulling code...');
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE', tabId: targetTabId }, (response) => {
            if (response && response.code) {
                const key = getRenameKey(targetTab);
                const mInfo = getOrCreateModel(key, response.code);
                mInfo.model.setValue(response.code);
                mInfo.originalCode = response.code;
                editor.setModel(mInfo.model);

                // Update Sync History
                SyncService.markSynced(targetTab.functionId, response.code);
                updateDriftUI(targetTabId, 'SYNCED');

                log('Success', 'Code pulled.');
                renderOpenEditors();
            } else { log('Error', response?.error || 'No code found.'); }
        });
    }
}

function pushToZoho(triggerSave = false, triggerExecute = false) {
    const now = Date.now();
    if (now - lastActionTime < 1000) return;
    lastActionTime = now;

    let targetTab = AppState.activeTabs.find(t => t.tabId === AppState.currentFile?.tabId);

    // Fallback to any matching tab for this file if the specific tabId is gone
    if (!targetTab && AppState.currentFile) {
        targetTab = AppState.activeTabs.find(t => t.functionId === AppState.currentFile.id || (t.functionName === AppState.currentFile.data?.name && t.orgId === AppState.currentFile.data?.orgId));
    }

    // Ultimate fallback to currentTargetTab
    if (!targetTab) targetTab = window.currentTargetTab;

    const targetTabId = targetTab?.tabId;

    if (!targetTabId) {
        log('Error', 'No Zoho tab connected or function not found in any open tab. Sync/Execute failed.');
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

    // Focus tab if requested
    if (triggerSave) {
        chrome.runtime.sendMessage({ action: 'OPEN_ZOHO_EDITOR', tabId: targetTabId });
    }

    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code, tabId: targetTabId }, (response) => {
            if (response && response.success) {
                log('Success', 'Code pushed.');

                // Update originalCode to mark as synced
                const key = getRenameKey(targetTab);
                if (AppState.models[key]) {
                    AppState.models[key].originalCode = code;
                    saveModelsToStorage();

                    // Update Sync History
                    SyncService.markSynced(targetTab.functionId, code);
                    updateDriftUI(targetTabId, 'SYNCED');

                    renderOpenEditors();
                }

                if (triggerSave || triggerExecute) {
                    chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE', tabId: targetTabId }, (res) => {
                        if (res && res.success) {
                            log('Success', 'Zoho Save triggered.');

                            if (triggerExecute) {
                                log('System', 'Waiting 700ms before execution...');
                                setTimeout(() => {
                                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE', tabId: targetTabId }, (execRes) => {
                                        if (execRes && execRes.success) log('Success', 'Zoho Execute triggered.');
                                        else log('Warning', 'Zoho Execute trigger failed.');
                                    });
                                }, 700);
                            }
                        } else {
                            log('Warning', 'Zoho Save trigger failed.');
                            if (triggerExecute) {
                                setTimeout(() => {
                                    chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE', tabId: targetTabId }, (execRes) => {
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
    const code = editor.getValue();
    let meta = AppState.currentFile?.data || window.currentTargetTab;

    if (!meta) {
        const name = prompt('Enter a name for this script:', 'Untitled Script');
        if (!name) return;
        meta = {
            orgId: 'global',
            system: 'Generic',
            folder: 'Manual Saves',
            functionName: name,
            functionId: 'manual_' + Date.now(),
            url: 'global'
        };
    }

    const orgId = (meta.orgId || 'global').toString().toLowerCase();
    const system = meta.system || 'Zoho';
    const folder = meta.folder || 'General';
    const name = meta.functionName || 'Untitled';
    const id = meta.functionId || 'id_' + Date.now();

    const fileData = {
        id: id,
        orgId: orgId,
        system: system,
        folder: folder,
        name: name,
        code: code,
        originalCode: AppState.models[getRenameKey(meta)]?.originalCode || code,
        metadata: meta
    };

    try {
        await FileManager.saveFile(fileData);
        log('Success', `Saved ${name} to Explorer.`);
        showStatus('Saved locally', 'success');

        // Refresh UI
        loadExplorerData();
    } catch (e) {
        log('Error', 'Save failed: ' + e.message);
    }

    // Cloud Sync (Legacy support)
    if (window.activeCloudFileId && typeof CloudService !== 'undefined') {
        CloudService.saveFile(window.activeCloudFileId, {
            code: code,
            interfaceMappings: window.interfaceMappings || {},
            url: meta?.url || 'global'
        });
    }
}

function updateSavedFilesList(files) {
    const list = document.getElementById('saved-files-list');
    if (!list) return;
    list.innerHTML = '';
    if (files.length === 0) {
        list.innerHTML = '<div class="window.log-entry" style="font-size:11px; opacity:0.6;">No saved files yet.</div>';
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
            console.error("[ZohoIDE] window.askGemini Error:", e);
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

    // Expose internal functions to window for Cloud UI and testing
    window.updateInterfaceMappingsList = updateInterfaceMappingsList;
    window.showStatus = showStatus;
    window.loadExplorerData = loadExplorerData;
    window.renderExplorer = renderExplorer;
    window.renderOpenEditors = renderOpenEditors;
    window.renameFunction = renameFunction;
    window.selectTabFile = selectTabFile;
    window.selectSavedFile = selectSavedFile;
    window.syncAppTabs = syncAppTabs;
    window.getOrCreateModel = getOrCreateModel;
    window.getRenameKey = getRenameKey;
    window.safeDeleteFile = safeDeleteFile;
    window.updateDriftUI = updateDriftUI;

    function syncProblemsPanel() {
        const list = document.getElementById('problems-list');
        if (!list) return;

        if (!editor) return;
        const model = editor.getModel();
        if (!model) return;

        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        list.innerHTML = '';

        if (markers.length === 0) {
            list.innerHTML = '<div class="window.log-entry">No problems detected.</div>';
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
                window.editor.setPosition({ lineNumber: m.startLineNumber, column: m.startColumn });
                window.editor.revealLineInCenter(m.startLineNumber);
                window.editor.focus();
            };

            list.appendChild(item);
        });
    }
    window.syncProblemsPanel = syncProblemsPanel;



// Expose functions to window
window.saveLocally = saveLocally;
window.log = log;
window.selectSavedFile = selectSavedFile;
window.pushToZoho = pushToZoho;
window.tryFixJson = tryFixJson;
window.openEditMappingModal = openEditMappingModal;
window.updateDriftUI = updateDriftUI;
window.initEditor = initEditor;
window.safeDeleteFile = safeDeleteFile;
window.updateSavedFilesList = updateSavedFilesList;
window.explainCode = explainCode;
window.pullFromSpecificTab = pullFromSpecificTab;
window.selectTabFile = selectTabFile;
window.setupEventHandlers = setupEventHandlers;
window.toggleRightSidebar = toggleRightSidebar;
window.showStatus = showStatus;
window.updateExplorerActiveState = updateExplorerActiveState;
window.pullFromZoho = pullFromZoho;
window.initResources = initResources;
window.renderInterfaceTree = renderInterfaceTree;
window.convertInterfaceToDeluge = convertInterfaceToDeluge;
window.renameFunction = renameFunction;
window.createDeleteBtn = createDeleteBtn;
window.updateInterfaceMappingsList = updateInterfaceMappingsList;
window.createTreeNode = createTreeNode;
window.validateModalJson = validateModalJson;
window.askGemini = askGemini;
window.extractVarsFromCode = extractVarsFromCode;
window.loadExplorerData = loadExplorerData;
window.openExtractInterfaceModal = openExtractInterfaceModal;
window.refreshContextualMappings = refreshContextualMappings;
window.saveInterfaceMapping = saveInterfaceMapping;
window.syncAppTabs = syncAppTabs;
})();