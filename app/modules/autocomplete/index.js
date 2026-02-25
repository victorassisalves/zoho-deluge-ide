import { setupAutocomplete } from './engine.js';
import registry from './registry.js';
import keywordProvider from './providers/keyword-provider.js';
import variableProvider from './providers/variable-provider.js';
import interfaceProvider from './providers/interface-provider.js';
import methodProvider from './providers/method-provider.js';
import zohoProvider from './providers/zoho-provider.js';
import snippetProvider from './providers/snippet-provider.js';

export const initAutocomplete = async (monaco) => {
    // Initialize async providers
    if (typeof keywordProvider.init === 'function') {
        try {
            await keywordProvider.init();
        } catch (err) {
            console.error('KeywordProvider init failed', err);
        }
    }

    // SnippetProvider doesn't need init await as it fetches on demand,
    // but if it had init, we'd await it.
    if (typeof snippetProvider.init === 'function') {
        try {
            await snippetProvider.init();
        } catch (err) {
            console.error('SnippetProvider init failed', err);
        }
    }

    registry.register(keywordProvider);
    registry.register(variableProvider);
    registry.register(interfaceProvider);
    registry.register(methodProvider);
    registry.register(zohoProvider);
    registry.register(snippetProvider);

    setupAutocomplete(monaco);
};
