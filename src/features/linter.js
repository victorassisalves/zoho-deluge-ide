import Logger from '../core/logger.js';
import bus from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export class Linter {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        bus.on(EVENTS.EDITOR.CHANGE, (payload) => this.runLint(payload.code));
    }

    runLint(code) {
        Logger.info('Linter: Running analysis...');
        const errors = [];

        // Mock simple checks
        if (code.includes('var ')) {
            errors.push({ line: 1, message: 'Use "let" or "const" instead of "var".' });
        }

        if (errors.length > 0) {
            Logger.warn('Linter: Found issues.', errors);
            bus.emit(EVENTS.LINTER.RESULTS, { errors });
        } else {
            Logger.info('Linter: No issues found.');
            bus.emit(EVENTS.LINTER.RESULTS, { errors: [] });
        }
    }
}

const linter = new Linter();
export default linter;
