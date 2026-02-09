console.log('[ZohoIDE] Content Script Loaded');

if (!document.getElementById('zoho-deluge-bridge')) {
    const script = document.createElement('script');
    script.id = 'zoho-deluge-bridge';
    script.src = chrome.runtime.getURL('bridge.js');
    (document.head || document.documentElement).appendChild(script);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (['GET_ZOHO_CODE', 'SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE'].includes(request.action)) {
        window.postMessage('ZIDE_MSG:' + JSON.stringify({ zide_source: 'EXTENSION', ...request }), '*');

        let timeout;
        const handler = (event) => {
            if (typeof event.data !== 'string' || !event.data.startsWith('ZIDE_MSG:')) return;
            try {
                const data = JSON.parse(event.data.substring(9));
                if (data.zide_source === 'PAGE' && data.action === request.action) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    sendResponse(data.response);
                }
            } catch (e) {}
        };
        window.addEventListener('message', handler);
        timeout = setTimeout(() => {
            window.removeEventListener('message', handler);
            if (window === window.top) sendResponse({ error: 'Timeout' });
        }, 2000);
        return true;
    }

    if (request.action === 'INJECT_SIDE_PANEL') {
        if (window === window.top) {
            injectSidePanel();
            sendResponse({ success: true });
        }
        return false;
    }
});

function injectSidePanel() {
    if (document.getElementById('zoho-ide-panel-container')) {
        document.getElementById('zoho-ide-panel-container').style.display = 'flex';
        return;
    }
    const container = document.createElement('div');
    container.id = 'zoho-ide-panel-container';
    container.style.cssText = 'position:fixed; top:0; right:0; width:500px; height:100vh; z-index:2147483647; background:#1e1e1e; display:flex;';
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('ide.html?mode=sidepanel');
    iframe.style.cssText = 'flex:1; border:none; height:100%;';
    container.appendChild(iframe);
    document.body.appendChild(container);
}
