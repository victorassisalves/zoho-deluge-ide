import Logger from './logger.js';
import bus from './bus.js';
import { EVENTS } from './events.js';
import sentinel from './connection.js';
import '../ui/execution_ui.js';
import '../ui/sync_ui.js';
import '../bridge/execution_bridge.js';
import '../bridge/sync_bridge.js';
import '../core/editor_manager.js';
import '../features/linter.js';

export async function init() {
    Logger.info('Initializing V1 Architecture...');

    try {
        // Future async initialization steps (e.g., IndexDB) will go here

        bus.emit(EVENTS.CORE.INIT);
        Logger.info('V1 Architecture Initialized.');

        if (sentinel.pollInterval) {
            Logger.info('Connection Sentinel started successfully.');
        } else {
            Logger.warn('Connection Sentinel did not start automatically.');
            sentinel.start();
        }

    } catch (error) {
        Logger.error('Failed to initialize V1 Architecture:', error);
        bus.emit(EVENTS.CORE.ERROR, error);
        throw error;
    }
}
