// src/core/db.js

// We assume Dexie is loaded globally by loader-init.js
const Dexie = window.Dexie;

if (!Dexie) {
    console.error("[ZohoIDE] Dexie not found in window scope. Check loader-init.js order.");
}

const dexieDB = new Dexie('DelugeIDE_DB');
dexieDB.version(1).stores({
    Files: 'id, orgId, system, folder, isOnline, tabId',
    Buffers: 'id',
    Interfaces: 'id, ownerId, ownerType, sharedScope',
    History: '++id, fileId, timestamp',
    Config: 'key' // Added for compatibility with MigrationService
});

// Legacy Wrapper for Compatibility
export const DB = {
    // New Raw Access
    dexie: dexieDB,

    // Legacy API Implementation
    async get(table, key) {
        if (table === 'Files') {
            const file = await dexieDB.Files.get(key);
            if (!file) return null;
            const buffer = await dexieDB.Buffers.get(key);
            if (buffer) {
                file.code = buffer.content;
                file.originalCode = buffer.originalContent;
            }
            return file;
        }
        // Handle other tables directly
        const store = getStore(table);
        if (store) return await store.get(key);
        return null;
    },

    async put(table, data) {
        if (table === 'Files') {
             // Split data into File + Buffer
             if (data.code !== undefined || data.originalCode !== undefined) {
                 await dexieDB.Buffers.put({
                     id: data.id,
                     content: data.code,
                     originalContent: data.originalCode
                 });
             }

             // Create a copy of data without code for Files table
             const fileData = { ...data };
             delete fileData.code;
             delete fileData.originalCode;

             return await dexieDB.Files.put(fileData);
        }

        const store = getStore(table);
        if (store) return await store.put(data);
    },

    async getAll(table) {
        if (table === 'Files') {
            const files = await dexieDB.Files.toArray();
            // We need to join with Buffers to maintain full compatibility
            // This might be slow for many files, but necessary for legacy logic
            // Optimization: Only fetch code when absolutely necessary if possible,
            // but legacy code expects .code to be present.
            const buffers = await dexieDB.Buffers.toArray();
            const bufferMap = new Map(buffers.map(b => [b.id, b]));

            return files.map(file => {
                const buffer = bufferMap.get(file.id);
                if (buffer) {
                    file.code = buffer.content;
                    file.originalCode = buffer.originalContent;
                }
                return file;
            });
        }

        const store = getStore(table);
        if (store) return await store.toArray();
        return [];
    },

    async delete(table, key) {
        if (table === 'Files') {
            await dexieDB.Buffers.delete(key);
            return await dexieDB.Files.delete(key);
        }
        const store = getStore(table);
        if (store) return await store.delete(key);
    }
};

function getStore(tableName) {
    if (tableName === 'Interfaces') return dexieDB.Interfaces;
    if (tableName === 'History') return dexieDB.History;
    if (tableName === 'Config') return dexieDB.Config;
    return null;
}

export default dexieDB;
