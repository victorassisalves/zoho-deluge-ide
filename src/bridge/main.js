import { getEditorCode, getCreatorForms } from './scrapers.js';
import { setEditorCode, clickByText } from './actions/base-actions.js';
import { triggerCrmAction } from './actions/crm.js';
import { getZohoProduct } from './detectors.js';

console.log('[ZohoIDE] Modular Bridge Initialized');

window.addEventListener('message', (event) => {
    let data;
    try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) { return; }

    if (data && data.zide_type === 'FROM_EXTENSION') {
        const action = data.action;
        let response = {};

        if (action === 'GET_ZOHO_CODE') {
            const code = getEditorCode();
            response = code !== null ? { code } : { error: 'No editor found' };
        } else if (action === 'SET_ZOHO_CODE') {
            response = { success: setEditorCode(data.code) };
        } else if (action === 'SAVE_ZOHO_CODE') {
            response = { success: triggerBridgeAction('save') };
        } else if (action === 'EXECUTE_ZOHO_CODE') {
            response = { success: triggerBridgeAction('execute') };
        } else if (action === 'GET_CREATOR_FORMS') {
            response = { forms: getCreatorForms() };
        }

        window.postMessage(JSON.stringify({ zide_type: 'FROM_PAGE', action: action, response: response }), '*');
    }
});

function triggerBridgeAction(type) {
    const product = getZohoProduct();
    let success = false;
    if (product === 'crm') success = triggerCrmAction(type);
    if (!success) success = clickByText(type);
    return success;
}

setInterval(() => {
    try {
        const selectors = ['.console-output', '#console-result', '.builder-console-content', '.debugger-console', '[id*="console"]', '.output-container', '.deluge-console'];
        for (let selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText && el.innerText.trim().length > 0) {
                const text = el.innerText.trim();
                if (text !== window._last_console_data) {
                    window._last_console_data = text;
                    window.postMessage(JSON.stringify({ zide_type: 'FROM_PAGE', action: 'ZOHO_CONSOLE_UPDATE', data: text }), '*');
                    break;
                }
            }
        }
    } catch (e) {}
}, 2000);
