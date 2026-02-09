import { clickBySelectors } from './base-actions.js';

export const crmSelectors = {
    save: ['#crmsave', 'lyte-button[data-zcqa="functionSavev2"]', '.crm-save-btn'],
    execute: ['#crmexecute', 'span[data-zcqa="delgv2execPlay"]', '.dx_execute_icon']
};

export function triggerCrmAction(type) {
    return clickBySelectors(crmSelectors[type]);
}
