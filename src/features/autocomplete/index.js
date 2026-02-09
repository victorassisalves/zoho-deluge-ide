/**
 * Autocomplete Feature (Hybrid B1+B3)
 */
import { setupAutocomplete } from './engine.js';
import registry from './registry.js';
import keywordProvider from './providers/keyword-provider.js';
import methodProvider from './providers/method-provider.js';
import zohoTaskProvider from './providers/zoho-task-provider.js';
import variableProvider from './providers/variable-provider.js';

export const initAutocomplete = (monaco) => {
    // Register all providers
    registry.register(keywordProvider);
    registry.register(methodProvider);
    registry.register(zohoTaskProvider);
    registry.register(variableProvider);

    // Initialize engine
    setupAutocomplete(monaco);
};
