/**
 * Bridge Client (IDE Side)
 * Sends commands to the Zoho content script.
 */
import store from './store.js';
import logger from '../utils/logger.js';

export const bridgeClient = {
    sendCommand: (action, data = {}) => {
        return new Promise((resolve, reject) => {
            if (typeof chrome === "undefined" || !chrome.tabs) {
                return reject(new Error('Chrome tabs API not available'));
            }

            // In side panel mode, we might want to target our own tab
            const isSidePanel = document.documentElement.classList.contains('sidepanel-mode');

            if (isSidePanel) {
                // Send to parent frame
                window.parent.postMessage({ type: 'FROM_EXTENSION', action, ...data }, '*');

                const handler = (event) => {
                    if (event.data && event.data.type === 'FROM_PAGE' && event.data.action === action) {
                        window.removeEventListener('message', handler);
                        resolve(event.data.response);
                    }
                };
                window.addEventListener('message', handler);
            } else {
                // Standalone mode: target active tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) return reject(new Error('No active tab found'));

                    chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
            }
        });
    },

    pullCode: async () => {
        logger.info('Pulling code from Zoho...');
        try {
            const response = await bridgeClient.sendCommand('GET_ZOHO_CODE');
            if (response && response.code) {
                const editor = store.getEditor();
                if (editor) editor.setValue(response.code);
                return true;
            }
        } catch (err) {
            logger.error('Pull failed:', err);
        }
        return false;
    }
};

export default bridgeClient;
