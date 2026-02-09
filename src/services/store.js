/**
 * Centralized Store for Zoho Deluge IDE
 * Manages application state and provides a subscription mechanism for updates.
 */

class Store {
    constructor() {
        this.state = {
            editor: null,
            zideProjectUrl: null,
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
    }

    // Getters
    get(key) {
        return this.state[key];
    }

    // Setters with notification
    set(key, value) {
        if (this.state[key] === value) return;

        const oldValue = this.state[key];
        this.state[key] = value;

        this.notify(key, value, oldValue);
    }

    // Batch update
    update(patch) {
        Object.keys(patch).forEach(key => {
            this.set(key, patch[key]);
        });
    }

    // Subscriptions
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify(key, value, oldValue) {
        this.listeners.forEach(callback => {
            callback(key, value, oldValue);
        });
    }

    // Specific helpers for common actions
    setEditor(editor) { this.set('editor', editor); }
    getEditor() { return this.get('editor'); }

    setProjectUrl(url) { this.set('zideProjectUrl', url); }
    getProjectUrl() { return this.get('zideProjectUrl'); }

    setProjectName(name) { this.set('zideProjectName', name); }
    getProjectName() { return this.get('zideProjectName'); }
}

const store = new Store();
export default store;
