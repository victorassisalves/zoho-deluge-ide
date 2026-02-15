import Logger from './logger.js';
import bus from './bus.js';
import { EVENTS } from './events.js';

export class ConnectionSentinel {
    constructor() {
        this.isActive = false;
        this.editorElement = null;
        this.pollInterval = null;
    }

    start() {
        if (this.pollInterval) return;
        Logger.info('Starting Connection Sentinel...');
        this.pollInterval = setInterval(() => this.checkConnection(), 1000);
    }

    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            Logger.info('Stopped Connection Sentinel.');
        }
    }

    checkConnection() {
        // Placeholder selector for Zoho's editor container
        // This will need to be refined based on the specific Zoho product (Creator, CRM, etc.)
        const editorSelector = '.monaco-editor';
        const foundElement = document.querySelector(editorSelector);

        if (foundElement && !this.isActive) {
            this.isActive = true;
            this.editorElement = foundElement;
            Logger.info('Connection established with editor.');
            bus.emit(EVENTS.CONNECTION.ACTIVE, { element: foundElement });
        } else if (!foundElement && this.isActive) {
            this.isActive = false;
            this.editorElement = null;
            Logger.warn('Connection lost with editor.');
            bus.emit(EVENTS.CONNECTION.LOST);
        }
    }
}

const sentinel = new ConnectionSentinel();

// Auto-start on CORE.INIT
bus.on(EVENTS.CORE.INIT, () => {
    sentinel.start();
});

export default sentinel;
