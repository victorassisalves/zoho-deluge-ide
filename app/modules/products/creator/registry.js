import { creatorProvider } from './provider.js';
import { Bus } from '../../../core/bus.js';
import { MSG } from '../../../../shared/protocol.js';

let isMounted = false;
let disposableProvider = null;

export function mountCreatorSandbox(file) {
    if (file && file.metadata && file.metadata.product === 'creator') {
        if (!isMounted) {
            console.log('[ZohoIDE] Mounting isolated CreatorEngine');
            if (window.monaco && window.monaco.languages) {
                disposableProvider = monaco.languages.registerCompletionItemProvider('deluge', creatorProvider);
                isMounted = true;
            } else {
                console.warn('[ZohoIDE] Monaco languages not available to mount CreatorEngine');
            }
        }
    } else {
        if (isMounted) {
            console.log('[ZohoIDE] Unmounting isolated CreatorEngine (File context changed)');
            if (disposableProvider) {
                disposableProvider.dispose();
                disposableProvider = null;
            }
            isMounted = false;
        }
    }
}
