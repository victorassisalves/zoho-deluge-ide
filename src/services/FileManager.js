// src/services/FileManager.js
import { DB as db } from '../core/db.js';

class FileManager {
    async getFile(id) {
        return await db.get('Files', id);
    }

    async getAllFiles() {
        return await db.getAll('Files');
    }

    async saveFile(fileData) {
        // If fileData includes code, DB wrapper handles Buffer split
        await db.put('Files', fileData);

        // Add History Snapshot
        await db.dexie.History.add({
            fileId: fileData.id,
            timestamp: new Date(),
            content: fileData.code || "",
            trigger: 'MANUAL_SAVE'
        });
    }

    async deleteFile(id) {
        return await db.delete('Files', id);
    }
}

const fileManager = new FileManager();
export default fileManager;
