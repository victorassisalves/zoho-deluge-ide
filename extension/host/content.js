// Content script to interact with Zoho Deluge editors
console.log('[ZohoIDE] Host content script loaded');

let MSG; // Will be loaded dynamically

// 1. Inject the modular bridge
function injectBridge() {
    if (document.getElementById('zoho-deluge-bridge-modular')) return;
    const s = document.createElement('script');
    s.id = 'zoho-deluge-bridge-modular';
    s.src = chrome.runtime.getURL('extension/host/bridge.bundle.js');
    const target = document.head || document.documentElement;
    if (target) {
        target.appendChild(s);
        console.log('[ZohoIDE] Bridge injected from extension/host/');
    }
}

// Initial injection
injectBridge();

// Retry injection if needed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBridge);
}
window.addEventListener('load', injectBridge);

// Load Protocol
(async () => {
    try {
        const protocolModule = await import(chrome.runtime.getURL('shared/protocol.js'));
        MSG = protocolModule.MSG;
        console.log('[ZohoIDE] Protocol loaded in Host');
    } catch (e) {
        console.error('[ZohoIDE] Failed to load protocol:', e);
    }
})();

// 2. Listen for messages from the extension (Background -> Content)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Immediate actions that don't need relay
    if (request.action === 'INJECT_SIDE_PANEL') {
        if (window === window.top) {
            injectSidePanel();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Not top frame' });
        }
        return false;
    }

    // Actions to relay to the bridge using CustomEvent to avoid Zoho's onmessage listeners
    const relayActions = ['GET_ZOHO_CODE', 'SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE', 'PING'];
    if (relayActions.includes(request.action)) {
        relayToBridge(request.action, request, sendResponse);
        return true; // Keep channel open
    }
});

// 3. Listen for messages from the Client (Iframe -> Content)
window.addEventListener('message', (event) => {
    if (!MSG) return; // Protocol not loaded yet

    // Handle Client requests
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === MSG.CODE_EXECUTE) {
        console.log('[ZohoIDE] Host received EXECUTE command from Client');
        if (data.code) {
            relayToBridge('SET_ZOHO_CODE', { code: data.code }, (res) => {
                 if (res && res.success) {
                     relayToBridge('SAVE_ZOHO_CODE', {}, (saveRes) => {
                        // Wait a bit for save to process before execute?
                        setTimeout(() => {
                            relayToBridge('EXECUTE_ZOHO_CODE', {}, (response) => {});
                        }, 500);
                     });
                 }
            });
        } else {
            relayToBridge('EXECUTE_ZOHO_CODE', {}, (response) => {});
        }
    } else if (data.type === MSG.CODE_SAVE) {
        console.log('[ZohoIDE] Host received SAVE command from Client');
        if (data.code) {
            relayToBridge('SET_ZOHO_CODE', { code: data.code }, (res) => {
                 if (res && res.success) {
                     relayToBridge('SAVE_ZOHO_CODE', {}, (response) => {});
                 }
            });
        } else {
            relayToBridge('SAVE_ZOHO_CODE', {}, (response) => {});
        }
    }
});


function relayToBridge(action, data, sendResponse) {
    const eventId = Math.random().toString(36).substring(2);
    const detail = {
        eventId,
        action: action,
        ...data
    };

    const responseHandler = (event) => {
        const data = event.detail;
        if (data && data.eventId === eventId) {
            window.removeEventListener('ZOHO_IDE_FROM_PAGE', responseHandler);
            if (sendResponse) sendResponse(data.response);
        }
    };

    window.addEventListener('ZOHO_IDE_FROM_PAGE', responseHandler);

    // Dispatch to bridge
    window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_EXT', { detail }));

    // Timeout if no response
    setTimeout(() => {
        window.removeEventListener('ZOHO_IDE_FROM_PAGE', responseHandler);
    }, 5000);
}

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
    iframe.src = chrome.runtime.getURL('app/index.html?mode=sidepanel');
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
