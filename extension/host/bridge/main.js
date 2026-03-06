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

    // console.log('[Bridge] Received:', data.action, data);

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

// --- THE ZIDE PASSIVE WIRETAP (PAYLOAD FINGERPRINTING) ---
// This intercepts network requests passively to extract schemas without triggering security blocks.

(function initializeWiretap() {
    if (window._zideWiretapInitialized) return;
    window._zideWiretapInitialized = true;

    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        // 1. Let the original request proceed normally
        const response = await originalFetch.apply(this, args);

        try {
            // 2. Clone the stream so we don't consume Zoho's data
            const clone = response.clone();

            clone.json().then(json => {
                if (!json) return;

                // FINGERPRINT A: CREATOR METADATA
                if (json.apps && typeof json.apps === 'object') {
                    const appKeys = Object.keys(json.apps);
                    if (appKeys.length > 0 && json.apps[appKeys[0]].forms) {
                        console.log("🟢 [ZIDE] Creator Schema Intercepted via Wiretap!");
                        // Beam it across the void to the Content Script
                        window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
                            detail: {
                                action: 'METADATA_INTERCEPTED',
                                product: 'creator',
                                payload: json
                            }
                        }));
                    }
                }

                // FINGERPRINT B: CRM METADATA (Future-proofing)
                if (json.functions && Array.isArray(json.functions) && json.functions[0].workflow) {
                    console.log("🟢 [ZIDE] CRM Function Intercepted via Wiretap!");
                    window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
                        detail: {
                            action: 'METADATA_INTERCEPTED',
                            product: 'crm',
                            payload: json
                        }
                    }));
                }
            }).catch(e => {
                // Silently ignore non-JSON responses (HTML/CSS/Images)
            });
        } catch (err) {
            console.error("[ZIDE] Wiretap Error:", err);
        }

        // 3. Return the untouched original response to Zoho
        return response;
    };
})();
