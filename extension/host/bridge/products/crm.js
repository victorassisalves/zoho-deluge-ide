export const CRMConfig = {
    match: (url) => url.includes('crm.zoho'),
    save: ['lyte-button[data-zcqa="functionSavev2"]', 'lyte-button[data-zcqa="functionSavev2"] button', '#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn'],
    execute: ['span[data-zcqa="delgv2execPlay"]', '#crmexecute', 'lyte-button[data-id="execute"]'],
    getMeta: () => {
        let orgId = null;
        const url = window.location.href;

        // 1. Try Regex on URL
        const orgMatch = url.match(/\/org(\d+)\//);
        if (orgMatch && orgMatch[1]) {
            orgId = orgMatch[1];
        }

        // 2. Try Global Objects (CRM specific)
        if (!orgId && window.ZCRM && window.ZCRM.CONFIG && window.ZCRM.CONFIG.ORG_ID) {
            orgId = window.ZCRM.CONFIG.ORG_ID;
        }

        // 3. Fallback
        if (!orgId) {
            orgId = window.location.hostname + '_crm';
        }

        let functionName = null;
        // Try to find function name in DOM
        const nameInput = document.querySelector('.function-name-input, input[name="functionName"], #functionName');
        if (nameInput) functionName = nameInput.value;

        if (!functionName) {
            const header = document.querySelector('.function-header, .page-title, #page-title');
            if (header) functionName = header.innerText.trim();
        }

        // Fallback to URL part
        if (!functionName) {
            const parts = url.split('/');
            functionName = parts[parts.length - 1].split('?')[0] || 'unknown_crm_func';
        }

        return {
            service: 'crm',
            orgId: orgId,
            functionName: functionName || `unsaved_${Date.now()}`
        };
    }
};
