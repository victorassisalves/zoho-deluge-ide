/**
 * Linter Engine
 */
import logger from '../../utils/logger.js';

class LinterEngine {
    constructor() {
        this.rules = [];
    }

    registerRule(rule) {
        this.rules.push(rule);
    }

    validate(model) {
        if (!model || model.getLanguageId() !== 'deluge') return [];

        const code = model.getValue();
        const lines = model.getLinesContent();
        const markers = [];

        // Global context that can be shared across rules
        const context = {
            lines,
            code,
            markers
        };

        this.rules.forEach(rule => {
            try {
                rule.validate(context);
            } catch (err) {
                logger.error(\`Error in linter rule \${rule.name}:\`, err);
            }
        });

        return markers;
    }
}

const engine = new LinterEngine();
export default engine;

export const setupLinter = (monaco) => {
    logger.info('Initializing Linter Engine...');

    const validateModel = (model) => {
        const markers = engine.validate(model);
        monaco.editor.setModelMarkers(model, 'deluge', markers);

        // Expose global for sync blocking if needed
        window.hasLinterErrors = markers.some(m => m.severity === monaco.MarkerSeverity.Error);
    };

    monaco.editor.onDidCreateModel(model => {
        if (model.getLanguageId() === 'deluge') {
            validateModel(model);
            model.onDidChangeContent(() => validateModel(model));
        }
    });

    // Validate existing models
    monaco.editor.getModels().forEach(model => {
        if (model.getLanguageId() === 'deluge') {
            validateModel(model);
            model.onDidChangeContent(() => validateModel(model));
        }
    });
};
