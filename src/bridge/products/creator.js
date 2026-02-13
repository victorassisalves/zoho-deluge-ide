export const CreatorConfig = {
    match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
    save: ['input#saveFuncBtn', 'input[elename="saveFunction"]', 'lyte-button[data-zcqa="save"]', '.zc-save-btn', 'button.save-btn'],
    execute: ['input#executeFuncBtn', 'input[elename="executeFunction"]', 'lyte-button[data-zcqa="execute"]', '.zc-execute-btn', 'button.run-btn'],
    getMetadata: () => {
        const pathParts = window.location.pathname.split('/');
        let appIdx = pathParts.indexOf('app');
        const ownerName = window.ZCApp?.ownerName || (appIdx !== -1 ? pathParts[appIdx-1] : pathParts[1]);
        const appName = window.ZCApp?.appName || (appIdx !== -1 ? pathParts[appIdx+1] : pathParts[2]);
        const code = getEditorCode();
        const codeName = extractNameFromCode(code);

        let titleName = document.title.replace(/^\(\d+\)\s*/, '').split(' - ')[0].trim();
        if (titleName.toLowerCase().includes("zoho creator")) titleName = null;

        let functionId = (appName ? appName + ":" : "") + (window.location.hash || 'unknown');
        if (functionId.endsWith('unknown')) {
            const workflowId = document.querySelector('[data-workflowid], [data-id]')?.getAttribute('data-workflowid') || document.querySelector('[data-id]')?.getAttribute('data-id');
            if (workflowId) functionId = (appName ? appName + ":" : "") + workflowId;
        }
        if (functionId.endsWith('unknown') && codeName) {
            functionId = (appName ? appName + ":" : "") + 'name:' + codeName;
        }

        return {
            system: 'Creator',
            orgId: (ownerName || 'global').toLowerCase(),
            functionId: functionId,
            functionName: codeName || document.querySelector('.zc-func-name, .zc-workflow-name')?.innerText || titleName || 'Untitled Creator',
            folder: appName || 'General'
        };
    }
};
