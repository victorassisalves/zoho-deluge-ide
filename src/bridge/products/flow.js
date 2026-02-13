export const FlowConfig = {
    match: (url) => url.includes('flow.zoho'),
    save: ['input[value="Save"].zf-green-btn', 'input[value="Save"]'],
    execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]'],
    getMetadata: () => {
        const url = window.location.href;
        const pathParts = window.location.pathname.split('/');
        const flowId = url.split('/flow/')[1]?.split('/')[0];
        const code = getEditorCode();
        const codeName = extractNameFromCode(code);

        let orgName = window.zf_org_id || 'global';
        if (pathParts[1] === 'flow' && pathParts[2] && isNaN(pathParts[2])) {
            orgName = pathParts[2];
        }

        return {
            system: 'Flow',
            orgId: orgName.toString().toLowerCase(),
            functionId: flowId || 'unknown',
            functionName: codeName || document.querySelector('.zf-flow-name')?.innerText || 'Untitled Flow',
            folder: 'My Flows'
        };
    }
};
