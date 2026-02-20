import { legacyProvider } from './providers/legacy-provider.js';
import diagnostics from '../../services/diagnostics.js';

export const initAutocomplete = (monaco) => {
    if (window.autocompleteRegistered) return;
    window.autocompleteRegistered = true;

    diagnostics.report('Autocomplete', 'initializing');
    monaco.languages.registerCompletionItemProvider('deluge', {
        triggerCharacters: legacyProvider.triggerCharacters,
        provideCompletionItems: legacyProvider.provideCompletionItems
    });
    diagnostics.report('Autocomplete', 'ready');
};
