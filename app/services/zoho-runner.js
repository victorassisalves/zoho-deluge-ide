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
    pushToZoho(code, triggerSave = false, triggerExecute = false, contextHash = null) {
        if (!code) return;

        console.log('[ZohoRunner] Syncing with Zoho...', { triggerSave, triggerExecute });

        const payload = { code: code };
        if (contextHash) payload.targetContextHash = contextHash;
        payload.autoFocus = true; // Auto focus on push/save

        if (triggerSave) {
            console.debug('[ZohoRunner] Action: SAVE');
            Bus.send(MSG.CODE_SAVE, payload);
        }

        if (triggerExecute) {
            // Wait slightly to ensure save registers first if both are triggered
            // Given tab transitions, we need a larger delay to ensure Zoho's DOM is ready and the save command succeeds
            const delay = triggerSave ? 1200 : 0;
            setTimeout(() => {
                console.debug('[ZohoRunner] Action: EXECUTE');
                Bus.send(MSG.CODE_EXECUTE, payload);
            }, delay);
        }

        if (!triggerSave && !triggerExecute) {
            console.debug('[ZohoRunner] Action: SET_CODE (No Save/Exec)');
            Bus.send('SET_ZOHO_CODE', payload);
        }
    },

    /**
     * Pull code from the connected Zoho editor
     */
    pullFromZoho(contextHash = null) {
        console.log('[ZohoRunner] Pulling code from Zoho...');
        // We use the standard protocol message
        const payload = {};
        if (contextHash) payload.targetContextHash = contextHash;
        payload.autoFocus = true; // Auto focus on pull
        Bus.send(MSG.CODE_PULL, payload);
    }
};
