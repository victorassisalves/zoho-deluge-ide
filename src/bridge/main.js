import { getZohoProduct } from './detectors.js';
import { getEditorCode } from './scrapers.js';
import { setEditorCode, clickByText, clickBySelectors } from './actions/base-actions.js';

console.log('[ZohoIDE] Modular Bridge Loaded');

const selectors = {
    save: [
        'button[id="save_script"]', '#save_script', '#save_btn',
        '#crmsave', 'lyte-button[data-id="save"]', 'lyte-button[data-id="update"]',
        'lyte-button[data-zcqa="functionSavev2"]', '.dxEditorPrimaryBtn',
        '.crm-save-btn', '.zc-save-btn', '.save-btn', '.save_btn',
        'input#saveBtn', 'input[value="Save"]', 'input[value="Update"]'
    ],
    execute: [
        'button[id="execute_script"]', '#execute_script', 'button[id="run_script"]', '#run_script',
        '#crmexecute', 'span[data-zcqa="delgv2execPlay"]', '.dx_execute_icon',
        '#runscript', '.zc-execute-btn', '.execute-btn',
        '.lyte-button[data-id="execute"]', '.lyte-button[data-id="run"]',
        '.execute_btn', '#execute_btn', 'input#executeBtn',
        'input[value="Execute"]', 'input[value="Run"]'
    ]
};

window.addEventListener('message', (e) => {
    if (typeof e.data !== 'string' || !e.data.startsWith('ZIDE_MSG:')) return;
    try {
        const msg = JSON.parse(e.data.substring(9));
        if (msg.source !== 'EXTENSION') return;

        let resp = {};
        if (msg.action === 'PING') {
            resp = { status: 'PONG', product: getZohoProduct() };
        } else if (msg.action === 'GET_ZOHO_CODE') {
            resp = { code: getEditorCode() };
        } else if (msg.action === 'SET_ZOHO_CODE') {
            resp = { success: setEditorCode(msg.code) };
        } else if (msg.action === 'SAVE_ZOHO_CODE') {
            resp = { success: triggerAction('save') };
        } else if (msg.action === 'EXECUTE_ZOHO_CODE') {
            resp = { success: triggerAction('execute') };
        }

        window.postMessage('ZIDE_MSG:' + JSON.stringify({
            source: 'PAGE',
            action: msg.action,
            response: resp
        }), '*');
    } catch (err) {}
});

function triggerAction(type) {
    let success = clickBySelectors(selectors[type]);
    if (!success) success = clickByText(type);
    return success;
}
