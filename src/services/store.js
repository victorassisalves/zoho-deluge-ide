/**
 * Centralized Store for Zoho Deluge IDE
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

        window.zideProjectUrl = this.state.zideProjectUrl;
        window.zideProjectName = this.state.zideProjectName;
        window.activeCloudFileId = this.state.activeCloudFileId;
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        if (this.state[key] === value) return;

        this.state[key] = value;

        if (key === 'zideProjectUrl') window.zideProjectUrl = value;
        if (key === 'zideProjectName') window.zideProjectName = value;
        if (key === 'activeCloudFileId') window.activeCloudFileId = value;
        if (key === 'editor') window.editor = value;
        if (key === 'interfaceMappings') window.interfaceMappings = value;

        this.notify(key, value);
    }

    update(patch) {
        Object.keys(patch).forEach(k => this.set(k, patch[k]));
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify(key, value) {
        this.listeners.forEach(cb => {
            try { cb(key, value); } catch(e) {}
        });
    }

    setEditor(editor) { this.set('editor', editor); }
    getEditor() { return this.get('editor'); }
}

const store = new Store();
window.Store = store;
export default store;
