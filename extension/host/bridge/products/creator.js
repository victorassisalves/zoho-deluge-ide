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

        // 1. Try hidden input function script value first as it is very reliable for custom functions
        const scriptInput = document.querySelector('input[type="hidden"][elename="functionScript"], input[elename="functionScript"]');
        if (scriptInput) {
             const rawVal = scriptInput.value || scriptInput.getAttribute('value');
             if (rawVal) {
                 functionName = rawVal.split('(')[0].trim();
             }
        }

        // 2. Try the wrapper div
        if (!functionName) {
            const customFunc = document.querySelector('#customFunc');
            if (customFunc) {
                functionName = customFunc.getAttribute('functionname');
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

        // SMART FALLBACK LOGIC: Prevent race conditions
        // If the URL indicates an existing script (edit mode, workflow builder, custom function ID)
        // but we failed to find the function name in the DOM, we are likely still loading.
        const isExistingScript = url.includes('/workflowbuilder/') ||
                               url.includes('/edit') ||
                               url.includes('/customfunctions/') ||
                               /\/[0-9]{10,}\//.test(url); // Has long numeric IDs

        if (!functionName && isExistingScript) {
            return {
                service: 'creator',
                orgId: 'LOADING',
                functionName: 'LOADING'
            };
        }

        const rawFunctionName = functionName || 'Unsaved_Creator_Function';

        return {
            service: 'creator',
            orgId: orgId,
            functionName: sanitizeFileName(rawFunctionName)
        };
    }
};
