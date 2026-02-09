// Content script to interact with Zoho Deluge editors
console.log('[ZohoIDE] Content script loaded in frame:', window.location.href);

if (!document.getElementById('zoho-deluge-bridge')) {
    const script = document.createElement('script');
    script.id = 'zoho-deluge-bridge';
    script.type = 'module';
    script.src = chrome.runtime.getURL('src/bridge/main.js');
    (document.head || document.documentElement).appendChild(script);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (['GET_ZOHO_CODE', 'SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE'].includes(request.action)) {
        window.postMessage(JSON.stringify({ zide_type: 'FROM_EXTENSION', ...request }), '*');

        let timeout;
        const handler = (event) => {
            let data;
            try {
                data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            } catch (e) { return; }

            if (data && data.zide_type === 'FROM_PAGE' && data.action === request.action) {
                clearTimeout(timeout);
                window.removeEventListener('message', handler);
                sendResponse(data.response);
            }
        };
        window.addEventListener('message', handler);
        timeout = setTimeout(() => {
            window.removeEventListener('message', handler);
            if (window === window.top) sendResponse({ error: 'Timeout' });
        }, 1500);
        return true;
    }

    if (request.action === 'INJECT_SIDE_PANEL') {
        if (window === window.top) {
            injectSidePanel();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
        return false;
    }
});

window.addEventListener('message', (event) => {
    let data;
    try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) { return; }

    if (data && data.zide_type === 'FROM_PAGE' && data.action === 'ZOHO_CONSOLE_UPDATE') {
        chrome.runtime.sendMessage({ action: 'ZOHO_CONSOLE_UPDATE', data: data.data });
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

    const closeBtn = document.createElement('div');
    closeBtn.innerText = '×';
    closeBtn.style.cssText = 'position:absolute; left:-35px; top:20px; width:35px; height:35px; background:#0067ff; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:24px; border-radius:6px 0 0 6px;';
    closeBtn.onclick = () => container.style.display = 'none';

    container.appendChild(iframe);
    container.appendChild(closeBtn);
    document.body.appendChild(container);
}
