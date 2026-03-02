import Dexie from '../../assets/vendor/dexie.js';

export const db = new Dexie('ZohoIDE_DB');

db.version(1).stores({
    workspaces: 'id, orgId, service, name, lastAccessed, isArchived',
    files: 'id, workspaceId, fileName, code, variables, lastSaved, isDirty'
});

// Version 2: Multi-Tab Support Schema Update
db.version(2).stores({
    workspace_tabs: 'tabId, appType, lastActive',
    settings: 'key' // key: 'activeTabId', value: 1045
});

export default db;
