/**
 * Connection Service
 * Manages the connection state with Zoho tabs.
 */
import store from './store.js';
import logger from '../utils/logger.js';
import { showStatus } from '../ui/bottom-panel/console.js';

export const checkConnection = () => {
    if (typeof chrome === "undefined" || !chrome.runtime) return;

    chrome.runtime.sendMessage({ action: "CHECK_CONNECTION" }, (response) => {
        let nextProjectUrl = "global";
        if (response && response.connected) {
            store.set('isConnected', true);
            store.set('currentTargetTab', response);

            const msg = (response.isStandalone ? "Connected to Target: " : "Connected Local: ") + (response.tabTitle || "Zoho Tab");
            showStatus(msg, "success");
            nextProjectUrl = response.url;
        } else {
            store.set('isConnected', false);
            showStatus("Disconnected from Zoho", "info");
            nextProjectUrl = "global";
        }

        const currentProjectUrl = store.get('zideProjectUrl');
        if (nextProjectUrl !== currentProjectUrl) {
            logger.info('Context switch detected: ' + nextProjectUrl);
            store.set('zideProjectUrl', nextProjectUrl);

            // Trigger load data event
            window.dispatchEvent(new CustomEvent('zide-context-changed', { detail: { url: nextProjectUrl } }));
        }
    });
};

export const initConnectionPolling = () => {
    checkConnection();
    setInterval(checkConnection, 5000);
};
