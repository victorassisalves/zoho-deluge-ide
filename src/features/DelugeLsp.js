import { setupAutocomplete } from './autocomplete/engine.js';
import registry from './autocomplete/registry.js';
import typeScanner from './type-system/TypeScanner.js';
import interfaceProvider from './autocomplete/InterfaceProvider.js';
import variableProvider from './autocomplete/providers/variable-provider.js';
import keywordProvider from './autocomplete/providers/keyword-provider.js';
import diagnostics from '../services/diagnostics.js';

class DelugeLsp {
    constructor() {
        this.initialized = false;
    }

    init(editor) {
        if (this.initialized) return;
        this.initialized = true;

        diagnostics.report('DelugeLsp', 'Initializing Language Server Protocol features...');

        // 1. Initialize Type System
        if (editor) {
            typeScanner.attach(editor);
        }

        // 2. Register Providers
        registry.register(interfaceProvider);
        registry.register(variableProvider);
        registry.register(keywordProvider);

        // 3. Setup Engine (Monaco Registration)
        if (typeof monaco !== 'undefined') {
            setupAutocomplete(monaco);
        } else {
            console.error('DelugeLsp: Monaco not found during initialization');
        }
    }
}

export default new DelugeLsp();
