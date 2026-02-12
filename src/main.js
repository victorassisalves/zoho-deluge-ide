// src/main.js
import store from "./core/store.js";
import { DB } from "./core/db.js";
import fileManager from "./services/FileManager.js";
import interfaceManager from "./services/InterfaceManager.js";
import syncService from "./services/SyncService.js";
import aiService from "./services/AIService.js";

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
        statusEl.innerText = message;
        statusEl.style.cursor = "pointer";
        statusEl.onclick = () => { showStatus("Reconnecting..."); tabManager.syncAppTabs(); };
        statusEl.style.color = type === "success" ? "#4ec9b0" : (type === "error" ? "#f44747" : "#888");
    }
    log(type, message);
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
        showStatus("Saved locally", "success");
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

    // Event Wiring
    window.addEventListener("file-selected", (e) => selectSavedFile(e.detail));
    window.addEventListener("tab-selected", (e) => selectTabFile(e.detail.tab));

    window.addEventListener("trigger-save-local", () => saveLocally());
    window.addEventListener("trigger-push-zoho", () => syncService.pushToZoho(editorWrapper.editor));
    window.addEventListener("trigger-push-execute-zoho", () => syncService.pushToZoho(editorWrapper.editor, false, true));
    window.addEventListener("trigger-pull-zoho", () => syncService.pullFromZoho(editorWrapper.editor));

    window.addEventListener("update-drift-ui", (e) => {
        const { tabId, status } = e.detail;
        const statusMap = {
            "SYNCED": { label: "Synced", color: "#50fa7b" },
            "DRIFT_LOCAL_NEWER": { label: "Local Ahead", color: "#ffb86c" },
            "DRIFT_REMOTE_NEWER": { label: "Remote Ahead", color: "#ffb86c" },
            "CONFLICT": { label: "Conflict!", color: "#ff5555" },
            "DRIFT": { label: "Drift Detected", color: "#ffb86c" },
            "OFFLINE": { label: "Offline", color: "#888" }
        };
        const info = statusMap[status] || { label: "Ready", color: "#888" };
        const syncStatusEl = document.getElementById("sync-status");
        if (syncStatusEl) {
            syncStatusEl.innerText = info.label;
            syncStatusEl.style.color = info.color;
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

    console.log("Main Bootstrapped.");
}

if (document.readyState === "complete") {
    bootstrap();
} else {
    window.addEventListener("load", bootstrap);
}
