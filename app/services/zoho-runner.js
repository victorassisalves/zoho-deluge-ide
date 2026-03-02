// app/services/zoho-runner.js
import { Bus } from '../core/bus.js';
import { MSG } from '../../shared/protocol.js';

export const ZohoRunner = {
    /**
     * Push code to Zoho and optionally Save or Execute
     * @param {string} code - The Deluge code
     * @param {number|null} targetTabId - The Chrome tabId to push to (if null, background script attempts fallback)
     * @param {boolean} triggerSave - Whether to trigger the Save button
     * @param {boolean} triggerExecute - Whether to trigger the Execute button
     */
    pushToZoho(code, targetTabId = null, triggerSave = false, triggerExecute = false) {
        if (!code) return;

        console.log(`[ZohoRunner] Syncing with Zoho Tab ID: ${targetTabId}...`, { triggerSave, triggerExecute });

        if (triggerSave) {
            console.debug('[ZohoRunner] Action: SAVE');
            Bus.send(MSG.CODE_SAVE, { code: code, targetTabId });
        }

        if (triggerExecute) {
            // Wait slightly to ensure save registers first if both are triggered
            const delay = triggerSave ? 500 : 0;
            setTimeout(() => {
                console.debug('[ZohoRunner] Action: EXECUTE');
                Bus.send(MSG.CODE_EXECUTE, { code: code, targetTabId });
            }, delay);
        }

        if (!triggerSave && !triggerExecute) {
            console.debug('[ZohoRunner] Action: SET_CODE (No Save/Exec)');
            Bus.send('SET_ZOHO_CODE', { code: code, targetTabId });
        }
    },

    /**
     * Pull code from the connected Zoho editor
     * @param {number|null} targetTabId - The Chrome tabId to pull from
     */
    pullFromZoho(targetTabId = null) {
        console.log(`[ZohoRunner] Pulling code from Zoho Tab ID: ${targetTabId}...`);
        // We use the standard protocol message
        Bus.send(MSG.CODE_PULL, { targetTabId });
    }
};
