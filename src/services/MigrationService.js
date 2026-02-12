import { DB } from '../core/db.js';

class MigrationService {
    async migrate() {
        if (typeof chrome === "undefined" || !chrome.storage) return;

        // Check if DB is empty
        const count = await DB.dexie.Files.count();
        if (count > 0) {
            console.log('[ZohoIDE] Dexie DB already populated. Skipping migration.');
            return;
        }

        const result = await new Promise(resolve => {
            chrome.storage.local.get([
                'saved_functions_tree',
                'project_mappings',
                'user_renames',
                'zide_models_data',
                'json_mappings',
                'theme',
                'font_size',
                'activation_behavior'
            ], resolve);
        });

        console.log('[ZohoIDE] Starting Migration to Dexie DB...');

        // 1. Migrate Config
        const configItems = [
            { key: 'theme', value: result.theme },
            { key: 'font_size', value: result.font_size },
            { key: 'activation_behavior', value: result.activation_behavior }
        ];
        for (const item of configItems) {
            if (item.value) await DB.dexie.Config.put(item);
        }

        // 2. Migrate Files (from saved_functions_tree)
        if (result.saved_functions_tree) {
            const tree = result.saved_functions_tree;
            const files = [];
            const buffers = [];

            for (const orgId in tree) {
                for (const system in tree[orgId]) {
                    for (const folder in tree[orgId][system]) {
                        for (const fileId in tree[orgId][system][folder]) {
                            const file = tree[orgId][system][folder][fileId];

                            // Try to get originalCode from models data if available
                            let originalCode = file.code;
                            const modelKey = `${orgId}:${system}:${fileId}`;
                            if (result.zide_models_data && result.zide_models_data[modelKey]) {
                                originalCode = result.zide_models_data[modelKey].originalCode || file.code;
                            }

                            files.push({
                                id: fileId,
                                orgId: orgId,
                                system: system,
                                folder: folder,
                                name: file.name,
                                timestamp: file.timestamp,
                                metadata: file.metadata,
                                isOnline: false // Default to offline for migrated files
                            });

                            buffers.push({
                                id: fileId,
                                content: file.code,
                                originalContent: originalCode
                            });
                        }
                    }
                }
            }

            if (files.length > 0) {
                await DB.dexie.Files.bulkPut(files);
                await DB.dexie.Buffers.bulkPut(buffers);
                console.log(`[ZohoIDE] Migrated ${files.length} files.`);
            }
        }

        // 3. Migrate Interfaces (from json_mappings)
        // json_mappings -> Owner: SYSTEM (Legacy had no file ownership)
        if (result.json_mappings) {
            const interfaces = [];
            for (const name in result.json_mappings) {
                interfaces.push({
                    id: `global:${name}`,
                    name: name,
                    structure: result.json_mappings[name],
                    ownerId: 'global',
                    ownerType: 'GLOBAL',
                    sharedScope: 'GLOBAL'
                });
            }
             if (interfaces.length > 0) {
                await DB.dexie.Interfaces.bulkPut(interfaces);
                console.log(`[ZohoIDE] Migrated ${interfaces.length} interfaces.`);
            }
        }

        // project_mappings are skipped as per spec.

        await DB.dexie.Config.put({ key: 'is_migrated', value: true });
        console.log('[ZohoIDE] Migration Complete.');
    }
}

const migrationService = new MigrationService();
export default migrationService;
