/**
 * Centralized Store for Zoho Deluge IDE
 */
import diagnostics from './diagnostics.js';

class Store {
    constructor() {
        this.state = {
            editor: null,
            zideProjectUrl: 'global',
            zideProjectName: "Untitled Project",
            isConnected: false,
            interfaceMappings: {}
        };
        this.listeners = [];

        // Initial report
        diagnostics.report('Store', 'initialized');
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        if (this.state[key] === value) return;
        this.state[key] = value;
        this.notify(key, value);
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
}

const store = new Store();
export default store;
