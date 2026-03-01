const sanitizeFileName = (name) => {
    if (!name) return 'unsaved_creator_function.dg';

    // Convert to lowercase
    let sanitized = name.toLowerCase();

    // Replace spaces and hyphens with underscores
    sanitized = sanitized.replace(/[\s-]/g, '_');

    // Strip all non-alphanumeric characters (except underscores)
    sanitized = sanitized.replace(/[^a-z0-9_]/g, '');

    // If it's empty after sanitization, return default
    if (!sanitized) return 'unsaved_creator_function.dg';

    // Append .dg
    return sanitized + '.dg';
};

export const CreatorConfig = {
    match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
    save: ['input#saveFuncBtn', 'input[elename="saveFunction"]', 'lyte-button[data-zcqa="save"]', '.zc-save-btn', 'button.save-btn'],
    execute: ['input#executeFuncBtn', 'input[elename="executeFunction"]', 'lyte-button[data-id="execute"]', '.zc-execute-btn', 'button.run-btn'],
    getMeta: () => {
        let orgId = null;
        const url = window.location.href;

        // Try Regex for Creator App: /appbuilder/account/appname/
        const match = url.match(/\/appbuilder\/([^\/]+)\/([^\/]+)\//);
        if (match && match[1] && match[2]) {
            orgId = match[1] + '_' + match[2];
        }

        // Fallback: window.ZC
        if (!orgId && window.ZC && window.ZC.appOwner) {
            orgId = window.ZC.appOwner + '_' + (window.ZC.appLinkName || 'unknown');
        }

        // Exact Attribute Strategy (Secondary Fallback for orgId)
        if (!orgId) {
            const delugeHeader = document.querySelector('[elename="delugeheader"]');
            if (delugeHeader) {
                const appId = delugeHeader.getAttribute('applicationid');
                if (appId) {
                    orgId = 'app_' + appId;
                }
            }
        }

        if (!orgId) {
             orgId = window.location.hostname + '_creator';
        }

        let functionName = null;

        // Exact Attribute Strategy (Highest Priority)
        const customFunc = document.querySelector('#customFunc');
        if (customFunc) {
            functionName = customFunc.getAttribute('functionname');
        }

        if (!functionName) {
            const scriptInput = document.querySelector('input[elename="functionScript"]');
            if (scriptInput && scriptInput.value) {
                functionName = scriptInput.value.split('(')[0].trim();
            }
        }

        // URL Strategy (Secondary Fallback)
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

        const rawFunctionName = functionName || 'Unsaved_Creator_Function';

        return {
            service: 'creator',
            orgId: orgId,
            functionName: sanitizeFileName(rawFunctionName)
        };
    }
};
