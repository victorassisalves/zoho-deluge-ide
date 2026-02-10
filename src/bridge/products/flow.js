export const FlowConfig = {
    match: (url) => url.includes('flow.zoho'),
    save: ['input[value="Save"].zf-green-btn', 'input[value="Save"]', '.zf-green-btn'],
    execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]']
};
