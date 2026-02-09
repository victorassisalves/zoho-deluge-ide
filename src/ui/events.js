/**
 * UI Event Handlers
 */
import store from '../services/store.js';
import bridgeClient from '../services/bridge-client.js';
import { saveLocally } from '../services/storage.js';
import { showStatus } from './bottom-panel/console.js';

export const initUIEvents = () => {
    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    bind('pull-code-btn', 'click', () => bridgeClient.pullCode());

    bind('sync-save-btn', 'click', async () => {
        showStatus('Syncing to Zoho...', 'info');
        const editor = store.getEditor();
        if (!editor) return;

        saveLocally();
        const success = await bridgeClient.sendCommand('SET_ZOHO_CODE', { code: editor.getValue() });
        if (success) {
            await bridgeClient.sendCommand('SAVE_ZOHO_CODE');
            showStatus('Saved to Zoho!', 'success');
        } else {
            showStatus('Failed to sync. Is Zoho tab connected?', 'error');
        }
    });

    bind('project-name-input', 'change', (e) => {
        const newName = e.target.value;
        const url = store.get('zideProjectUrl');
        if (!url) return;

        chrome.storage.local.get(['project_names'], (result) => {
            const names = result.project_names || {};
            names[url] = newName;
            chrome.storage.local.set({ 'project_names': names }, () => {
                store.set('zideProjectName', newName);
            });
        });
    });

    // Listen for context changes
    window.addEventListener('zide-context-changed', () => {
        // Handle context change
    });
};
