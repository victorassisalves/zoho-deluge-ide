import { DB as db } from "../core/db.js";
import store from "../core/store.js";
import { calculateHash } from "./MigrationService.js";

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

        const localCode = file.code || "";
        // If we don't have a lastSyncedHash, we try to fall back to calculating it from originalCode
        // or just assume UNKNOWN/SYNCED based on direct string comparison if migration hasn't run.
        let baseHash = file.lastSyncedHash;
        if (!baseHash && file.originalCode) {
            baseHash = await calculateHash(file.originalCode);
        }

        const localHash = await calculateHash(localCode);
        const remoteHash = await calculateHash(remoteCode);

        // If hashes are identical, we are good.
        if (localHash === remoteHash) return "SYNCED";

        // If we have a base hash, we can do 3-way check
        if (baseHash) {
            const localModified = localHash !== baseHash;
            const remoteModified = remoteHash !== baseHash;

            if (!localModified && !remoteModified) return "SYNCED"; // Should be covered by first check, but for completeness
            if (localModified && !remoteModified) return "DRIFT_LOCAL_NEWER";
            if (!localModified && remoteModified) return "DRIFT_REMOTE_NEWER";
            if (localModified && remoteModified) {
                return localHash === remoteHash ? "SYNCED" : "CONFLICT";
            }
        } else {
            // Fallback for legacy / unmigrated files
             const originalCode = file.originalCode || "";
             const localModified = localCode !== originalCode;
             const remoteModified = remoteCode !== originalCode;

             if (!localModified && !remoteModified) return "SYNCED";
             if (localModified && !remoteModified) return "DRIFT_LOCAL_NEWER";
             if (!localModified && remoteModified) return "DRIFT_REMOTE_NEWER";
             if (localModified && remoteModified) {
                 return localCode === remoteCode ? "SYNCED" : "CONFLICT";
             }
        }

        return "UNKNOWN";
    }

    async markSynced(fileId, code) {
        const file = await db.get("Files", fileId);
        if (file) {
            file.originalCode = code;
            file.code = code;
            file.lastSyncedHash = await calculateHash(code); // Update Hash
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

        const key = window.getRenameKey ? window.getRenameKey(targetTab) : `${targetTab.orgId}:${targetTab.system}:${targetTab.functionId}`;
        const currentStatus = store.state.models[key]?.syncStatus;

        // --- PHASE 5: CONFLICT GUARD ---
        if (currentStatus === 'CONFLICT' || currentStatus === 'DRIFT_REMOTE_NEWER') {
            const confirmMsg = currentStatus === 'CONFLICT'
                ? "⚠️ CONFLICT DETECTED\n\nZoho has changes that you do not have.\nPushing will OVERWRITE them forever.\n\nAre you sure you want to force push?"
                : "⚠️ REMOTE IS NEWER\n\nZoho has a newer version.\nPushing will overwrite it.\n\nAre you sure?";

            if (!confirm(confirmMsg)) {
                this.log("Warning", "Push cancelled by user (Conflict Guard).");
                return; // Stop execution
            }
        }
        // -------------------------------

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

                        // Update local originalCode and Hash
                        if (store.state.models[key]) {
                            store.state.models[key].originalCode = code;
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
