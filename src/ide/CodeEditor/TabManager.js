class TabManager {
    constructor() {
        this.activeTabs = [];
        this.ignoredTabIds = new Set();
        this.currentFile = null;
        this.openEditors = [];
        this.renames = {};
        this.savedFunctions = {};
        this.history = [];
    }

    async init() {
        // Load renames from storage
        if (typeof chrome !== "undefined" && chrome.storage) {
            const res = await chrome.storage.local.get(['user_renames', 'zide_ignored_tabs']);
            if (res.user_renames) this.renames = res.user_renames;
            if (res.zide_ignored_tabs) this.ignoredTabIds = new Set(res.zide_ignored_tabs);
        }
    }

    setCurrentFile(file) {
        this.currentFile = file;
        if (window.renderOpenEditors) window.renderOpenEditors();
        if (window.renderExplorer) window.renderExplorer();
    }

    addTab(tab) {
        if (!this.activeTabs.find(t => t.tabId === tab.tabId)) {
            this.activeTabs.push(tab);
        }
    }

    removeTab(tabId) {
        this.activeTabs = this.activeTabs.filter(t => t.tabId !== tabId);
    }

    ignoreTab(tabId) {
        this.ignoredTabIds.add(tabId);
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ 'zide_ignored_tabs': Array.from(this.ignoredTabIds) });
        }
    }
}

const tabManager = new TabManager();
export default tabManager;
