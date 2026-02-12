// src/ui/TabManager.js
import syncService from "../services/SyncService.js";
import store from "../core/store.js";
import fileManager from "../services/FileManager.js";

class TabManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        // Initial Sync handled by main.js calling this? or here?
        setInterval(() => this.syncAppTabs(), 5000);
        this.syncAppTabs();
    }

    bindEvents() {
        const syncBtn = document.getElementById("sync-tabs-btn");
        if (syncBtn) {
            syncBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                store.state.ignoredTabIds.clear();
                if (typeof chrome !== "undefined" && chrome.storage) {
                    chrome.storage.local.set({ "zide_ignored_tabs": [] });
                }
                this.syncAppTabs();
            });
        }
    }

    async syncAppTabs() {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ action: "GET_ALL_ZOHO_TABS" }, async (tabs) => {
                if (tabs && Array.isArray(tabs)) {
                    store.state.activeTabs = tabs;

                    // Check drift status for active tabs
                    for (const tab of tabs) {
                        if (store.state.ignoredTabIds.has(tab.tabId)) continue;
                        const key = this.getRenameKey(tab);
                        const mInfo = store.state.models[key];
                        if (mInfo && tab.active) {
                            chrome.runtime.sendMessage({ action: "GET_ZOHO_CODE", tabId: tab.tabId }, async (response) => {
                                if (response && response.code) {
                                    const status = await syncService.detectStatus(tab.functionId, response.code);
                                    mInfo.syncStatus = status;
                                    if (store.state.currentFile && this.getRenameKey(store.state.currentFile.data) === key) {
                                        window.dispatchEvent(new CustomEvent("update-drift-ui", { detail: { tabId: tab.tabId, status } }));
                                    }
                                }
                            });
                        }
                    }

                    this.renderOpenEditors();

                    if (tabs.length > 0) {
                        const activeTab = tabs.find(t => t.active) || tabs[0];
                        // Auto-switch logic could be here or main.js
                        if (activeTab.url !== store.state.zideProjectUrl) {
                            store.state.zideProjectUrl = activeTab.url;
                        }
                    }
                }
            });
        }
    }

    renderOpenEditors() {
        const list = document.getElementById("open-editors-list");
        if (!list) return;

        list.innerHTML = "";
        const visibleTabs = store.state.activeTabs.filter(tab => !store.state.ignoredTabIds.has(tab.tabId));

        if (visibleTabs.length === 0) {
            list.innerHTML = "<div class='log-entry' style='font-size:11px; opacity:0.6; padding: 10px;'>No active Zoho tabs.</div>";
            return;
        }

        visibleTabs.forEach((tab, index) => {
            const item = document.createElement("div");
            item.className = "explorer-item";
            const isCurrent = store.state.currentFile && (store.state.currentFile.tabId === tab.tabId);
            if (isCurrent) item.classList.add("active");

            const displayName = tab.title || "Untitled"; // Simplified display name logic for brevity

            item.innerHTML = `
                <span class="system-icon">${(tab.system || "Z")[0]}</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
            `;

            item.onclick = () => {
                // Select Tab
                window.dispatchEvent(new CustomEvent("tab-selected", { detail: { tab } }));
            };

            const closeBtn = document.createElement("span");
            closeBtn.className = "material-icons";
            closeBtn.innerHTML = "close";
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                store.state.ignoredTabIds.add(tab.tabId);
                this.renderOpenEditors();
            };
            item.appendChild(closeBtn);

            list.appendChild(item);
        });
    }

    getRenameKey(metadata) {
        if (!metadata) return "unknown";
        let id = (metadata.functionId && metadata.functionId !== "unknown") ? metadata.functionId : (metadata.url || "global");
        if (id.startsWith("http")) {
            try { const u = new URL(id); id = u.origin + u.pathname; } catch(e) {}
        }
        return `${metadata.orgId}:${metadata.system}:${id}`;
    }
}

export default new TabManager();
