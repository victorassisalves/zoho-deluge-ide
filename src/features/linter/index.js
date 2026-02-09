import engine, { setupLinter } from './engine.js';
import bracketRule from './rules/bracket-rule.js';
import semicolonRule from './rules/semicolon-rule.js';

export const initLinter = (monaco) => {
    engine.registerRule(bracketRule);
    engine.registerRule(semicolonRule);

    setupLinter(monaco);
};
