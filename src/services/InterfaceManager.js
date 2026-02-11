/**
 * src/services/InterfaceManager.js
 * Interface and Data Structure Management for Zoho Deluge IDE
 * (Plain Script version)
 */

(function() {
    const InterfaceManager = {
        /**
         * Resolve an interface by name within a specific context
         */
        async resolveInterface(name, contextFileId) {
            // 1. Check if the file itself owns this interface
            let result = await window.ideDB.interfaces.where({ name, ownerId: contextFileId }).first();
            if (result) return result;

            // 2. Check System/Global scopes (Shared interfaces)
            result = await window.ideDB.interfaces.where('name').equals(name)
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
            await window.ideDB.interfaces.put(interfaceData);
            return interfaceData;
        },

        /**
         * Get all interfaces owned by a specific ID (File, Folder, or System)
         */
        async getInterfacesByOwner(ownerId) {
            return await window.ideDB.interfaces.where('ownerId').equals(ownerId).toArray();
        },

        /**
         * Get all shared interfaces owned by a file (used for adoption protocol)
         */
        async getSharedInterfacesByFile(fileId) {
            return await window.ideDB.interfaces.where('ownerId').equals(fileId)
                .and(i => i.sharedScope !== 'LOCAL')
                .toArray();
        },

        /**
         * Promote/Adopt interfaces to a new owner (e.g., from File to System)
         */
        async adoptInterfaces(interfaceIds, newOwnerId, newOwnerType) {
            const updates = interfaceIds.map(id => {
                return window.ideDB.interfaces.update(id, {
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
            await window.ideDB.interfaces.delete(id);
        }
    };

    window.InterfaceManager = InterfaceManager;
})();
