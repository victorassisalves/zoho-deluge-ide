import { DB as db } from '../core/db.js';

class InterfaceManager {
    async getInterfacesForFile(fileId) {
        if (!fileId) return [];

        const file = await db.get('Files', fileId);
        if (!file) return [];

        // Scope resolution: Global > System > Folder > File
        // Fetch all interfaces
        const interfaces = await db.getAll('Interfaces');

        return interfaces.filter(i => {
            if (i.ownerType === 'GLOBAL') return true;
            if (i.ownerType === 'SYSTEM' && i.ownerId === file.orgId) return true; // Assuming orgId as System context for now
            if (i.ownerType === 'FOLDER' && i.ownerId === file.folder) return true;
            if (i.ownerType === 'FILE' && i.ownerId === file.id) return true;
            return false;
        });
    }

    async saveInterface(interfaceData) {
        if (!interfaceData.id) interfaceData.id = crypto.randomUUID();
        await db.put('Interfaces', interfaceData);
    }

    async deleteInterface(id) {
        await db.delete('Interfaces', id);
    }
}

const interfaceManager = new InterfaceManager();
export default interfaceManager;
