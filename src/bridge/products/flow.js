export const FlowConfig = {
    match: (url) => url.includes('flow.zoho'),
    save: ['input[value="Save"].zf-green-btn.zf-mw-btn', 'input[value="Save"]', '.zf-green-btn', '.zf-mw-btn'],
    execute: ['input[value="Execute"].zf-btn-outline.zf-green-o-btn.zf-mw-btn', 'input[value="Execute"]', '.zf-green-o-btn']
};
