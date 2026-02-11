/**
 * src/core/db.js
 * Database initialization and schema for Zoho Deluge IDE using Dexie.js
 * (Plain Script version to avoid module timing issues)
 */

(function() {
    const db = new Dexie('DelugeIDE_VFS');

    // Schema Version 1
    db.version(1).stores({
        files: 'id, name, url, updatedAt, projectId, hash',
        interfaces: 'id, name, ownerId, ownerType, sharedScope',
        history: '++id, fileId, timestamp, trigger',
        blacklist: 'id' // id will be functionId or url
    });

    window.ideDB = db;

    /**
     * Helper to generate SHA-256 hash of code
     */
    async function generateHash(text) {
        if (!text) return '';
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    window.generateHash = generateHash;

    /**
     * Lazy migration from chrome.storage.local to IndexedDB
     */
    async function migrateFromLegacy() {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        const fileCount = await db.files.count();
        if (fileCount > 0) return; // Already migrated or initialized

        console.log('[ZohoIDE] Starting lazy migration from legacy storage...');

        return new Promise((resolve) => {
            chrome.storage.local.get(['saved_files', 'project_names', 'project_mappings'], async (result) => {
                try {
                    // 1. Migrate Files
                    if (result.saved_files && Array.isArray(result.saved_files)) {
                        const filesToInsert = [];
                        for (const f of result.saved_files) {
                            const id = f.id || `legacy:${f.projectUrl || 'global'}:${f.title}:${Date.parse(f.timestamp)}`;
                            filesToInsert.push({
                                id: id,
                                name: f.title,
                                code: f.code,
                                url: f.projectUrl || '',
                                updatedAt: Date.parse(f.timestamp) || Date.now(),
                                hash: await generateHash(f.code)
                            });
                        }
                        await db.files.bulkAdd(filesToInsert);
                        console.log(`[ZohoIDE] Migrated ${filesToInsert.length} files.`);
                    }

                    // 2. Migrate Interface Mappings (if any)
                    if (result.project_mappings) {
                        const interfacesToInsert = [];
                        for (const [scope, mappings] of Object.entries(result.project_mappings)) {
                            for (const [name, structure] of Object.entries(mappings)) {
                                interfacesToInsert.push({
                                    id: crypto.randomUUID(),
                                    name: name,
                                    structure: structure,
                                    ownerId: scope, // URL or 'global'
                                    ownerType: scope === 'global' ? 'GLOBAL' : 'SYSTEM',
                                    sharedScope: 'SYSTEM'
                                });
                            }
                        }
                        if (interfacesToInsert.length > 0) {
                            await db.interfaces.bulkAdd(interfacesToInsert);
                            console.log(`[ZohoIDE] Migrated ${interfacesToInsert.length} interfaces.`);
                        }
                    }

                    console.log('[ZohoIDE] Migration complete.');
                    resolve();
                } catch (err) {
                    console.error('[ZohoIDE] Migration failed:', err);
                    resolve();
                }
            });
        });
    }
    window.migrateFromLegacy = migrateFromLegacy;

})();
