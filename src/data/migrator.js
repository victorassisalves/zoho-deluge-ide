import { db } from './db.js';
import { Logger } from '../core/index.js';

export async function migrateLocalStorage() {
    if (localStorage.getItem('ide_migration_v1')) {
        return;
    }

    Logger.info('Starting legacy snippet migration...');
    const items = [];

    // Scan for 'my_snippets' array format (as used in my_snippets.js)
    try {
        const rawData = localStorage.getItem('my_snippets');
        if (rawData) {
            const legacySnippets = JSON.parse(rawData);
            if (Array.isArray(legacySnippets)) {
                legacySnippets.forEach(s => {
                    items.push({
                        title: s.name,
                        trigger: s.trigger,
                        folder: s.category || 'General',
                        code: s.code,
                        description: s.comments,
                        tags: [], // Could map trigger to tag, but trigger is a field now
                        createdAt: Date.now(), // No creation time in legacy
                        updatedAt: Date.now()
                    });
                });
            }
        }
    } catch (e) {
        Logger.error('Failed to parse my_snippets from localStorage', e);
    }

    if (items.length > 0) {
        try {
            await db.snippets.bulkAdd(items);
            Logger.info(`Migrated ${items.length} items to IndexedDB`);
        } catch (e) {
            Logger.error('Failed to bulk add migrated snippets', e);
        }
    } else {
        Logger.info('No legacy snippets found to migrate.');
    }

    localStorage.setItem('ide_migration_v1', 'true');
}
