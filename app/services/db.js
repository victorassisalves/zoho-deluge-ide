import Dexie from '../../assets/vendor/dexie.js';

export const db = new Dexie('ZohoIDE_DB');

db.version(1).stores({
    workspaces: 'id, orgId, service, name, lastAccessed, isArchived',
    files: 'id, workspaceId, fileName, code, variables, lastSaved, isDirty'
});

export default db;
