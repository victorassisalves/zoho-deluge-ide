/**
 * src/bridge/manager.js
 * Bridge Manager: Coordinator between the Event Bus and the Editor Bridge.
 * Implements the Singleton Pattern.
 */
import { connectionSentinel } from '../core/connection.js';
import { genericStrategy } from './strategies/generic.js';
import { interfaceManager } from './interface.js';
import { mainWorldInjector } from './injector.js';
import { eventBus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';
import { logger as Logger } from '../utils/logger.js';

class BridgeManager {
    constructor() {
        this.strategy = null;
    }

    init() {
        // 1. Determine strategy
        this.strategy = this._getStrategyForUrl();

        // 2. Start Sentinel
        connectionSentinel.start(this.strategy);

        // 3. Start Interface (The Controls - F2 / Shortcuts)
        interfaceManager.init();

        // 4. Inject Main World Bridge
        mainWorldInjector.inject();

        Logger.info('[BridgeManager] Initialized');

        // 4. Setup Listeners
        this._setupListeners();
    }

    _getStrategyForUrl() {
        // For V1, always return genericStrategy
        return genericStrategy;
    }

    _setupListeners() {
        // Run
        eventBus.on(EVENTS.EXECUTION.RUN, () => this.handleRun());

        // Pull
        eventBus.on(EVENTS.EDITOR.PULL, () => this.handlePull());

        // Push
        eventBus.on(EVENTS.EDITOR.PUSH, (payload) => this.handlePush(payload));
    }

    handleRun() {
        if (!this.strategy) return;

        const success = this.strategy.execute();

        if (success) {
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'success', message: 'Execution triggered' });
        } else {
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'error', message: 'Execution failed or not supported' });
        }
    }

    async handlePull() {
        if (!connectionSentinel.activeEditor) {
             Logger.warn('[BridgeManager] Cannot pull: No active editor');
             return;
        }

        try {
            const result = await this.strategy.pull(connectionSentinel.activeEditor);
            // Handle both Promise and direct string return (in case strategy is sync)
            const code = result; // await resolves it if it's a promise

            eventBus.emit(EVENTS.EDITOR.SET_VALUE, { code });
            Logger.info('[BridgeManager] Pulled code from editor');
        } catch (error) {
            Logger.error('[BridgeManager] Pull error:', error);
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'error', message: 'Failed to pull code' });
        }
    }

    handlePush(payload) {
        if (!payload || typeof payload.code !== 'string') {
            Logger.error('[BridgeManager] Invalid push payload:', payload);
            return;
        }

        if (!connectionSentinel.activeEditor) {
            Logger.warn('[BridgeManager] Cannot push: No active editor');
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'warning', message: 'No editor connected' });
            return;
        }

        try {
            this.strategy.push(connectionSentinel.activeEditor, payload.code);
            Logger.info('[BridgeManager] Pushed code to editor');
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'success', message: 'Code updated in Zoho' });
        } catch (error) {
            Logger.error('[BridgeManager] Push error:', error);
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'error', message: 'Failed to push code' });
        }
    }
}

export const bridgeManager = new BridgeManager();
