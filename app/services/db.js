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

export default db;
