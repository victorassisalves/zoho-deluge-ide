import diagnostics from '../../services/diagnostics.js';

class LinterEngine {
    constructor() {
        this.rules = [];
    }

    registerRule(rule) {
        this.rules.push(rule);
    }

    validate(model) {
        if (!model) return [];
        const context = {
            lines: model.getLinesContent(),
            code: model.getValue(),
            markers: []
        };
        this.rules.forEach(rule => {
            try { rule.validate(context); } catch (e) {}
        });
        return context.markers;
    }
}

const engine = new LinterEngine();
export default engine;

export const setupLinter = (monaco) => {
    diagnostics.report('LinterEngine', 'initializing');

    const validate = (model) => {
        const markers = engine.validate(model);
        monaco.editor.setModelMarkers(model, 'deluge', markers);
    };

    monaco.editor.onDidCreateModel(model => {
        if (model.getLanguageId() === 'deluge') {
            validate(model);
            model.onDidChangeContent(() => validate(model));
        }
    });

    diagnostics.report('LinterEngine', 'ready');
};
