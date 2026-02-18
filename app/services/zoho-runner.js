import { MSG } from '../../shared/protocol.js';

export const ZohoRunner = {
    execute: (code) => {
        console.log('[ZohoRunner] Executing code...');
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (res) => {
                if (res && res.success) {
                    chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' }, (saveRes) => {
                        setTimeout(() => {
                            chrome.runtime.sendMessage({ action: 'EXECUTE_ZOHO_CODE' });
                        }, 500);
                    });
                }
            });
        }
    },

    save: (code) => {
        console.log('[ZohoRunner] Saving code...');
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (res) => {
                if (res && res.success) {
                    chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' });
                }
            });
        }
    },

    pull: () => {
        console.log('[ZohoRunner] Pulling code...');
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
                if (response && response.code) {
                    // Dispatch event locally so editor-controller picks it up
                    // Bus listens to window 'message'
                    window.postMessage({ type: 'editor:pull_response', code: response.code }, '*');
                } else {
                    console.error('[ZohoRunner] Pull failed or no code returned', response);
                }
            });
        }
    }
};

window.ZohoRunner = ZohoRunner;
