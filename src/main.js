import store from "./core/store.js";
import { DB } from "./core/db.js";

import fileManager from "./services/FileManager.js";
import interfaceManager from "./services/InterfaceManager.js";
import syncService from "./services/SyncService.js";
import aiService from "./services/AIService.js";
import { migrationService } from "./services/MigrationService.js";

import projectExplorer from "./ui/ProjectExplorer.js";
import tabManager from "./ui/TabManager.js";
import editorWrapper from "./ui/EditorWrapper.js";
import aiAgent from "./ui/AIAgent.js";
import interfaceTools from "./ui/InterfaceTools.js";
import settingsManager from "./ui/SettingsManager.js";
import sidebarManager from "./ui/SidebarManager.js";
import { initResizers } from "./ui/resizers.js";

// Global Utils
function log(type, message) {
    const consoleOutput = document.getElementById("console-output");
    if (!consoleOutput) return;
    const entry = document.createElement("div");
    entry.className = `log-entry ${type.toLowerCase()}`;
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`;
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function showStatus(message, type = "info") {
    const statusEl = document.getElementById("status-indicator");
    if (statusEl) {
        // Legacy status handling (for non-drift messages)
        // If message is "Saved locally", show it temporarily then revert?
        // Ideally we should use a toast or snackbar, but for now specific messages might override the sync status briefly.
        // However, the new sync status is robust. We might want to separate "System Status" from "Sync Status".
        // The current ID "status-indicator" is being repurposed for Sync Status in the header.
        // Let's check where showStatus is used.
        // It is used for "Saved locally" and "Reconnecting...".
        // Maybe we log it instead or use a separate notification area.
        // For now, I'll log it and let the drift UI handle the main indicator.
        log(type, message);
    }
}

// Controller Logic

function getOrCreateModel(key, initialCode = "") {
    if (store.state.models[key]) return store.state.models[key];

    // Check if we have this file in IndexedDB but not in memory yet
    // In this architecture, we rely on Monaco models
    const model = monaco.editor.createModel(initialCode, "deluge");
    store.state.models[key] = {
        model: model,
        originalCode: initialCode,
        syncStatus: "UNKNOWN"
    };

    let saveTimeout;
    model.onDidChangeContent(() => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            fileManager.saveModelsToStorage();
        }, 1000);

        if (window.validateDelugeModel) window.validateDelugeModel(model);
        tabManager.renderOpenEditors();
        // projectExplorer.renderExplorer(); // Avoid full re-render on every keystroke if possible
    });

    return store.state.models[key];
}

async function selectSavedFile(detail) {
    const { orgId, system, folder, funcId, code, metadata } = detail;
    store.state.currentFile = { id: funcId, type: "saved", data: metadata };

    const key = tabManager.getRenameKey(metadata);
    const mInfo = getOrCreateModel(key, code);
    if (mInfo.model.getValue() === "" && code) {
        mInfo.model.setValue(code);
        mInfo.originalCode = code;
    }
    editorWrapper.editor.setModel(mInfo.model);

    // Refresh Mappings
    // ... logic for mappings refresh ...

    // Check if connected to active tab
    const matchingTab = store.state.activeTabs.find(t => t.functionId === funcId || (t.functionName === metadata.functionName && t.orgId === orgId));
    if (matchingTab) {
        store.state.currentFile.tabId = matchingTab.tabId;
        store.state.currentFile.type = "tab";
        log("System", `Reconnected to active tab: ${matchingTab.title}`);

        chrome.runtime.sendMessage({ action: "GET_ZOHO_CODE", tabId: matchingTab.tabId }, async (response) => {
            if (response && response.code) {
                const status = await syncService.detectStatus(funcId, response.code);
                mInfo.syncStatus = status;
                window.dispatchEvent(new CustomEvent("update-drift-ui", { detail: { tabId: matchingTab.tabId, status } }));
                tabManager.renderOpenEditors();
            }
        });
    } else {
        log("System", `Opened saved file (Offline)`);
        window.dispatchEvent(new CustomEvent("update-drift-ui", { detail: { tabId: null, status: "OFFLINE" } }));
    }

    tabManager.renderOpenEditors();
}

async function selectTabFile(tab) {
    console.log("[ZohoIDE] Selecting tab:", tab.tabId, tab.title);
    store.state.currentFile = { id: tab.functionId, type: "tab", tabId: tab.tabId, data: tab };
    store.state.zideProjectUrl = tab.url;

    const key = tabManager.getRenameKey(tab);
    const mInfo = getOrCreateModel(key);
    editorWrapper.editor.setModel(mInfo.model);

    // Detect Drift
    chrome.runtime.sendMessage({ action: "GET_ZOHO_CODE", tabId: tab.tabId }, async (response) => {
        if (response && response.code) {
            const status = await syncService.detectStatus(tab.functionId, response.code);
            window.dispatchEvent(new CustomEvent("update-drift-ui", { detail: { tabId: tab.tabId, status } }));
        }
    });

    tabManager.renderOpenEditors();
}

async function saveLocally() {
    const code = editorWrapper.getValue();
    let meta = store.state.currentFile?.data || window.currentTargetTab;

    if (!meta) {
        const name = prompt("Enter a name for this script:", "Untitled Script");
        if (!name) return;
        meta = {
            orgId: "global",
            system: "Generic",
            folder: "Manual Saves",
            functionName: name,
            functionId: "manual_" + Date.now(),
            url: "global"
        };
    }

    const orgId = (meta.orgId || "global").toString().toLowerCase();
    const system = meta.system || "Zoho";
    const folder = meta.folder || "General";
    const name = meta.functionName || "Untitled";
    const id = meta.functionId || "id_" + Date.now();

    const fileData = {
        id: id,
        orgId: orgId,
        system: system,
        folder: folder,
        name: name,
        code: code,
        originalCode: store.state.models[tabManager.getRenameKey(meta)]?.originalCode || code,
        metadata: meta
    };

    try {
        await fileManager.saveFile(fileData);
        log("Success", `Saved ${name} to Explorer.`);
        // showStatus("Saved locally", "success");
        log("Success", "Saved locally");
        projectExplorer.loadExplorerData();
    } catch (e) {
        log("Error", "Save failed: " + e.message);
    }
}

async function bootstrap() {
    console.log("Bootstrap Main...");

    // Legacy Exports
    window.showStatus = showStatus;
    window.log = log;
    window.getOrCreateModel = getOrCreateModel;
    window.AppState = store.state;
    window.FileManager = fileManager;
    window.SyncService = syncService;
    window.DB = DB;
    window.InterfaceManager = interfaceManager;
    window.updateInterfaceMappingsList = () => interfaceTools.updateInterfaceMappingsList(); // Wrapper

    initResizers();

    // Run migration in background
    migrationService.runPhase5Migration().catch(e => console.error(e));

    // Event Wiring
    window.addEventListener("file-selected", (e) => selectSavedFile(e.detail));
    window.addEventListener("tab-selected", (e) => selectTabFile(e.detail.tab));

    window.addEventListener("trigger-save-local", () => saveLocally());
    window.addEventListener("trigger-push-zoho", () => syncService.pushToZoho(editorWrapper.editor));
    window.addEventListener("trigger-push-execute-zoho", () => syncService.pushToZoho(editorWrapper.editor, false, true));
    window.addEventListener("trigger-pull-zoho", () => syncService.pullFromZoho(editorWrapper.editor));

    window.addEventListener("update-drift-ui", (e) => {
        const { tabId, status } = e.detail;

        // 1. Reset Buttons
        const pushBtn = document.getElementById('push-btn');
        const pullBtn = document.getElementById('pull-btn');
        if (pushBtn) { pushBtn.className = ''; pushBtn.title = "Sync (Ctrl+Shift+S)"; }
        if (pullBtn) { pullBtn.className = ''; pullBtn.title = "Pull (Ctrl+Shift+P)"; }

        // 2. Status Map
        const statusMap = {
            'SYNCED': {
                html: '<span class="material-icons" style="font-size:14px;">check_circle</span> Synced',
                css: 'status-synced',
                desc: 'Code matches Zoho.'
            },
            'DRIFT_LOCAL_NEWER': {
                html: '<span class="material-icons" style="font-size:14px;">edit</span> Modified',
                css: 'status-drift',
                desc: 'You have unsaved changes.'
            },
            'DRIFT_REMOTE_NEWER': {
                html: '<span class="material-icons" style="font-size:14px;">cloud_download</span> Remote Newer',
                css: 'status-drift',
                desc: 'Zoho has newer changes. Please Pull.'
            },
            'CONFLICT': {
                html: '<span class="material-icons" style="font-size:14px;">warning</span> Conflict',
                css: 'status-conflict',
                desc: 'Both versions changed. Manual fix required.'
            },
            'OFFLINE': {
                html: '<span class="material-icons" style="font-size:14px;">cloud_off</span> Offline',
                css: 'status-offline',
                desc: 'Tab closed.'
            }
        };

        const info = statusMap[status] || { html: 'Ready', css: '' };

        // 3. Update Header Chip
        const syncStatusEl = document.getElementById("sync-status");
        if (syncStatusEl) {
            syncStatusEl.innerHTML = info.html;
            syncStatusEl.className = '';
            if (info.css) syncStatusEl.classList.add(info.css);
            syncStatusEl.title = info.desc;
            syncStatusEl.style.color = ""; // Reset inline color
        }

        // 4. Update Buttons
        if (status === 'DRIFT_REMOTE_NEWER') {
            if (pullBtn) {
                pullBtn.classList.add('btn-warning');
                pullBtn.title = "⚠️ Remote is newer! Click to update local code.";
            }
        }
        else if (status === 'CONFLICT') {
            if (pushBtn) {
                pushBtn.classList.add('btn-danger');
                pushBtn.title = "🛑 Conflict! Push will overwrite remote changes.";
            }
            if (pullBtn) {
                pullBtn.classList.add('btn-warning');
            }
        }
    });

    // Bind global buttons that might not be in specific UI components (like header buttons)
    // Actually most are covered by UI components.
    // Except maybe specific ones in ide.html that I missed.
    // Pull/Push/Execute buttons in header:
    document.getElementById("pull-btn")?.addEventListener("click", () => syncService.pullFromZoho(editorWrapper.editor));
    document.getElementById("push-btn")?.addEventListener("click", () => syncService.pushToZoho(editorWrapper.editor, true));
    document.getElementById("execute-btn")?.addEventListener("click", () => syncService.pushToZoho(editorWrapper.editor, true, true));
    document.getElementById("save-btn")?.addEventListener("click", () => saveLocally());

    // --- Phase 3: Event Listeners ---
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'TAB_SWITCHED') {
                const { tabId, fileId } = message;
                console.log("[Main] TAB_SWITCHED:", tabId, fileId);
                tabManager.setActive(tabId);
            }
            else if (message.type === 'ZO_FOCUS_GAINED') {
                const { tabId, fileId, metadata } = message;
                console.log("[Main] ZO_FOCUS_GAINED:", tabId);

                // Trigger Traffic Light Update
                chrome.runtime.sendMessage({ action: "GET_ZOHO_CODE", tabId: tabId }, async (response) => {
                     if (response && response.code) {
                         const status = await syncService.detectStatus(metadata.functionId, response.code);
                         window.dispatchEvent(new CustomEvent("update-drift-ui", { detail: { tabId: tabId, status } }));
                     }
                });
            }
        });
    }

    console.log("Main Bootstrapped.");
}

if (document.readyState === "complete") {
    bootstrap();
} else {
    window.addEventListener("load", bootstrap);
}
