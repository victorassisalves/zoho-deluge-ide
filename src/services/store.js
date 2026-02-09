/**
 * Centralized Store for Zoho Deluge IDE
 * Manages application state and provides a subscription mechanism for updates.
 * Also maintains window globals for compatibility with legacy cloud modules.
 */

class Store {
    constructor() {
        this.state = {
            editor: null,
            zideProjectUrl: 'global',
            zideProjectName: "Untitled Project",
            activeCloudFileId: null,
            isConnected: false,
            interfaceMappings: {},
            currentResearchReport: "",
            currentTargetTab: null,
            syncStatus: 'Ready',
            theme: 'dracula',
            currentUser: null,
            currentOrg: null
        };
        this.listeners = [];

        // Expose to window for legacy compatibility
        window.zideProjectUrl = this.state.zideProjectUrl;
        window.zideProjectName = this.state.zideProjectName;
        window.activeCloudFileId = this.state.activeCloudFileId;
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        if (this.state[key] === value) return;

        const oldValue = this.state[key];
        this.state[key] = value;

        // Sync legacy window properties
        if (key === 'zideProjectUrl') window.zideProjectUrl = value;
        if (key === 'zideProjectName') window.zideProjectName = value;
        if (key === 'activeCloudFileId') window.activeCloudFileId = value;
        if (key === 'editor') window.editor = value;
        if (key === 'interfaceMappings') window.interfaceMappings = value;

        this.notify(key, value, oldValue);
    }

    update(patch) {
        Object.keys(patch).forEach(key => {
            this.set(key, patch[key]);
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify(key, value, oldValue) {
        this.listeners.forEach(callback => {
            try { callback(key, value, oldValue); } catch(e) {}
        });
    }

    setEditor(editor) { this.set('editor', editor); }
    getEditor() { return this.get('editor'); }
}

const store = new Store();
window.Store = store;
export default store;
