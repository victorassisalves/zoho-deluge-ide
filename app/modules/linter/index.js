import engine, { setupLinter } from './engine.js';
import legacyValidation from './rules/legacy-validation.js';

export const initLinter = (monaco) => {
    if (window.linterRegistered) return;
    window.linterRegistered = true;

    engine.registerRule(legacyValidation);
    setupLinter(monaco);
};
