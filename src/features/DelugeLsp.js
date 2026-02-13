import TypeScanner from './type-system/TypeScanner.js';
import InterfaceProvider from './autocomplete/InterfaceProvider.js';

export class DelugeLsp {
    constructor(editor) {
        this.editor = editor;
        this.typeScanner = new TypeScanner();
        this.interfaceProvider = new InterfaceProvider(this.typeScanner);
    }

    start() {
        if (!this.editor) return;

        // Start scanning
        this.typeScanner.attach(this.editor);

        // Register provider
        // We use a closure to ensure 'this' context is preserved inside provideCompletionItems
        this.completionDisposable = monaco.languages.registerCompletionItemProvider('deluge', {
            triggerCharacters: ['.'],
            provideCompletionItems: (model, position, context, token) => {
                return this.interfaceProvider.provideCompletionItems(model, position, context, token);
            }
        });

        console.log('[DelugeLsp] Started');
    }

    stop() {
        if (this.completionDisposable) {
            this.completionDisposable.dispose();
            this.completionDisposable = null;
        }
    }
}
