console.log('[ZohoIDE] Content Script Active');

if (!document.getElementById('zoho-deluge-bridge-modular')) {
    const s = document.createElement('script');
    s.id = 'zoho-deluge-bridge-modular';
    s.type = 'module';
    s.src = chrome.runtime.getURL('src/bridge/main.js');
    (document.head || document.documentElement).appendChild(s);
}

chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
    if (req.zide_payload) {
        window.postMessage(req.zide_payload, '*');
        const handler = (e) => {
            if (typeof e.data !== 'string' || !e.data.startsWith('ZIDE_MSG:')) return;
            try {
                const msg = JSON.parse(e.data.substring(9));
                if (msg.source === 'PAGE') {
                    window.removeEventListener('message', handler);
                    sendResp(msg.response);
                }
            } catch (err) {}
        };
        window.addEventListener('message', handler);
        return true;
    }
    if (req.action === 'INJECT_SIDE_PANEL') {
        // ... same inject logic
        sendResp({ success: true });
    }
});

function injectSidePanel() {
    if (document.getElementById('zoho-ide-panel-container')) return;
    const c = document.createElement('div');
    c.id = 'zoho-ide-panel-container';
    c.style.cssText = 'position:fixed;top:0;right:0;width:500px;height:100vh;z-index:2147483647;background:#1e1e1e;display:flex;';
    const f = document.createElement('iframe');
    f.src = chrome.runtime.getURL('ide.html?mode=sidepanel');
    f.style.cssText = 'flex:1;border:none;height:100%;';
    c.appendChild(f);
    document.body.appendChild(c);
}
