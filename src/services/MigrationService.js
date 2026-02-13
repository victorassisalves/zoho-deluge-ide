import { DB as db } from "../core/db.js";
import store from "../core/store.js";

// Utility for hashing (moved here or can be in a utils file, but putting it here for now as requested)
async function calculateHash(content) {
    if (!content) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class MigrationService {
    async runPhase5Migration() {
        console.log('[Migration] Starting Phase 5: Hash Backfill...');
        try {
            const files = await db.getAll('Files');
            let updatedCount = 0;

            for (const file of files) {
                // If we have originalCode (legacy) but no lastSyncedHash (new system)
                // We assume originalCode was the last known "Clean" state from Zoho
                if (file.originalCode && !file.lastSyncedHash) {
                    const hash = await calculateHash(file.originalCode);
                    file.lastSyncedHash = hash;

                    // Ensure local hash is also set if code exists
                    if (!file.localHash && file.code) {
                        file.localHash = await calculateHash(file.code);
                    }

                    // Put back into DB (DB wrapper handles split updates if needed)
                    // Note: db.put splits 'code' into Buffers table.
                    // We need to be careful not to overwrite 'code' if it's already in Buffers.
                    // The db.put implementation in db.js handles this by checking if code/originalCode are present.
                    // Here we are modifying the file object directly.

                    await db.put('Files', file);
                    updatedCount++;
                }
            }
            if (updatedCount > 0) {
                console.log(`[Migration] Backfilled hashes for ${updatedCount} files.`);
            } else {
                console.log('[Migration] No files needed backfilling.');
            }
        } catch (error) {
            console.error('[Migration] Failed:', error);
        }
    }
}

export const migrationService = new MigrationService();
export { calculateHash };
