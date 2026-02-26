export const FlowConfig = {
    match: (url) => url.includes('flow.zoho'),
    save: ['input[value="Save"].zf-green-btn', 'input[value="Save"]'],
    execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]'],
    getMeta: () => {
        let orgId = null;
        // Org Logic
        const params = new URLSearchParams(window.location.search);
        if (params.get('orgId')) {
            orgId = params.get('orgId');
        }

        if (!orgId) {
            orgId = window.location.hostname + '_flow';
        }

        let functionName = null;
        // Function Name logic
        const nameInput = document.querySelector('.function-name, input.zf-input-box');
        if (nameInput) functionName = nameInput.value;

        if (!functionName) {
            const header = document.querySelector('.flow-name, .zf-header-title');
            if (header) functionName = header.innerText.trim();
        }

        if (!functionName) {
            const parts = window.location.pathname.split('/');
            functionName = parts[parts.length - 1] || 'unknown_flow_func';
        }

        return {
            service: 'flow',
            orgId: orgId,
            functionName: functionName || `unsaved_flow_${Date.now()}`
        };
    }
};
