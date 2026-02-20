import diagnostics from './diagnostics.js';

export const bridgeClient = {
    send: (action, data = {}) => {
        return new Promise((resolve) => {
            const isSP = document.documentElement.classList.contains('sidepanel-mode');
            const payload = JSON.stringify({ _zide_msg_: true, source: 'EXTENSION', action, ...data });

            if (isSP) {
                window.parent.postMessage(payload, '*');
                const handler = (e) => {
                    let msg;
                    try {
                        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                    } catch (err) {
                        if (typeof e.data === 'string' && e.data.startsWith('ZIDE_MSG:')) {
                            try { msg = JSON.parse(e.data.substring(9)); } catch (e2) { return; }
                        } else { return; }
                    }

                    if (msg && (msg.source === 'PAGE' || msg.type === 'FROM_PAGE') && msg.action === action) {
                        window.removeEventListener('message', handler);
                        resolve(msg.response);
                    }
                };
                window.addEventListener('message', handler);
            } else {
                if (typeof chrome === "undefined" || !chrome.tabs) {
                    return resolve(null);
                }
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { zide_payload: payload }, (resp) => {
                            resolve(resp);
                        });
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    },
    ping: async () => {
        const resp = await bridgeClient.send('PING');
        if (resp) {
            diagnostics.report('Bridge', 'connected (' + resp.product + ')');
            return true;
        } else {
            diagnostics.report('Bridge', 'disconnected');
            return false;
        }
    }
};

export default bridgeClient;
