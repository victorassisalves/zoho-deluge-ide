/**
 * Bridge Client (IDE Side)
 */
import store from './store.js';
import logger from '../utils/logger.js';

export const bridgeClient = {
    sendCommand: (action, data = {}) => {
        return new Promise((resolve, reject) => {
            if (typeof chrome === "undefined" || !chrome.tabs) {
                return reject(new Error('Chrome tabs API not available'));
            }

            const isSidePanel = document.documentElement.classList.contains('sidepanel-mode');

            if (isSidePanel) {
                window.parent.postMessage(JSON.stringify({ zide_type: 'FROM_EXTENSION', action, ...data }), '*');

                const handler = (event) => {
                    let eventData;
                    try {
                        eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    } catch (e) { return; }

                    if (eventData && eventData.zide_type === 'FROM_PAGE' && eventData.action === action) {
                        window.removeEventListener('message', handler);
                        resolve(eventData.response);
                    }
                };
                window.addEventListener('message', handler);
            } else {
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
