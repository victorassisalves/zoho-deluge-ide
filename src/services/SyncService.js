// src/services/SyncService.js
import { DB as db } from '../core/db.js';

class SyncService {
    constructor() {
        this.cache = new Map();
        this.pendingWrites = new Map();
    }

    async detectStatus(fileId, remoteCode) {
        if (!fileId) return 'UNKNOWN';

        const file = await db.get('Files', fileId);
        if (!file) return 'UNKNOWN';

        const originalCode = file.originalCode || "";
        const localCode = file.code || "";

        const localModified = localCode !== originalCode;
        const remoteModified = remoteCode !== originalCode;

        if (!localModified && !remoteModified) return 'SYNCED';
        if (localModified && !remoteModified) return 'DRIFT_LOCAL_NEWER';
        if (!localModified && remoteModified) return 'DRIFT_REMOTE_NEWER';
        if (localModified && remoteModified) {
            return localCode === remoteCode ? 'SYNCED' : 'CONFLICT';
        }

        return 'UNKNOWN';
    }

    async markSynced(fileId, code) {
        const file = await db.get('Files', fileId);
        if (file) {
            file.originalCode = code;
            file.code = code;
            await db.put('Files', file);

            // Add History Snapshot
            await db.dexie.History.add({
                fileId: fileId,
                timestamp: new Date(),
                content: code,
                trigger: 'SYNC_OVERWRITE'
            });
        }
    }
}

const syncService = new SyncService();
export default syncService;
