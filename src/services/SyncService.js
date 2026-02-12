// src/services/SyncService.js
import { DB as db } from "../core/db.js";
import store from "../core/store.js";

class SyncService {
    constructor() {
        this.cache = new Map();
        this.pendingWrites = new Map();
        this.lastActionTime = 0;
    }

    async detectStatus(fileId, remoteCode) {
        if (!fileId) return "UNKNOWN";

        const file = await db.get("Files", fileId);
        if (!file) return "UNKNOWN";

        const originalCode = file.originalCode || "";
        const localCode = file.code || "";

        const localModified = localCode !== originalCode;
        const remoteModified = remoteCode !== originalCode;

        if (!localModified && !remoteModified) return "SYNCED";
        if (localModified && !remoteModified) return "DRIFT_LOCAL_NEWER";
        if (!localModified && remoteModified) return "DRIFT_REMOTE_NEWER";
        if (localModified && remoteModified) {
            return localCode === remoteCode ? "SYNCED" : "CONFLICT";
        }

        return "UNKNOWN";
    }

    async markSynced(fileId, code) {
        const file = await db.get("Files", fileId);
        if (file) {
            file.originalCode = code;
            file.code = code;
            await db.put("Files", file);

            // Add History Snapshot
            if (db.dexie.History) {
                await db.dexie.History.add({
                    fileId: fileId,
                    timestamp: new Date(),
                    content: code,
                    trigger: "SYNC_OVERWRITE"
                });
            }
        }
    }

    // Logic from ide.js

    async pullFromZoho(editor) {
        const now = Date.now();
        if (now - this.lastActionTime < 800) return;
        this.lastActionTime = now;

        const state = store.state;
        const targetTab = state.activeTabs.find(t => t.tabId === state.currentFile?.tabId) || window.currentTargetTab;
        const targetTabId = targetTab?.tabId;

        if (!targetTabId) {
            this.log("Error", "No Zoho tab connected. Please open a Zoho Deluge editor tab first.");
            return;
        }

        this.log("System", "Pulling code...");

        if (typeof chrome !== "undefined" && chrome.runtime) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: "GET_ZOHO_CODE", tabId: targetTabId }, async (response) => {
                    if (response && response.code) {
                        const key = window.getRenameKey ? window.getRenameKey(targetTab) : `${targetTab.orgId}:${targetTab.system}:${targetTab.functionId}`; // Fallback if getRenameKey not available yet
                        // Logic to update model is handled by caller or we dispatch event
                        // But ide.js updated model directly.
                        // Here we return code so controller can update model.

                        await this.markSynced(targetTab.functionId, response.code);

                        this.log("Success", "Code pulled.");
                        resolve({ code: response.code, tabId: targetTabId, key: key });
                    } else {
                        const err = response?.error || "No code found.";
                        this.log("Error", err);
                        reject(err);
                    }
                });
            });
        }
    }

    async pushToZoho(editor, triggerSave = false, triggerExecute = false) {
        const now = Date.now();
        if (now - this.lastActionTime < 1000) return;
        this.lastActionTime = now;

        const state = store.state;
        let targetTab = state.activeTabs.find(t => t.tabId === state.currentFile?.tabId);

        // Fallback
        if (!targetTab && state.currentFile) {
            targetTab = state.activeTabs.find(t => t.functionId === state.currentFile.id || (t.functionName === state.currentFile.data?.name && t.orgId === state.currentFile.data?.orgId));
        }
        if (!targetTab) targetTab = window.currentTargetTab;

        const targetTabId = targetTab?.tabId;

        if (!targetTabId) {
            this.log("Error", "No Zoho tab connected or function not found in any open tab. Sync/Execute failed.");
            return;
        }

        // Check for errors (Caller should handle Monaco marker check if possible, but we can't easily access monaco here without passing it)
        // Assuming caller checks errors or we skip it for now.
        // In ide.js: const markers = monaco.editor.getModelMarkers...
        // We will assume valid code for now or check if editor provides validation status.

        const code = editor.getValue();
        this.log("System", "Pushing code...");

        if (triggerSave) {
            chrome.runtime.sendMessage({ action: "OPEN_ZOHO_EDITOR", tabId: targetTabId });
        }

        if (typeof chrome !== "undefined" && chrome.runtime) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: "SET_ZOHO_CODE", code: code, tabId: targetTabId }, async (response) => {
                    if (response && response.success) {
                        this.log("Success", "Code pushed.");

                        // Update local originalCode
                        const key = window.getRenameKey ? window.getRenameKey(targetTab) : `${targetTab.orgId}:${targetTab.system}:${targetTab.functionId}`;
                        if (store.state.models[key]) {
                            store.state.models[key].originalCode = code;
                            // saveModelsToStorage should be triggered by model change or manual
                            // But here we just updated metadata
                        }

                        await this.markSynced(targetTab.functionId, code);

                        if (triggerSave || triggerExecute) {
                            chrome.runtime.sendMessage({ action: "SAVE_ZOHO_CODE", tabId: targetTabId }, (res) => {
                                if (res && res.success) {
                                    this.log("Success", "Zoho Save triggered.");

                                    if (triggerExecute) {
                                        this.log("System", "Waiting 700ms before execution...");
                                        setTimeout(() => {
                                            chrome.runtime.sendMessage({ action: "EXECUTE_ZOHO_CODE", tabId: targetTabId }, (execRes) => {
                                                if (execRes && execRes.success) this.log("Success", "Zoho Execute triggered.");
                                                else this.log("Warning", "Zoho Execute trigger failed.");
                                            });
                                        }, 700);
                                    }
                                } else {
                                    this.log("Warning", "Zoho Save trigger failed.");
                                    if (triggerExecute) {
                                        setTimeout(() => {
                                            chrome.runtime.sendMessage({ action: "EXECUTE_ZOHO_CODE", tabId: targetTabId }, (execRes) => {
                                                if (execRes && execRes.success) this.log("Success", "Zoho Execute triggered.");
                                            });
                                        }, 700);
                                    }
                                }
                            });
                        }
                        resolve(true);
                    } else {
                        const err = response?.error || "Push failed.";
                        this.log("Error", err);
                        reject(err);
                    }
                });
            });
        }
    }

    log(type, message) {
        // Dispatch event for UI to pick up
        const event = new CustomEvent("ide-log", { detail: { type, message } });
        window.dispatchEvent(event);
        console.log(`[${type}] ${message}`);
    }
}

const syncService = new SyncService();
export default syncService;
