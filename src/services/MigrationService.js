import db from './db.js';

class MigrationService {
    async migrate() {
        if (typeof chrome === "undefined" || !chrome.storage) return;

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

        // Check if already migrated
        const isMigrated = await db.get('Config', 'is_migrated');
        if (isMigrated) return;

        console.log('[ZohoIDE] Starting Migration to IndexedDB...');

        // 1. Migrate Config
        const configItems = [
            { key: 'theme', value: result.theme },
            { key: 'font_size', value: result.font_size },
            { key: 'activation_behavior', value: result.activation_behavior }
        ];
        for (const item of configItems) {
            if (item.value) await db.put('Config', item);
        }

        // 2. Migrate Files (from saved_functions_tree)
        if (result.saved_functions_tree) {
            const tree = result.saved_functions_tree;
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

                            await db.put('Files', {
                                id: fileId,
                                orgId: orgId,
                                system: system,
                                folder: folder,
                                name: file.name,
                                code: file.code,
                                originalCode: originalCode,
                                timestamp: file.timestamp,
                                metadata: file.metadata
                            });
                        }
                    }
                }
            }
        }

        // 3. Migrate Interfaces (from project_mappings or json_mappings)
        // json_mappings was the old way, project_mappings is per-org
        if (result.project_mappings) {
            for (const orgId in result.project_mappings) {
                for (const name in result.project_mappings[orgId]) {
                    await db.put('Interfaces', {
                        id: `${orgId}:${name}`,
                        name: name,
                        structure: result.project_mappings[orgId][name],
                        ownerId: orgId,
                        ownerType: 'SYSTEM',
                        sharedScope: 'SYSTEM'
                    });
                }
            }
        }

        if (result.json_mappings) {
            for (const name in result.json_mappings) {
                await db.put('Interfaces', {
                    id: `global:${name}`,
                    name: name,
                    structure: result.json_mappings[name],
                    ownerId: 'global',
                    ownerType: 'GLOBAL',
                    sharedScope: 'GLOBAL'
                });
            }
        }

        await db.put('Config', { key: 'is_migrated', value: true });
        console.log('[ZohoIDE] Migration Complete.');
    }
}

const migrationService = new MigrationService();
export default migrationService;
