import Logger from '../core/logger.js';
import bus from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export class SyncBridge {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        // Listen for Pull Request -> Get Native Content -> Set Monaco
        bus.on(EVENTS.EXECUTION.PULL, () => this.pullCode());

        // Listen for Push Request -> Get Payload (Content) -> Set Native
        // Listen to the specific payload event emitted by EditorManager
        bus.on('execution:push-payload', (payload) => this.pushCode(payload));
    }

    pullCode() {
        Logger.info('Bridge: Pulling code from native editor...');

        // Placeholder: Look for native textarea or editor element
        const nativeEditor = document.querySelector('.zoho-editor-content');

        if (nativeEditor) {
            const code = nativeEditor.value || nativeEditor.textContent;
            Logger.info('Bridge: Pulled code successfully.', { contentLength: code.length });
            // Emit SET_VALUE to update Monaco
            bus.emit(EVENTS.EDITOR.SET_VALUE, { code });
        } else {
            Logger.warn('Bridge: Could not find native editor content.');
            bus.emit(EVENTS.EXECUTION.FAILURE, { reason: 'Native editor not found' });
        }
    }

    pushCode(payload) {
        if (!payload || !payload.code) {
            Logger.warn('Bridge: No code provided to push.');
            return;
        }

        Logger.info('Bridge: Pushing code to native editor...');

        const nativeEditor = document.querySelector('.zoho-editor-content');

        if (nativeEditor) {
            nativeEditor.value = payload.code;
            nativeEditor.textContent = payload.code; // Fallback
            // Trigger change event if needed
            // Fix: Use global.Event if in node/jsdom environment, or window.Event
            try {
                const event = new Event('input', { bubbles: true });
                nativeEditor.dispatchEvent(event);
            } catch (e) {
                // Fallback for some testing environments
                try {
                     const event = document.createEvent('Event');
                     event.initEvent('input', true, true);
                     nativeEditor.dispatchEvent(event);
                } catch (e2) {
                     Logger.warn('Bridge: Failed to dispatch input event', e2);
                }
            }

            Logger.info('Bridge: Pushed code successfully.');
            bus.emit(EVENTS.EXECUTION.SUCCESS);
        } else {
            Logger.warn('Bridge: Could not find native editor to push to.');
            bus.emit(EVENTS.EXECUTION.FAILURE, { reason: 'Native editor not found' });
        }
    }
}

const syncBridge = new SyncBridge();
export default syncBridge;
