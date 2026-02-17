/**
 * src/bridge/manager.js
 * Bridge Manager: Coordinator between the Event Bus and the Editor Bridge.
 * Implements the Singleton Pattern.
 */
import { connectionSentinel } from '../core/connection.js';
import { genericStrategy } from './strategies/generic.js';
import { eventBus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';
import { logger as Logger } from '../utils/logger.js';

class BridgeManager {
    constructor() {
        this.strategy = null;
    }

    init() {
        // 1. Determine strategy (for detection)
        this.strategy = this._getStrategyForUrl();

        // 2. Start Sentinel
        connectionSentinel.start(this.strategy);

        Logger.info('[BridgeManager] Initialized');

        // 3. Setup Listeners
        this._setupListeners();
        this._setupExternalListeners();
    }

    _getStrategyForUrl() {
        // For V1, always return genericStrategy for detection
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

    _setupExternalListeners() {
        if (typeof chrome === 'undefined' || !chrome.runtime) return;

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Forward Side Panel Injection to UI
            if (request.action === 'INJECT_SIDE_PANEL') {
                if (EVENTS.UI.TOGGLE) {
                    eventBus.emit(EVENTS.UI.TOGGLE, { show: true });
                } else {
                    // Fallback if event not yet defined
                    eventBus.emit('ui:toggle', { show: true });
                }
                sendResponse({ success: true });
            }
        });
    }

    /**
     * Communicates with the injected bridge.js in the Main World.
     */
    async sendToBridge(action, data = {}) {
        return new Promise((resolve) => {
            const eventId = Math.random().toString(36).substring(7);

            const handler = (e) => {
                if (e.detail && e.detail.eventId === eventId) {
                    document.removeEventListener('ZOHO_IDE_RESPONSE', handler);
                    resolve(e.detail.response);
                }
            };
            document.addEventListener('ZOHO_IDE_RESPONSE', handler);

            document.dispatchEvent(new CustomEvent('ZOHO_IDE_ACTION', {
                detail: { action, eventId, ...data }
            }));

            // Timeout fallback
            setTimeout(() => {
                document.removeEventListener('ZOHO_IDE_RESPONSE', handler);
                resolve({ error: 'Timeout waiting for bridge response' });
            }, 3000);
        });
    }

    async handleRun() {
        Logger.info('[BridgeManager] Triggering execution...');
        const response = await this.sendToBridge('EXECUTE_ZOHO_CODE');

        if (response && response.success) {
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'success', message: 'Execution triggered' });
        } else {
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'error', message: 'Execution failed or not supported' });
        }
    }

    async handlePull() {
        Logger.info('[BridgeManager] Pulling code...');
        const response = await this.sendToBridge('GET_ZOHO_CODE');

        if (response && response.code) {
            eventBus.emit(EVENTS.EDITOR.SET_VALUE, { code: response.code });
            Logger.info('[BridgeManager] Pulled code from editor');
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'success', message: 'Code pulled successfully' });
        } else {
            Logger.error('[BridgeManager] Pull error:', response?.error);
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'error', message: 'Failed to pull code' });
        }
    }

    async handlePush(payload) {
        if (!payload || typeof payload.code !== 'string') {
            Logger.error('[BridgeManager] Invalid push payload:', payload);
            return;
        }

        Logger.info('[BridgeManager] Pushing code...');
        const response = await this.sendToBridge('SET_ZOHO_CODE', { code: payload.code });

        if (response && response.success) {
            Logger.info('[BridgeManager] Pushed code to editor');
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'success', message: 'Code updated in Zoho' });

            // Automatically trigger save after push
            await this.sendToBridge('SAVE_ZOHO_CODE');
        } else {
            Logger.error('[BridgeManager] Push error:', response?.error);
            eventBus.emit(EVENTS.UI.NOTIFY, { type: 'error', message: 'Failed to push code' });
        }
    }
}

export const bridgeManager = new BridgeManager();
