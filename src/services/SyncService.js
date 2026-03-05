import fileManager from './FileManager.js';
import db from './db.js';

class SyncService {
    async detectStatus(fileId, domContent) {
        const file = await fileManager.getFile(fileId);
        if (!file) return 'UNKNOWN';

        const domHash = await fileManager.calculateHash(domContent);

        // Ensure VFS hash is up to date in memory
        const vfsHash = await fileManager.calculateHash(file.code);

        // lastSyncHash represents the state when IDE and Zoho were last known to be identical
        const lastSyncHash = file.lastSyncHash;

        if (domHash === vfsHash) {
            // Even if they match, if we didn't have a lastSyncHash, we should probably set it
            if (!lastSyncHash) {
                file.lastSyncHash = domHash;
                await db.put('Files', file);
            }
            return 'SYNCED';
        }

        if (!lastSyncHash) {
            // No record of previous sync, so it's just drift
            return 'DRIFT';
        }

        const hasLocalChanges = vfsHash !== lastSyncHash;
        const hasRemoteChanges = domHash !== lastSyncHash;

        if (hasLocalChanges && hasRemoteChanges) {
            return 'CONFLICT';
        }

        if (hasRemoteChanges) {
            return 'DRIFT_REMOTE_NEWER';
        }

        return 'DRIFT_LOCAL_NEWER';
    }

    async markSynced(fileId, content) {
        const file = await fileManager.getFile(fileId);
        if (!file) return;

        const hash = await fileManager.calculateHash(content);
        file.lastSyncHash = hash;
        file.code = content; // Sync local to this content
        file.vfsHash = hash;
        await db.put('Files', file);
    }
}

const syncService = new SyncService();
export default syncService;
