import { MSG } from '../../shared/protocol.js';

const isSidePanel = window.location.search.includes('mode=sidepanel') || window.location.hash.includes('sidepanel');

export const ZohoRunner = {
    execute: (code) => {
        console.log('[ZohoRunner] Executing code...');
        if (isSidePanel) {
            window.Bus.send(MSG.CODE_EXECUTE, { code });
        } else {
            // Standalone Mode (New Tab)
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
        }
    },

    save: (code) => {
        console.log('[ZohoRunner] Saving code...');
        if (isSidePanel) {
            window.Bus.send(MSG.CODE_SAVE, { code });
        } else {
            // Standalone Mode
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({ action: 'SET_ZOHO_CODE', code: code }, (res) => {
                    if (res && res.success) {
                        chrome.runtime.sendMessage({ action: 'SAVE_ZOHO_CODE' });
                    }
                });
            }
        }
    },

    pull: () => {
        console.log('[ZohoRunner] Pulling code...');
        if (isSidePanel) {
            window.Bus.send(MSG.CODE_PULL);
        } else {
            // Standalone Mode
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({ action: 'GET_ZOHO_CODE' }, (response) => {
                    if (response && response.code) {
                        // Use postMessage to self so Bus listener in editor-controller picks it up
                        window.postMessage({ type: 'editor:pull_response', code: response.code }, '*');
                    }
                });
            }
        }
    }
};

window.ZohoRunner = ZohoRunner;
