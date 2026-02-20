import { setupAutocomplete } from './engine.js';
import registry from './registry.js';
import keywordProvider from './providers/keyword-provider.js';
import variableProvider from './providers/variable-provider.js';
import interfaceProvider from './providers/interface-provider.js';
import methodProvider from './providers/method-provider.js';
import zohoProvider from './providers/zoho-provider.js';
import snippetProvider from './providers/snippet-provider.js';

export const initAutocomplete = (monaco) => {
    registry.register(keywordProvider);
    registry.register(variableProvider);
    registry.register(interfaceProvider);
    registry.register(methodProvider);
    registry.register(zohoProvider);
    registry.register(snippetProvider);
    setupAutocomplete(monaco);
};
