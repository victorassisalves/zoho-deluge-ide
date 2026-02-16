/**
 * src/bridge/server.js
 * Bridge Server: Runs in the Content Script (Zoho Page).
 * Listens for commands from the IDE (Extension/SidePanel) and executes them on the page.
 */
import { bridgeManager } from './manager.js';
import { connectionSentinel } from '../core/connection.js';
import { logger as Logger } from '../utils/logger.js';

export const bridgeServer = {
    init() {
        Logger.info('[BridgeServer] Initializing...');

        // 1. Listen for messages from Standalone IDE (chrome.tabs.sendMessage)
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Async handling
            this.handleRequest(request).then(response => {
                if (response) sendResponse(response);
            });
            return true; // Keep channel open
        });

        // 2. Listen for messages from Side Panel IDE (window.postMessage)
        window.addEventListener('message', (event) => {
            // Security check: ensure it's from our extension logic
            // The IDE sends { _zide_msg_: true, source: 'EXTENSION', ... }
            const data = event.data;
            if (!data || !data._zide_msg_ || data.source !== 'EXTENSION') return;

            Logger.debug('[BridgeServer] Received Window Message:', data);

            this.handleRequest(data).then(response => {
                if (response) {
                    // Send response back via postMessage
                    // The IDE listens for { source: 'PAGE', action: data.action, response: ... }
                    window.parent.postMessage({
                        _zide_msg_: true,
                        source: 'PAGE',
                        action: data.action,
                        response: response
                    }, '*');
                }
            });
        });

        Logger.info('[BridgeServer] Listening for commands.');
    },

    async handleRequest(request) {
        const { action } = request;

        try {
            switch (action) {
                case 'PING':
                    return this.handlePing();
                case 'GET_ZOHO_CODE':
                    return this.handleGetCode(request);
                case 'SET_ZOHO_CODE':
                    return this.handleSetCode(request);
                case 'SAVE_ZOHO_CODE':
                    return this.handleAction('save');
                case 'EXECUTE_ZOHO_CODE':
                    return this.handleAction('execute');
                default:
                    // Unknown action, ignore or return null
                    return null;
            }
        } catch (error) {
            Logger.error(`[BridgeServer] Error handling ${action}:`, error);
            return { error: error.message };
        }
    },

    handlePing() {
        // Return product info to let IDE know we are connected and what product it is
        // We can guess product from URL
        let product = 'generic';
        const url = window.location.href;
        if (url.includes('crm.zoho')) product = 'crm';
        else if (url.includes('creator.zoho')) product = 'creator';
        else if (url.includes('flow.zoho')) product = 'flow';

        return { status: 'PONG', product: product };
    },

    async handleGetCode(request) {
        const strategy = bridgeManager.strategy;
        // Use activeEditor from Sentinel if available, otherwise try detection (fallback)
        let editor = connectionSentinel.activeEditor;

        if (!editor) {
            // Try ad-hoc detection
            editor = strategy.detect();
        }

        if (editor) {
            const code = await strategy.pull(editor);
            return { code: code };
        } else {
            return { error: 'No editor found' };
        }
    },

    async handleSetCode(request) {
        const { code } = request;
        if (typeof code !== 'string') return { error: 'Invalid code' };

        const strategy = bridgeManager.strategy;
        let editor = connectionSentinel.activeEditor || strategy.detect();

        if (editor) {
            strategy.push(editor, code);
            return { success: true };
        } else {
            return { error: 'No editor found' };
        }
    },

    async handleAction(actionType) {
        const strategy = bridgeManager.strategy;
        // execute() returns boolean
        // We need to update strategy to support actionType (next step)
        // For now, pass actionType if supported, or default
        const success = strategy.execute(actionType);
        return { success: success };
    }
};
