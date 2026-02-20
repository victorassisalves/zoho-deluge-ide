import engine, { setupLinter } from './engine.js';
import legacyValidation from './rules/legacy-validation.js';

export const initLinter = (monaco) => {
    engine.registerRule(legacyValidation);
    setupLinter(monaco);
};
