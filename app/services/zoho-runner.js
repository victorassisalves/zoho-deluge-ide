// app/services/zoho-runner.js
import { Bus } from '../core/bus.js';
import { MSG } from '../../shared/protocol.js';

export const ZohoRunner = {
    /**
     * Push code to Zoho and optionally Save or Execute
     * @param {string} code - The Deluge code
     * @param {boolean} triggerSave - Whether to trigger the Save button
     * @param {boolean} triggerExecute - Whether to trigger the Execute button
     * @param {string} chromeTabId - The explicit chrome tab id
     */
    pushToZoho(code, triggerSave = false, triggerExecute = false, chromeTabId = null, fileId = null) {
        if (!code) return;

        console.log('[ZohoRunner] Syncing with Zoho...', { triggerSave, triggerExecute, chromeTabId });

        if (!chromeTabId) {
             console.warn('[ZohoRunner] No chromeTabId provided. Push aborted.');
             Bus.EVENTS && Bus.send(Bus.EVENTS.UI_UPDATE, { type: 'toast', message: 'Target tab orphaned. Link a tab first.' });
             return;
        }

        const payload = { chromeTabId, fileId, code };

        if (triggerSave) {
            console.debug('[ZohoRunner] Action: SAVE');
            Bus.send('EXECUTE_DOM_ACTION', { ...payload, action: MSG.CODE_SAVE });
        }

        if (triggerExecute) {
            // Wait slightly to ensure save registers first if both are triggered
            const delay = triggerSave ? 500 : 0;
            setTimeout(() => {
                console.debug('[ZohoRunner] Action: EXECUTE');
                Bus.send('EXECUTE_DOM_ACTION', { ...payload, action: MSG.CODE_EXECUTE });
            }, delay);
        }

        if (!triggerSave && !triggerExecute) {
            console.debug('[ZohoRunner] Action: SET_CODE (No Save/Exec)');
            Bus.send('EXECUTE_DOM_ACTION', { ...payload, action: 'SET_ZOHO_CODE' });
        }
    },

    /**
     * Pull code from the connected Zoho editor
     * @param {string} chromeTabId - The explicit chrome tab id
     */
    pullFromZoho(chromeTabId = null, fileId = null) {
        console.log('[ZohoRunner] Pulling code from Zoho...');

        if (!chromeTabId) {
             console.warn('[ZohoRunner] No chromeTabId provided. Pull aborted.');
             Bus.EVENTS && Bus.send(Bus.EVENTS.UI_UPDATE, { type: 'toast', message: 'Target tab orphaned. Link a tab first.' });
             return;
        }

        Bus.send('EXECUTE_DOM_ACTION', { chromeTabId, fileId, action: MSG.CODE_PULL });
    }
};
