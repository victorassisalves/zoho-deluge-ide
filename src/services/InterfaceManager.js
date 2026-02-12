import db from './db.js';
import fileManager from './FileManager.js';

class InterfaceManager {
    async getInterface(id) {
        return await db.get('Interfaces', id);
    }

    async saveInterface(interfaceData) {
        if (!interfaceData.id) {
            interfaceData.id = `${interfaceData.ownerId}:${interfaceData.name}`;
        }
        return await db.put('Interfaces', interfaceData);
    }

    async deleteInterface(id) {
        return await db.delete('Interfaces', id);
    }

    async getAllInterfaces() {
        return await db.getAll('Interfaces');
    }

    async resolveInterface(name, contextFileId) {
        const interfaces = await this.getAllInterfaces();

        // 1. Check Global
        const globalInt = interfaces.find(i => i.name === name && i.ownerType === 'GLOBAL');

        if (!contextFileId) return globalInt;

        const file = await fileManager.getFile(contextFileId);
        if (!file) return globalInt;

        // 2. Check File
        const fileInt = interfaces.find(i => i.name === name && i.ownerId === contextFileId);
        if (fileInt) return fileInt;

        // 3. Check Folder
        const folderInt = interfaces.find(i => i.name === name && i.ownerId === file.folder && i.ownerType === 'FOLDER');
        if (folderInt) return folderInt;

        // 4. Check System (Org)
        const systemInt = interfaces.find(i => i.name === name && i.ownerId === file.orgId && i.ownerType === 'SYSTEM');
        if (systemInt) return systemInt;

        return globalInt;
    }

    async getInterfacesForFile(fileId) {
        const file = await fileManager.getFile(fileId);
        if (!file) return [];

        const interfaces = await this.getAllInterfaces();
        return interfaces.filter(i =>
            i.ownerId === file.id ||
            i.ownerId === file.folder ||
            i.ownerId === file.orgId ||
            i.ownerType === 'GLOBAL'
        );
    }
}

const interfaceManager = new InterfaceManager();
export default interfaceManager;
