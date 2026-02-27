export const CreatorConfig = {
    match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
    save: ['input#saveFuncBtn', 'input[elename="saveFunction"]', 'lyte-button[data-zcqa="save"]', '.zc-save-btn', 'button.save-btn'],
    execute: ['input#executeFuncBtn', 'input[elename="executeFunction"]', 'lyte-button[data-id="execute"]', '.zc-execute-btn', 'button.run-btn'],
    getMeta: () => {
        let orgId = null;
        let functionName = null;
        const url = window.location.href;

        // --- Step 1: Exact Attribute Strategy (Highest Priority) ---

        // Function Name
        // 1. Look for #customFunc attribute
        const customFuncEl = document.querySelector('#customFunc');
        if (customFuncEl) {
            functionName = customFuncEl.getAttribute('functionname');
        }

        // 2. If null, look for input[elename="functionScript"]
        if (!functionName) {
            const funcScriptEl = document.querySelector('input[elename="functionScript"]');
            if (funcScriptEl && funcScriptEl.value) {
                functionName = funcScriptEl.value.replace('()', '');
            }
        }

        // Workspace / Context ID
        // 1. Look for [elename="delugeheader"] attribute
        const delugeHeaderEl = document.querySelector('[elename="delugeheader"]');
        if (delugeHeaderEl) {
            orgId = delugeHeaderEl.getAttribute('applicationid');
        }

        // --- Step 2: The URL Strategy (Secondary Fallback) ---

        // Fallback for orgId
        if (!orgId) {
            // Try Regex for Creator App: /appbuilder/account/appname/
            const match = url.match(/\/appbuilder\/([^\/]+)\/([^\/]+)\//);
            if (match && match[1] && match[2]) {
                orgId = match[1] + '_' + match[2];
            }
        }

        // Fallback for orgId: window.ZC
        if (!orgId && window.ZC && window.ZC.appOwner) {
            orgId = window.ZC.appOwner + '_' + (window.ZC.appLinkName || 'unknown');
        }

        // Final fallback for orgId
        if (!orgId) {
             orgId = window.location.hostname + '_creator';
        }

        // Fallback for functionName (from previous logic)
        if (!functionName) {
             const nameInput = document.querySelector('input[elename="functionName"]');
             if (nameInput) functionName = nameInput.value;
        }

        if (!functionName) {
            // Check for Workflow Name header
            const header = document.querySelector('.workflow-header, .page-header-title');
            if (header) functionName = header.innerText.trim();
        }

        if (!functionName) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('workflowName')) functionName = params.get('workflowName');
        }

        // --- Step 3: Sanitization ---
        let safeName = functionName || 'unsaved_creator_function';

        // Lowercase
        safeName = safeName.toLowerCase();

        // Underscores instead of spaces
        safeName = safeName.replace(/\s+/g, '_');

        // Strictly ends in .dg
        if (!safeName.endsWith('.dg')) {
            safeName += '.dg';
        }

        return {
            service: 'creator',
            orgId: orgId,
            functionName: safeName
        };
    }
};
