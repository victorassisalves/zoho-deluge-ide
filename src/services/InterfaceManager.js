/**
 * src/services/InterfaceManager.js
 * Interface and Data Structure Management for Zoho Deluge IDE
 */
import { db } from '../core/db.js';

const InterfaceManager = {
    /**
     * Resolve an interface by name within a specific context
     */
    async resolveInterface(name, contextFileId) {
        // 1. Check if the file itself owns this interface
        let result = await db.interfaces.where({ name, ownerId: contextFileId }).first();
        if (result) return result;

        // 2. Check System/Global scopes (Shared interfaces)
        // We look for any interface with the same name that is not LOCAL
        // and ideally check for ownerId matching the system or 'global'
        result = await db.interfaces.where('name').equals(name)
            .and(i => i.sharedScope !== 'LOCAL')
            .first();

        return result;
    },

    /**
     * Save an interface definition
     */
    async saveInterface(interfaceData) {
        if (!interfaceData.id) {
            interfaceData.id = crypto.randomUUID();
        }
        await db.interfaces.put(interfaceData);
        return interfaceData;
    },

    /**
     * Get all interfaces owned by a specific ID (File, Folder, or System)
     */
    async getInterfacesByOwner(ownerId) {
        return await db.interfaces.where('ownerId').equals(ownerId).toArray();
    },

    /**
     * Get all shared interfaces owned by a file (used for adoption protocol)
     */
    async getSharedInterfacesByFile(fileId) {
        return await db.interfaces.where('ownerId').equals(fileId)
            .and(i => i.sharedScope !== 'LOCAL')
            .toArray();
    },

    /**
     * Promote/Adopt interfaces to a new owner (e.g., from File to System)
     */
    async adoptInterfaces(interfaceIds, newOwnerId, newOwnerType) {
        const updates = interfaceIds.map(id => {
            return db.interfaces.update(id, {
                ownerId: newOwnerId,
                ownerType: newOwnerType
            });
        });
        await Promise.all(updates);
    },

    /**
     * Delete an interface
     */
    async deleteInterface(id) {
        await db.interfaces.delete(id);
    }
};

export default InterfaceManager;
