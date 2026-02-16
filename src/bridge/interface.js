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
            }
        });

        this.isInitialized = true;
    }
}

export const interfaceManager = new InterfaceManager();
