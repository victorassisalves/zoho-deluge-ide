import Logger from '../core/logger.js';
import bus from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export class SyncUI {
    constructor() {
        this.buttons = [];
        this.setupListeners();
    }

    setupListeners() {
        bus.on(EVENTS.CONNECTION.ACTIVE, (payload) => this.injectSyncButtons(payload));
    }

    injectSyncButtons(payload) {
        if (this.buttons.length > 0) return; // Already injected

        Logger.info('Injecting "Sync" buttons...');

        const container = payload.element ? payload.element.parentElement : document.body;

        // Push Button
        const pushBtn = document.createElement('button');
        pushBtn.textContent = 'Push';
        pushBtn.className = 'deluge-sync-btn';
        pushBtn.style.marginLeft = '10px';
        pushBtn.onclick = () => {
            Logger.info('User clicked "Push"');
            bus.emit(EVENTS.EXECUTION.PUSH);
        };
        container.appendChild(pushBtn);
        this.buttons.push(pushBtn);

        // Pull Button
        const pullBtn = document.createElement('button');
        pullBtn.textContent = 'Pull';
        pullBtn.className = 'deluge-sync-btn';
        pullBtn.style.marginLeft = '10px';
        pullBtn.onclick = () => {
            Logger.info('User clicked "Pull"');
            bus.emit(EVENTS.EXECUTION.PULL);
        };
        container.appendChild(pullBtn);
        this.buttons.push(pullBtn);

        Logger.info('"Sync" buttons injected.');
    }
}

const syncUI = new SyncUI();
export default syncUI;
