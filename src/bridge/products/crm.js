export const CRMConfig = {
    match: (url) => url.includes('crm.zoho'),
    save: ['#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn', 'input[value="Save"]'],
    execute: ['#crmexecute', 'lyte-button[data-id="execute"]']
};
