// src/core/store.js

class Store {
    constructor() {
        this.state = {
            activeTabs: [],
            ignoredTabIds: new Set(),
            savedFunctions: {}, // Tree structure
            history: [],
            currentFile: null, // { id, type: 'tab'|'saved', data: metadata }
            openEditors: [], // Files currently "open" in tabs/IDE
            renames: {}, // Manual renames: { key: newName }
            models: {}, // { key: { model, originalCode, syncStatus } }

            // Global variables from ide.js
            zideProjectUrl: null,
            zideProjectName: "Untitled Project",
            activeCloudFileId: null,

            // Research State
            currentResearchReport: "",
            researchPollingInterval: null,

            // UI State
            interfaceMappings: {},
            activeMappingName: null
        };

        // Make it global for legacy access/debugging if needed
        window.AppState = this.state;
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        this.state[key] = value;
    }
}

const store = new Store();
export default store;
