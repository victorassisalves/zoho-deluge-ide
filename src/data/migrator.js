import { db } from './db.js';
// Now safe to use either, but let's stick to the one we just exported
import { Logger } from '../core/index.js';

const MIGRATION_KEY = 'zoho_ide_migrated_v1';

export const migrateLocalStorage = async () => {
    try {
        const hasMigrated = localStorage.getItem(MIGRATION_KEY);
        if (hasMigrated) return;

        Logger.info('Starting Data Migration...');

        // Existing logic preserved
        const items = [];
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
                            tags: [],
                            createdAt: Date.now(),
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

        localStorage.setItem(MIGRATION_KEY, 'true');
        Logger.info('Migration Complete.');
    } catch (err) {
        Logger.error('Migration Failed', err);
    }
};
