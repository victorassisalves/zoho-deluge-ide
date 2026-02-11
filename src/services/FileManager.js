/**
 * src/services/FileManager.js
 * VFS and File Operations for Zoho Deluge IDE
 * (Plain Script version)
 */

(function() {
    const FileManager = {
        /**
         * Get a file by its stable identity (OrgID:System:FunctionID)
         */
        async getFile(id) {
            return await window.ideDB.files.get(id);
        },

        /**
         * Get all file metadata (no code) for the explorer
         */
        async getAllFilesMetadata() {
            const keys = await window.ideDB.files.toCollection().primaryKeys();
            const files = await window.ideDB.files.bulkGet(keys);
            return files.map(f => ({
                id: f.id,
                name: f.name,
                url: f.url,
                updatedAt: f.updatedAt,
                projectId: f.projectId
            }));
        },

        /**
         * Save or update a file in the VFS
         */
        async saveFile(file, trigger = 'MANUAL_SAVE') {
            if (!file.id) throw new Error('File ID is required');

            file.updatedAt = Date.now();
            file.hash = await window.generateHash(file.code);

            await window.ideDB.files.put(file);

            // Create history snapshot
            await this.createHistorySnapshot(file.id, file.code, trigger);

            return file;
        },

        /**
         * Create a snapshot of the code in history
         */
        async createHistorySnapshot(fileId, content, trigger) {
            // Limit history to last 10 snapshots per file
            const history = await window.ideDB.history.where('fileId').equals(fileId).sortBy('timestamp');
            if (history.length >= 10) {
                // Remove oldest
                await window.ideDB.history.delete(history[0].id);
            }

            await window.ideDB.history.add({
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
            return await window.ideDB.history.where('fileId').equals(fileId).reverse().sortBy('timestamp');
        },

        /**
         * Delete a file and its history
         */
        async deleteFile(fileId) {
            await window.ideDB.files.delete(fileId);
            await window.ideDB.history.where('fileId').equals(fileId).delete();
        },

        /**
         * Generate hash for external content comparison
         */
        async calculateHash(code) {
            return await window.generateHash(code);
        }
    };

    window.FileManager = FileManager;
})();
