// Content script to interact with Zoho Deluge editors
console.log('[ZohoIDE] Content script loaded');

// 1. Inject the modular bridge
if (!document.getElementById('zoho-deluge-bridge-modular')) {
    const s = document.createElement('script');
    s.id = 'zoho-deluge-bridge-modular';
    s.src = chrome.runtime.getURL('bridge.js'); // Re-using legacy bridge but updated with protocol support
    (document.head || document.documentElement).appendChild(s);
}

// 2. Relay messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

    if (request.action === 'INJECT_SIDE_PANEL') {
        if (window === window.top) {
            injectSidePanel();
            sendResponse({ success: true });
        }
        return false;
    }
    return true; // Keep channel open
});

function injectSidePanel() {
    if (document.getElementById('zoho-ide-panel-container')) {
        document.getElementById('zoho-ide-panel-container').style.display = 'flex';
        return;
    }

    const container = document.createElement('div');
    container.id = 'zoho-ide-panel-container';
    container.style.cssText = 'position:fixed; top:0; right:0; width:500px; height:100vh; z-index:2147483647; background:#1e1e1e; box-shadow:-5px 0 15px rgba(0,0,0,0.5); display:flex; flex-direction:row;';

    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = 'width:8px; cursor:ew-resize; background:#333; height:100%; transition:background 0.2s; flex-shrink:0; display:flex; align-items:center; justify-content:center;';
    resizeHandle.innerHTML = '<div style="width:2px; height:20px; background:#666; border-radius:1px;"></div>';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('ide.html?mode=sidepanel');
    iframe.style.cssText = 'flex:1; border:none; height:100%; width:100%;';

    const closeBtn = document.createElement('div');
    closeBtn.innerText = '×';
    closeBtn.style.cssText = 'position:absolute; left:-35px; top:20px; width:35px; height:35px; background:#0067ff; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:24px; border-radius:6px 0 0 6px; box-shadow:-2px 2px 5px rgba(0,0,0,0.3);';
    closeBtn.onclick = () => { container.style.display = 'none'; };

    container.appendChild(resizeHandle);
    container.appendChild(iframe);
    container.appendChild(closeBtn);
    document.body.appendChild(container);

    // Resizing logic
    let isResizing = false;
    let startX, startWidth;

    resizeHandle.onmousedown = (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = container.offsetWidth;
        document.body.style.userSelect = 'none';
        iframe.style.pointerEvents = 'none';
    };

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const width = startWidth + (startX - e.clientX);
        if (width > 300 && width < window.innerWidth * 0.9) {
            container.style.width = width + 'px';
        }
    });

    window.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = 'auto';
            iframe.style.pointerEvents = 'auto';
        }
    });
}
