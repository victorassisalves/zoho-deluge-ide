import Logger from '../core/logger.js';
import bus from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export class ExecutionUI {
    constructor() {
        this.button = null;
        this.setupListeners();
    }

    setupListeners() {
        bus.on(EVENTS.CONNECTION.ACTIVE, (payload) => this.injectRunButton(payload));
        bus.on(EVENTS.EXECUTION.RUN, () => this.updateStatus('running'));
        bus.on(EVENTS.EXECUTION.SUCCESS, () => this.updateStatus('success'));
        bus.on(EVENTS.EXECUTION.FAILURE, () => this.updateStatus('failure'));
    }

    injectRunButton(payload) {
        if (this.button) return; // Already injected

        Logger.info('Injecting "Run" button...');

        // In a real scenario, payload.element would be the editor container.
        // We'll look for a suitable place to inject the button, e.g., next to the "Save" button.
        // For this implementation, we'll append to the body or a specific container if found.
        const container = payload.element ? payload.element.parentElement : document.body;

        this.button = document.createElement('button');
        this.button.textContent = 'Run';
        this.button.className = 'deluge-run-btn'; // We can style this later
        this.button.style.marginLeft = '10px';
        this.button.onclick = () => {
            Logger.info('User clicked "Run"');
            bus.emit(EVENTS.EXECUTION.RUN);
        };

        container.appendChild(this.button);
        Logger.info('"Run" button injected.');
    }

    updateStatus(status) {
        if (!this.button) return;

        switch (status) {
            case 'running':
                this.button.textContent = 'Running...';
                this.button.disabled = true;
                break;
            case 'success':
                this.button.textContent = 'Success!';
                this.button.style.backgroundColor = 'green';
                setTimeout(() => this.resetButton(), 2000);
                break;
            case 'failure':
                this.button.textContent = 'Failed';
                this.button.style.backgroundColor = 'red';
                setTimeout(() => this.resetButton(), 2000);
                break;
        }
    }

    resetButton() {
        if (!this.button) return;
        this.button.textContent = 'Run';
        this.button.disabled = false;
        this.button.style.backgroundColor = '';
    }
}

const executionUI = new ExecutionUI();
export default executionUI;
