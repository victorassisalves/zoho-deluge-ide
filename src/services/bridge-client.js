import diagnostics from './diagnostics.js';

export const bridgeClient = {
    send: (action, data = {}) => {
        return new Promise((resolve) => {
            const isSP = document.documentElement.classList.contains('sidepanel-mode');
            const payload = 'ZIDE_MSG:' + JSON.stringify({ source: 'EXTENSION', action, ...data });

            if (isSP) {
                window.parent.postMessage(payload, '*');
                const handler = (e) => {
                    if (typeof e.data !== 'string' || !e.data.startsWith('ZIDE_MSG:')) return;
                    try {
                        const msg = JSON.parse(e.data.substring(9));
                        if (msg.source === 'PAGE' && msg.action === action) {
                            window.removeEventListener('message', handler);
                            resolve(msg.response);
                        }
                    } catch (err) {}
                };
                window.addEventListener('message', handler);
            } else {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { zide_payload: payload }, (resp) => {
                            resolve(resp);
                        });
                    }
                });
            }
        });
    },
    ping: async () => {
        const resp = await bridgeClient.send('PING');
        diagnostics.report('Bridge', resp ? 'connected (' + resp.product + ')' : 'disconnected');
        return !!resp;
    }
};

export default bridgeClient;
