export const CreatorConfig = {
    match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
    save: ['lyte-button[data-zcqa="save"]', 'lyte-button[data-zcqa="update"]', 'lyte-button[data-id="save"]', '.zc-save-btn', '.zc-update-btn', 'button.save-btn'],
    execute: ['lyte-button[data-zcqa="execute"]', 'lyte-button[data-zcqa="run"]', 'span[data-zcqa="delgv2execPlay"]', '.zc-execute-btn', 'button.run-btn']
};
