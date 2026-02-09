import { setupAutocomplete } from './engine.js';
import registry from './registry.js';
import keywordProvider from './providers/keyword-provider.js';
import variableProvider from './providers/variable-provider.js';

export const initAutocomplete = (monaco) => {
    registry.register(keywordProvider);
    registry.register(variableProvider);
    setupAutocomplete(monaco);
};
