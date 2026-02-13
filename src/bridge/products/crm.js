export const CRMConfig = {
    match: (url) => url.includes('crm.zoho'),
    save: ['lyte-button[data-zcqa="functionSavev2"]', 'lyte-button[data-zcqa="functionSavev2"] button', '#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn'],
    execute: ['span[data-zcqa="delgv2execPlay"]', '#crmexecute', 'lyte-button[data-id="execute"]'],
    getMetadata: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/');
        // Note: getEditorCode and extractNameFromCode come from scrapers.js (shared scope)
        const code = getEditorCode();
        const codeName = extractNameFromCode(code);

        let orgName = window.ZCRMSession?.orgName || window.ZCRMSession?.orgId || 'global';
        if (pathParts[1] === 'crm') {
            if (pathParts[2] && pathParts[2] !== 'org') orgName = pathParts[2];
            else if (pathParts[2] === 'org' && pathParts[3]) orgName = pathParts[3];
        }

        let titleName = document.title.replace(/Zoho CRM - |Functions - |Zoho - |CRM - /g, '').replace(/-/g, '').trim();
        if (titleName === "" || titleName === "Zoho CRM") titleName = null;

        let functionId = urlParams.get('id') || urlParams.get('wfId') || window.location.href.match(/edit\/(\d+)/)?.[1] || window.location.href.split('id/')[1]?.split('/')[0] || 'unknown';
        if (functionId === 'unknown') {
            const scriptEl = document.querySelector('[id*="scriptId"], [name*="scriptId"], input[name="id"], input#id, input#funcId');
            if (scriptEl) functionId = scriptEl.value || scriptEl.innerText;
        }
        if (functionId === 'unknown' && window.ZCRMSession?.functionId) functionId = window.ZCRMSession.functionId;

        // Advanced Name Detection
        const nameSelectors = [
            '.custom_fn_name', '[data-zcqa="function-name"]', '.fnName', '.fn_name', '#function_name',
            '.bread-crumb-current', '.lyteBreadcrumbItem.active', '.crm-fn-name'
        ];
        let domName = null;
        for (const sel of nameSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) { domName = el.innerText.trim(); break; }
        }

        const finalName = codeName || domName || titleName || 'Untitled CRM';

        if (functionId === 'unknown' && finalName !== 'Untitled CRM') {
            functionId = 'name:' + finalName;
        }

        return {
            system: 'CRM',
            orgId: orgName.toString().toLowerCase(),
            functionId: functionId,
            functionName: finalName,
            folder: document.querySelector('.breadcrumb-item.active, .lyteBreadcrumbItem.active')?.innerText || 'Functions'
        };
    }
};
