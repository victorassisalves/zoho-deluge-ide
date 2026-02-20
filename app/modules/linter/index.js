import engine, { setupLinter } from './engine.js';
import bracketRule from './rules/bracket-rule.js';

export const initLinter = (monaco) => {
    engine.registerRule(bracketRule);
    setupLinter(monaco);
};
