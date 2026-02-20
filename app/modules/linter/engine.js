import diagnostics from '../../../src/services/diagnostics.js';
import { validateDelugeModel } from './legacy-validation.js';

class LinterEngine {
    constructor() {
        this.rules = [];
        this.debounceTimer = null;
    }

    registerRule(rule) {
        this.rules.push(rule);
    }

    validate(model) {
        if (!model) return;

        // Use legacy validation which sets markers directly
        validateDelugeModel(model);
    }
}

const engine = new LinterEngine();
export default engine;

export const setupLinter = (monaco) => {
    diagnostics.report('LinterEngine', 'initializing');

    const validate = (model) => {
        engine.validate(model);
    };

    monaco.editor.onDidCreateModel(model => {
        if (model.getLanguageId() === 'deluge') {
            validate(model);

            model.onDidChangeContent(() => {
                if (engine.debounceTimer) clearTimeout(engine.debounceTimer);
                engine.debounceTimer = setTimeout(() => {
                    validate(model);
                }, 300);
            });
        }
    });

    // Expose for global access if needed
    window.validateDelugeModel = validate;

    diagnostics.report('LinterEngine', 'ready');
};
