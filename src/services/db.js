const DB_NAME = 'DelugeIDE';
const DB_VERSION = 1;

class DB {
    constructor() {
        this.db = null;
    }

    async open() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Files table
                if (!db.objectStoreNames.contains('Files')) {
                    const fileStore = db.createObjectStore('Files', { keyPath: 'id' });
                    fileStore.createIndex('orgId', 'orgId', { unique: false });
                    fileStore.createIndex('system', 'system', { unique: false });
                    fileStore.createIndex('folder', 'folder', { unique: false });
                }

                // Interfaces table
                if (!db.objectStoreNames.contains('Interfaces')) {
                    const interfaceStore = db.createObjectStore('Interfaces', { keyPath: 'id' });
                    interfaceStore.createIndex('name', 'name', { unique: false });
                    interfaceStore.createIndex('ownerId', 'ownerId', { unique: false });
                }

                // History table
                if (!db.objectStoreNames.contains('History')) {
                    const historyStore = db.createObjectStore('History', { keyPath: 'id', autoIncrement: true });
                    historyStore.createIndex('fileId', 'fileId', { unique: false });
                }

                // Config table
                if (!db.objectStoreNames.contains('Config')) {
                    db.createObjectStore('Config', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject('IndexedDB error: ' + event.target.errorCode);
            };
        });
    }

    async getStore(storeName, mode = 'readonly') {
        const db = await this.open();
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new DB();
export default db;
