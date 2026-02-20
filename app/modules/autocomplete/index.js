import { legacyProvider } from './providers/legacy-provider.js';
import diagnostics from '../../services/diagnostics.js';

export const initAutocomplete = (monaco) => {
    diagnostics.report('Autocomplete', 'initializing');
    monaco.languages.registerCompletionItemProvider('deluge', {
        triggerCharacters: legacyProvider.triggerCharacters,
        provideCompletionItems: legacyProvider.provideCompletionItems
    });
    diagnostics.report('Autocomplete', 'ready');
};
