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

        if (!orgId) {
             orgId = window.location.hostname + '_creator';
        }

        let functionName = null;
        // Function Name logic
        const nameInput = document.querySelector('input[elename="functionName"]');
        if (nameInput) functionName = nameInput.value;

        if (!functionName) {
            // Check for Workflow Name header
            const header = document.querySelector('.workflow-header, .page-header-title');
            if (header) functionName = header.innerText.trim();
        }

        if (!functionName) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('workflowName')) functionName = params.get('workflowName');
        }

        return {
            service: 'creator',
            orgId: orgId,
            functionName: functionName || `unsaved_creator_${Date.now()}`
        };
    }
};
