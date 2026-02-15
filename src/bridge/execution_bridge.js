import Logger from '../core/logger.js';
import bus from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export class ExecutionBridge {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        bus.on(EVENTS.EXECUTION.RUN, () => this.executeCode());
    }

    executeCode() {
        Logger.info('Bridge: Requesting code execution...');

        // In a real Zoho environment, this would click the native "Execute" or "Save & Execute" button.
        // For simulation, we'll find a button with class 'zoho-execute-btn' or similar.
        const executeButton = document.querySelector('.zoho-execute-btn');

        if (executeButton) {
            executeButton.click();
            Logger.info('Bridge: Clicked native "Execute" button.');
            // We assume success for now, or the button click triggers a chain that eventually reports success.
            // For this test, we can simulate success after a delay.
            setTimeout(() => {
                bus.emit(EVENTS.EXECUTION.SUCCESS);
            }, 1000);
        } else {
            Logger.warn('Bridge: Could not find native "Execute" button.');
            bus.emit(EVENTS.EXECUTION.FAILURE, { reason: 'Execute button not found' });
        }
    }
}

const executionBridge = new ExecutionBridge();
export default executionBridge;
