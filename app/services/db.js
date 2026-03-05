import Dexie from '../../assets/vendor/dexie.js';

export const db = new Dexie('ZohoIDE_DB');

db.version(1).stores({
    workspaces: 'id, orgId, service, name, lastAccessed, isArchived',
    files: 'id, workspaceId, fileName, code, variables, lastSaved, isDirty'
});

db.version(2).stores({
    workspaces: 'id, orgId, service, name, lastAccessed, isArchived',
    files: 'id, workspaceId, fileName, code, variables, lastSaved, isDirty',
    workspace_tabs: 'id, fileId, order, viewState',
    workspace_state: 'id, activeTabId'
});

db.version(3).stores({
    workspaces: 'id, orgId, service, name, lastAccessed, isArchived',
    files: 'id, workspaceId, fileName, code, variables, lastSaved, isDirty',
    workspace_tabs: 'id, fileId, order, chromeTabId',
    settings: 'key'
}).upgrade(async tx => {
    // Migration logic: Safely port the old active tab
    if (tx.db.objectStoreNames.contains('workspace_state')) {
        const oldState = await tx.table('workspace_state').toArray();
        if (oldState.length > 0 && oldState[0].activeTabId) {
            const legacyTabId = oldState[0].activeTabId;
            await tx.table('settings').bulkPut([
                { key: 'activeTabId_full', value: legacyTabId },
                { key: 'activeTabId_panel', value: legacyTabId }
            ]);
        }
    }

    // Migration logic: Convert contextHash IDs to UUIDs
    const files = await tx.table('files').toArray();
    for (const file of files) {
        // contextHashes were formatted like service__org__functionName
        if (file.id && typeof file.id === 'string' && file.id.includes('__')) {
            const newId = crypto.randomUUID();
            const oldId = file.id;
            file.id = newId;
            await tx.table('files').add(file);
            await tx.table('files').delete(oldId);

            // update any existing tabs that might be referencing the old contextHash
            await tx.table('workspace_tabs')
                .where('fileId')
                .equals(oldId)
                .modify({ fileId: newId });
        }
    }
});

// Helper for settings table
export const getSetting = async (key) => {
    const record = await db.settings.get(key);
    return record ? record.value : null;
};

export const setSetting = async (key, value) => {
    return await db.settings.put({ key, value });
};

export default db;
