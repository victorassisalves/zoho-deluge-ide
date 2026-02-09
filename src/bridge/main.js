import { getZohoProduct } from './detectors.js';
import { getEditorCode } from './scrapers.js';

console.log('[ZohoIDE] Bridge Module Loaded');

window.addEventListener('message', (e) => {
    if (typeof e.data !== 'string' || !e.data.startsWith('ZIDE_MSG:')) return;
    try {
        const msg = JSON.parse(e.data.substring(9));
        if (msg.source !== 'EXTENSION') return;

        let resp = {};
        if (msg.action === 'PING') {
            resp = { status: 'PONG', product: getZohoProduct() };
        } else if (msg.action === 'GET_CODE') {
            resp = { code: getEditorCode() };
        }

        window.postMessage('ZIDE_MSG:' + JSON.stringify({
            source: 'PAGE',
            action: msg.action,
            response: resp
        }), '*');
    } catch (err) {}
});
