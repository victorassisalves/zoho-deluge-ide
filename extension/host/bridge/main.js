import { getZohoProduct } from './detectors.js';
import { getEditorCode } from './scrapers.js';
import { setEditorCode, clickByText, clickBySelectors } from './actions/base-actions.js';

console.log('[ZohoIDE] Modular Bridge Loaded');

const selectors = {
    save: [
        'button[id="save_script"]', '#save_script', '#save_btn',
        '#crmsave', 'lyte-button[data-id="save"]', 'lyte-button[data-id="update"]',
        'lyte-button[data-zcqa="save"]', 'lyte-button[data-zcqa="update"]',
        'lyte-button[data-zcqa="functionSavev2"]', '.dxEditorPrimaryBtn',
        '.crm-save-btn', '.zc-save-btn', '.save-btn', '.zc-update-btn', '.save_btn',
        'input#saveBtn', 'input[value="Save"]', 'input[value="Update"]'
    ],
    execute: [
        'button[id="execute_script"]', '#execute_script', 'button[id="run_script"]', '#run_script',
        '#crmexecute', 'span[data-zcqa="delgv2execPlay"]', '.dx_execute_icon',
        '#runscript', '.zc-execute-btn', '.execute-btn',
        'lyte-button[data-zcqa="execute"]', 'lyte-button[data-zcqa="run"]',
        '.lyte-button[data-id="execute"]', '.lyte-button[data-id="run"]',
        '.execute_btn', '#execute_btn', 'input#executeBtn',
        'input[value="Execute"]', 'input[value="Run"]'
    ]
};

window.addEventListener('ZOHO_IDE_FROM_EXT', async (event) => {
    const data = event.detail;
    if (!data || !data.action) return;

    let response = {};
    const { action, eventId } = data;

    if (action === 'GET_ZOHO_CODE') {
        response = { code: getEditorCode() };
    } else if (action === 'SET_ZOHO_CODE') {
        response = { success: setEditorCode(data.code) };
    } else if (action === 'SAVE_ZOHO_CODE') {
        response = { success: triggerAction('save') };
    } else if (action === 'EXECUTE_ZOHO_CODE') {
        response = { success: triggerAction('execute') };
    } else if (action === 'PING') {
        response = { status: 'PONG', product: getZohoProduct() };
    }

    window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
        detail: { eventId, action, response }
    }));
});

function triggerAction(type) {
    let success = clickBySelectors(selectors[type]);
    if (!success) success = clickByText(type);
    return success;
}
