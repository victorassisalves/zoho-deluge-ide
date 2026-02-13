import { getZohoProduct } from './detectors.js';
import { getEditorCode, setEditorCode } from './scrapers.js';
import { CRMConfig } from './products/crm.js';
import { CreatorConfig } from './products/creator.js';
import { FlowConfig } from './products/flow.js';
import { BooksConfig } from './products/books.js';
import { GenericConfig } from './products/generic.js';
import { clickBySelectors, clickByText } from './actions/base-actions.js';

console.log('[ZohoIDE Bridge] Modular Bridge Initialized');

const ProductConfigs = {
    crm: CRMConfig,
    creator: CreatorConfig,
    flow: FlowConfig,
    books: BooksConfig,
    generic: GenericConfig
};

function getCurrentConfig() {
    const url = window.location.href;
    for (const [key, config] of Object.entries(ProductConfigs)) {
        if (config.match && config.match(url)) return { name: key, config };
    }
    return { name: 'generic', config: GenericConfig };
}

function triggerAction(type) {
    const { name, config } = getCurrentConfig();
    console.log(`[ZohoIDE Bridge] Triggering ${type} for ${name}`);

    let success = false;
    const selectors = config[type];
    if (selectors && selectors.length > 0) {
        success = clickBySelectors(selectors);
    }

    if (!success) {
        console.log(`[ZohoIDE Bridge] Selector click failed, trying text fallback...`);
        success = clickByText(type);
    }

    return success;
}

window.addEventListener('message', async (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;

    const data = event.data;
    if (!data || data.type !== 'ZOHO_IDE_FROM_EXT') return;

    let response = {};
    const { action, eventId } = data;

    try {
        if (action === 'PING') {
            const { name } = getCurrentConfig();
            response = { status: 'PONG', product: name };
        }
        else if (action === 'GET_ZOHO_CODE') {
            const code = getEditorCode();
            if (code !== null) response = { code };
            else response = { error: 'No code found' };
        }
        else if (action === 'SET_ZOHO_CODE') {
            const success = setEditorCode(data.code);
            response = { success };
        }
        else if (action === 'SAVE_ZOHO_CODE') {
            response = { success: triggerAction('save') };
        }
        else if (action === 'EXECUTE_ZOHO_CODE') {
            response = { success: triggerAction('execute') };
        }
        else if (action === 'GET_ZOHO_METADATA') {
            const { config } = getCurrentConfig();
            if (config.getMetadata) {
                response = config.getMetadata();
            } else {
                response = GenericConfig.getMetadata();
            }
            // Add extra info
            response.url = window.location.href;
            response.title = document.title;
        }
    } catch (e) {
        console.error('[ZohoIDE Bridge] Error handling action:', action, e);
        response = { error: e.message };
    }

    window.postMessage({
        type: 'ZOHO_IDE_FROM_PAGE',
        eventId,
        action,
        response
    }, '*');
});
