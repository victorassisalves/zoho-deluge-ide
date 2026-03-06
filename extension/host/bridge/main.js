import { getZohoProduct, getContext } from './detectors.js';
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

// Listen for Custom Events from Content Script (Same context, isolated world bridge)
window.addEventListener('ZOHO_IDE_FROM_EXT', async (event) => {
    const data = event.detail;
    if (!data || !data.action) return;

    let response = {};
    const { action, eventId } = data;

    if (action === 'SET_CONTEXT_HASH') {
        window.__zide_manual_context_hash = data.contextHash;
        response = { success: true };
    } else if (action === 'PING') {
        const context = getContext();
        response = { status: 'PONG', product: context.service, context: context };
    } else if (action === 'GET_ZOHO_CODE') {
        response = { code: getEditorCode() };
    } else if (action === 'SET_ZOHO_CODE') {
        response = { success: setEditorCode(data.code) };
    } else if (action === 'SAVE_ZOHO_CODE') {
        response = { success: triggerAction('save') };
    } else if (action === 'EXECUTE_ZOHO_CODE') {
        response = { success: triggerAction('execute') };
    }

    // Respond via Custom Event
    window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
        detail: { eventId, action, response }
    }));
});

function triggerAction(type) {
    let success = clickBySelectors(selectors[type]);
    if (!success) success = clickByText(type);
    return success;
}

// --- Network Payload Fingerprinting ---
function inspectPayload(jsonText, url) {
    if (!jsonText || typeof jsonText !== 'string' || jsonText === '[object Object]') return;
    if (jsonText.length < 10) return;
    try {
        const json = JSON.parse(jsonText);

        // 1. The Creator Metadata Fingerprint
        if (json.apps && Object.keys(json.apps).length > 0) {
            const firstAppKey = Object.keys(json.apps)[0];
            if (json.apps[firstAppKey].forms) {
                console.log('[ZohoIDE] Found Creator Metadata Payload!');
                window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
                    detail: {
                        eventId: 'intercept_' + Date.now(),
                        action: 'METADATA_INTERCEPTED',
                        response: {
                            product: 'creator',
                            appKey: firstAppKey,
                            schema: json.apps[firstAppKey]
                        }
                    }
                }));
                return;
            }
        }

        // 2. The CRM Metadata Fingerprint (For future-proofing)
        if (json.functions && Array.isArray(json.functions) && json.functions.length > 0 && json.functions[0].workflow) {
            console.log('[ZohoIDE] Found CRM Metadata Payload!');
            window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
                detail: {
                    eventId: 'intercept_' + Date.now(),
                    action: 'METADATA_INTERCEPTED',
                    response: {
                        product: 'crm',
                        schema: json.functions
                    }
                }
            }));
            return;
        }
    } catch (e) {
        // Ignore JSON parse errors for non-JSON payloads
    }
}

// Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    // Clone response so we don't consume the stream needed by the page
    const clonedResponse = response.clone();
    clonedResponse.text().then(text => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        inspectPayload(text, url);
    }).catch(e => {});
    return response;
};

// Intercept XMLHttpRequest
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    let requestUrl = '';

    xhr.open = function(...args) {
        requestUrl = args[1];
        originalOpen.apply(this, args);
    };

    xhr.addEventListener('load', function() {
        if (xhr.responseText) {
            inspectPayload(xhr.responseText, requestUrl);
        }
    });

    return xhr;
};
