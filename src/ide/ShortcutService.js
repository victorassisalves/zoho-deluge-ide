import db from '../services/db.js';

class ShortcutService {
    constructor() {
        this.shortcuts = new Map(); // id -> { defaultKeys, callback, currentKeys }
        this.overrides = {};
    }

    async init() {
        await this.loadOverrides();
    }

    async loadOverrides() {
        try {
            const config = await db.get('Config', 'shortcut_overrides');
            this.overrides = config ? config.value : {};
        } catch (e) {
            console.error('[ShortcutService] Failed to load overrides:', e);
            this.overrides = {};
        }
    }

    async saveOverrides() {
        try {
            await db.put('Config', { key: 'shortcut_overrides', value: this.overrides });
        } catch (e) {
            console.error('[ShortcutService] Failed to save overrides:', e);
        }
    }

    register(id, defaultKeys, callback) {
        const currentKeys = this.overrides[id] || defaultKeys;
        this.shortcuts.set(id, { defaultKeys, callback, currentKeys });
        return currentKeys;
    }

    async updateShortcut(id, newKeys) {
        if (this.shortcuts.has(id)) {
            const shortcut = this.shortcuts.get(id);
            shortcut.currentKeys = newKeys;
            this.overrides[id] = newKeys;
            await this.saveOverrides();
            // Note: Caller might need to re-register with Monaco
        }
    }

    getShortcutKeys(id) {
        const shortcut = this.shortcuts.get(id);
        return shortcut ? shortcut.currentKeys : null;
    }

    execute(id) {
        const shortcut = this.shortcuts.get(id);
        if (shortcut && shortcut.callback) {
            shortcut.callback();
            return true;
        }
        return false;
    }
}

const shortcutService = new ShortcutService();
export default shortcutService;
