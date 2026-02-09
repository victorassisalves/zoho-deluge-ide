import store from './store.js';
import logger from '../utils/logger.js';

export const bridgeClient = {
    sendCommand: (action, data = {}) => {
        return new Promise((resolve, reject) => {
            if (typeof chrome === "undefined" || !chrome.tabs) return reject(new Error('No Tabs API'));

            const isSidePanel = document.documentElement.classList.contains('sidepanel-mode');

            if (isSidePanel) {
                window.parent.postMessage('ZIDE_MSG:' + JSON.stringify({ zide_source: 'EXTENSION', action, ...data }), '*');

                const handler = (event) => {
                    if (typeof event.data !== 'string' || !event.data.startsWith('ZIDE_MSG:')) return;
                    try {
                        const dataResponse = JSON.parse(event.data.substring(9));
                        if (dataResponse.zide_source === 'PAGE' && dataResponse.action === action) {
                            window.removeEventListener('message', handler);
                            resolve(dataResponse.response);
                        }
                    } catch (e) {}
                };
                window.addEventListener('message', handler);
            } else {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) return reject(new Error('No tab'));
                    chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, (response) => {
                        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                        else resolve(response);
                    });
                });
            }
        });
    }
};
export default bridgeClient;
