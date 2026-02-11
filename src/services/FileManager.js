/**
 * src/services/FileManager.js
 * VFS and File Operations for Zoho Deluge IDE
 */
import { db, generateHash } from '../core/db.js';

const FileManager = {
    /**
     * Get a file by its stable identity (OrgID:System:FunctionID)
     */
    async getFile(id) {
        return await db.files.get(id);
    },

    /**
     * Get all file metadata (no code) for the explorer
     */
    async getAllFilesMetadata() {
        return await db.files.toCollection().primaryKeys().then(keys => {
            return db.files.bulkGet(keys).then(files => {
                return files.map(f => ({
                    id: f.id,
                    name: f.name,
                    url: f.url,
                    updatedAt: f.updatedAt,
                    projectId: f.projectId
                }));
            });
        });
    },

    /**
     * Save or update a file in the VFS
     */
    async saveFile(file, trigger = 'MANUAL_SAVE') {
        if (!file.id) throw new Error('File ID is required');

        file.updatedAt = Date.now();
        file.hash = await generateHash(file.code);

        await db.files.put(file);

        // Create history snapshot
        await this.createHistorySnapshot(file.id, file.code, trigger);

        return file;
    },

    /**
     * Create a snapshot of the code in history
     */
    async createHistorySnapshot(fileId, content, trigger) {
        // Limit history to last 10 snapshots per file
        const history = await db.history.where('fileId').equals(fileId).sortBy('timestamp');
        if (history.length >= 10) {
            // Remove oldest
            await db.history.delete(history[0].id);
        }

        await db.history.add({
            fileId,
            content,
            timestamp: Date.now(),
            trigger: trigger
        });
    },

    /**
     * Get history for a specific file
     */
    async getFileHistory(fileId) {
        return await db.history.where('fileId').equals(fileId).reverse().sortBy('timestamp');
    },

    /**
     * Delete a file and its history
     */
    async deleteFile(fileId) {
        await db.files.delete(fileId);
        await db.history.where('fileId').equals(fileId).delete();
    },

    /**
     * Generate hash for external content comparison
     */
    async calculateHash(code) {
        return await generateHash(code);
    }
};

export default FileManager;
