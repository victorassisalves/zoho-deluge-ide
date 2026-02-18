import { MSG } from '../../shared/protocol.js';

export const ZohoRunner = {
    execute: (code) => {
        // Send execute command
        window.Bus.send(MSG.CODE_EXECUTE, { code });
        console.log('[ZohoRunner] Sent Execute command');
    },

    save: (code) => {
        // Send save command
        window.Bus.send(MSG.CODE_SAVE, { code });
        console.log('[ZohoRunner] Sent Save command');
    },

    pull: () => {
        // Send pull command
        window.Bus.send(MSG.CODE_PULL);
        console.log('[ZohoRunner] Sent Pull command');
    }
};

window.ZohoRunner = ZohoRunner;
