// app/services/zoho-runner.js
import { Bus } from '../core/bus.js';
import { MSG } from '../../shared/protocol.js';

export const ZohoRunner = {
    /**
     * Push code to Zoho and optionally Save or Execute
     * @param {string} code - The Deluge code
     * @param {boolean} triggerSave - Whether to trigger the Save button
     * @param {boolean} triggerExecute - Whether to trigger the Execute button
     */
    pushToZoho(code, triggerSave = false, triggerExecute = false) {
        if (!code) return;

        console.log('[ZohoRunner] Syncing with Zoho...', { triggerSave, triggerExecute });

        if (triggerExecute) {
            console.debug('[ZohoRunner] Action: EXECUTE');
            Bus.send(MSG.CODE_EXECUTE, { code: code });
        } else if (triggerSave) {
            console.debug('[ZohoRunner] Action: SAVE');
            Bus.send(MSG.CODE_SAVE, { code: code });
        } else {
            console.debug('[ZohoRunner] Action: SET_CODE (No Save/Exec)');
            Bus.send('SET_ZOHO_CODE', { code: code });
        }
    },

    /**
     * Pull code from the connected Zoho editor
     */
    pullFromZoho() {
        console.log('[ZohoRunner] Pulling code from Zoho...');
        Bus.send(MSG.CODE_PULL);
    }
};
