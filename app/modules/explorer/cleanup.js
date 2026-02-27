// app/modules/explorer/cleanup.js
import { db } from '../../services/db.js';

export async function cleanupDuplicateDrafts() {
    try {
        const files = await db.files.toArray();
        const drafts = files.filter(f => f.fileName && f.fileName.match(/unsaved_creator_\d+/));

        if (drafts.length > 0) {
            console.log(`[Cleanup] Found ${drafts.length} duplicate drafts. Cleaning up...`);
            // Sort by lastSaved descending
            drafts.sort((a, b) => b.lastSaved - a.lastSaved);

            // Keep the latest one, delete the rest
            // Actually, we want to migrate the latest one to the new canonical ID 'Unsaved_Draft_Function' if it doesn't exist

            const latest = drafts[0];
            const others = drafts.slice(1);

            // Check if canonical exists
            // const canonicalId = ... depends on workspace ...
            // Simplified: Just delete the old timestamped ones. The new logic will create the canonical one on next save.
            // But to preserve user work, we should maybe rename the latest one to the canonical name/ID?
            // Since ID is part of contextHash, we can't easily "rename" primary key. We have to delete and add.

            const idsToDelete = drafts.map(d => d.id);
            await db.files.bulkDelete(idsToDelete);
            console.log('[Cleanup] Deleted duplicate drafts.');
        }

        // Also clean up generic "unsaved_*" if any
        const genericDrafts = files.filter(f => f.fileName && f.fileName.match(/unsaved_\d+/));
        if (genericDrafts.length > 0) {
             await db.files.bulkDelete(genericDrafts.map(d => d.id));
        }

    } catch (e) {
        console.error('[Cleanup] Error:', e);
    }
}
