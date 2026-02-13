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
        let baseHash = file.lastSyncedHash;
        if (!baseHash && file.originalCode) {
            baseHash = await calculateHash(file.originalCode);
        }

        const localHash = await calculateHash(localCode);
        const remoteHash = await calculateHash(remoteCode);

        if (localHash === remoteHash) return "SYNCED";

        if (baseHash) {
            const localModified = localHash !== baseHash;
            const remoteModified = remoteHash !== baseHash;

            if (!localModified && !remoteModified) return "SYNCED";
            if (localModified && !remoteModified) return "DRIFT_LOCAL_NEWER";
            if (!localModified && remoteModified) return "DRIFT_REMOTE_NEWER";
            if (localModified && remoteModified) {
                return localHash === remoteHash ? "SYNCED" : "CONFLICT";
            }
        } else {
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
            file.lastSyncedHash = await calculateHash(code);
            await db.put("Files", file);

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

        // Check product context
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ action: "CHECK_CONNECTION", tabId: targetTabId }, (res) => {
                if (res && res.connected) {
                    this.log("System", `Pulling code from ${res.product || 'Zoho'}...`);
                }
            });
        } else {
             this.log("System", "Pulling code...");
        }

        if (typeof chrome !== "undefined" && chrome.runtime) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: "GET_ZOHO_CODE", tabId: targetTabId }, async (response) => {
                    if (response && response.code) {
                        const key = window.getRenameKey ? window.getRenameKey(targetTab) : `${targetTab.orgId}:${targetTab.system}:${targetTab.functionId}`;

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

        if (!targetTab && state.currentFile) {
            targetTab = state.activeTabs.find(t => t.functionId === state.currentFile.id || (t.functionName === state.currentFile.data?.name && t.orgId === state.currentFile.data?.orgId));
        }
        if (!targetTab) targetTab = window.currentTargetTab;

        const targetTabId = targetTab?.tabId;

        if (!targetTabId) {
            this.log("Error", "No Zoho tab connected or function not found in any open tab. Sync/Execute failed.");
            return;
        }

        // Check product context
        if (typeof chrome !== "undefined" && chrome.runtime) {
             chrome.runtime.sendMessage({ action: "CHECK_CONNECTION", tabId: targetTabId }, (res) => {
                 if (res && res.connected) {
                     let action = triggerExecute ? "Executing in" : (triggerSave ? "Saving to" : "Pushing to");
                     this.log("System", `${action} ${res.product || 'Zoho'}...`);
                 }
             });
        } else {
            this.log("System", "Pushing code...");
        }

        const key = window.getRenameKey ? window.getRenameKey(targetTab) : `${targetTab.orgId}:${targetTab.system}:${targetTab.functionId}`;
        const currentStatus = store.state.models[key]?.syncStatus;

        if (currentStatus === 'CONFLICT' || currentStatus === 'DRIFT_REMOTE_NEWER') {
            const confirmMsg = currentStatus === 'CONFLICT'
                ? "⚠️ CONFLICT DETECTED\n\nZoho has changes that you do not have.\nPushing will OVERWRITE them forever.\n\nAre you sure you want to force push?"
                : "⚠️ REMOTE IS NEWER\n\nZoho has a newer version.\nPushing will overwrite it.\n\nAre you sure?";

            if (!confirm(confirmMsg)) {
                this.log("Warning", "Push cancelled by user (Conflict Guard).");
                return;
            }
        }

        const code = editor.getValue();

        if (triggerSave) {
            chrome.runtime.sendMessage({ action: "OPEN_ZOHO_EDITOR", tabId: targetTabId });
        }

        if (typeof chrome !== "undefined" && chrome.runtime) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: "SET_ZOHO_CODE", code: code, tabId: targetTabId }, async (response) => {
                    if (response && response.success) {
                        this.log("Success", "Code pushed.");

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
        const event = new CustomEvent("ide-log", { detail: { type, message } });
        window.dispatchEvent(event);
        console.log(`[${type}] ${message}`);
    }
}

const syncService = new SyncService();
export default syncService;
