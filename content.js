// Content script to interact with Zoho Deluge editors
console.log('[ZohoIDE] Content script loaded');

// 1. Inject the modular bridge
if (!document.getElementById('zoho-deluge-bridge-modular')) {
    const s = document.createElement('script');
    s.id = 'zoho-deluge-bridge-modular';
    s.type = 'module';
    s.src = chrome.runtime.getURL('src/bridge/main.js');
    (document.head || document.documentElement).appendChild(s);
}

// 2. Relay messages between Extension and Bridge
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // If it's a modular payload, relay it to the page
    if (request.zide_payload) {
        window.postMessage(request.zide_payload, '*');

        const handler = (event) => {
            if (typeof event.data !== 'string' || !event.data.startsWith('ZIDE_MSG:')) return;
            try {
                const data = JSON.parse(event.data.substring(9));
                if (data && data.source === 'PAGE') {
                    window.removeEventListener('message', handler);
                    sendResponse(data.response);
                }
            } catch (e) {}
        };
        window.addEventListener('message', handler);
        return true; // Keep channel open
    }

    // Traditional actions (for backward compatibility during transition)
    if (['GET_ZOHO_CODE', 'SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE'].includes(request.action)) {
        // Relay via traditional bridge.js if needed, or use the modular bridge
        // For now, let's stick to the modular bridge for these too
        const payload = 'ZIDE_MSG:' + JSON.stringify({ source: 'EXTENSION', action: request.action, ...request });
        window.postMessage(payload, '*');

        const handler = (event) => {
            if (typeof event.data !== 'string' || !event.data.startsWith('ZIDE_MSG:')) return;
            try {
                const data = JSON.parse(event.data.substring(9));
                if (data && data.source === 'PAGE' && data.action === request.action) {
                    window.removeEventListener('message', handler);
                    sendResponse(data.response);
                }
            } catch (e) {}
        };
        window.addEventListener('message', handler);
        return true;
    }

    if (request.action === 'INJECT_SIDE_PANEL') {
        if (window === window.top) {
            injectSidePanel();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Not top frame' });
        }
        return false;
    }
});

function injectSidePanel() {
    const existing = document.getElementById('zoho-ide-panel-container');
    if (existing) {
        existing.style.display = 'flex';
        return;
    }

    console.log('[ZohoIDE] Injecting Side Panel');

    const container = document.createElement('div');
    container.id = 'zoho-ide-panel-container';
    container.style.cssText = 'position:fixed; top:0; right:0; width:500px; height:100vh; z-index:2147483647; background:#1e1e1e; box-shadow:-5px 0 15px rgba(0,0,0,0.5); display:flex; flex-direction:row;';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('ide.html?mode=sidepanel');
    iframe.style.cssText = 'flex:1; border:none; height:100%; width:100%;';

    const closeBtn = document.createElement('div');
    closeBtn.innerText = '×';
    closeBtn.style.cssText = 'position:absolute; left:-35px; top:20px; width:35px; height:35px; background:#0067ff; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:24px; border-radius:6px 0 0 6px;';
    closeBtn.onclick = () => { container.style.display = 'none'; };

    container.appendChild(iframe);
    container.appendChild(closeBtn);
    document.body.appendChild(container);
}
