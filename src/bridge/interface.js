/**
 * src/bridge/interface.js
 * Interface Manager: Handles User Interaction (Keyboard/Mouse) for the UI.
 * Implements the Singleton Pattern.
 */
import { eventBus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';
import { logger as Logger } from '../utils/logger.js';

class InterfaceManager {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        Logger.info('[InterfaceManager] Initializing interaction listeners...');

        // 1. Listen for Keyboard Shortcuts (F2)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                Logger.info('[InterfaceManager] F2 pressed -> Toggling UI');
                eventBus.emit(EVENTS.UI.TOGGLE);
            }
        });

        // 2. Listen for Chrome Runtime Messages (Extension Icon / Context Menu)
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'TOGGLE_UI') {
                Logger.info('[InterfaceManager] Received TOGGLE_UI message');
                eventBus.emit(EVENTS.UI.TOGGLE);
                return;
            }

            // Handle Bridge Actions from Background (Shortcuts)
            if (request.action === 'CMD_SYNC_SAVE') {
                Logger.info('[InterfaceManager] Received CMD_SYNC_SAVE');
                eventBus.emit(EVENTS.EDITOR.PUSH, { code: null }); // Push current editor content (null payload might trigger fetch from UI or Sentinel)
                // Actually, PUSH expects payload.code. But here we want to trigger the SAVE process.
                // The architecture seems to be: UI -> PUSH -> Bridge.
                // But shortcuts are Background -> Interface -> Bridge.
                // If we want to "Save", we usually mean "Push changes to Zoho and Save".
                // Let's emit PULL to get code, then we can do something?
                // Or maybe we just trigger the UI to do the sync?
                // For now, let's just trigger the EXECUTION.RUN for "Execute".
            }

            if (request.action === 'CMD_PULL_CODE') {
                Logger.info('[InterfaceManager] Received CMD_PULL_CODE');
                eventBus.emit(EVENTS.EDITOR.PULL);
            }
        });

        // 3. Handle Direct Code Access for Background (GET_ZOHO_CODE, etc)
        // This allows the background script to query the editor state directly via chrome.tabs.sendMessage
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'GET_ZOHO_CODE') {
                // We need to access the BridgeManager to get the code.
                // Since InterfaceManager and BridgeManager are singletons, we can import bridgeManager.
                // However, avoiding circular deps is good.
                // But we are in the same module graph.

                // We will emit an event and wait for response? No, sendResponse is sync or async.
                // Better to use the bridge directly if possible, or use a request/response event pattern.

                // Ideally, we import bridgeManager here dynamically or statically if possible.
                // Let's try dynamic import or just rely on the global strategy if available.
                // But bridgeManager holds the strategy.

                // Let's dispatch a CustomEvent that BridgeManager listens to?
                // Or just import bridgeManager.
                import('./manager.js').then(({ bridgeManager }) => {
                     const editorEl = document.querySelector('.ace_editor') || document.querySelector('.CodeMirror') || document.querySelector('.monaco-editor');
                     // We need to use the strategy's pull logic, which might need more context.
                     // But for GET_ZOHO_CODE, simple pull is usually enough.
                     let code = "";
                     if (bridgeManager.strategy && editorEl) {
                        code = bridgeManager.strategy.pull(editorEl);
                     }
                     sendResponse({ code });
                });
                return true; // Keep channel open
            }
        });

        this.isInitialized = true;
    }
}

export const interfaceManager = new InterfaceManager();
