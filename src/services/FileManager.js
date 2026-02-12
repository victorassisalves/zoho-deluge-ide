import db from './db.js';

class FileManager {
    constructor() {
        this.activeFileId = null;
    }

    async getFile(id) {
        return await db.get('Files', id);
    }

    async saveFile(fileData) {
        if (!fileData.id) throw new Error('File ID is required');
        fileData.timestamp = new Date().toISOString();

        // Calculate hash for drift detection
        fileData.vfsHash = await this.calculateHash(fileData.code);

        await db.put('Files', fileData);

        // Add to history
        await db.put('History', {
            fileId: fileData.id,
            timestamp: fileData.timestamp,
            content: fileData.code,
            trigger: 'MANUAL_SAVE'
        });

        return fileData;
    }

    async deleteFile(id) {
        // Safe delete check will be implemented in Phase 3
        return await db.delete('Files', id);
    }

    async getAllFiles() {
        return await db.getAll('Files');
    }

    async calculateHash(content) {
        if (!content) return '';
        const msgUint8 = new TextEncoder().encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async getFileByTab(tab) {
        // Try to find a file by functionId or normalized URL
        const files = await this.getAllFiles();
        const normalizedUrl = this.normalizeUrl(tab.url);

        return files.find(f =>
            f.id === tab.functionId ||
            (f.metadata && f.metadata.url && this.normalizeUrl(f.metadata.url) === normalizedUrl)
        );
    }

    normalizeUrl(url) {
        if (!url) return '';
        try {
            const u = new URL(url);
            return u.origin + u.pathname;
        } catch(e) {
            return url;
        }
    }
}

const fileManager = new FileManager();
export default fileManager;
