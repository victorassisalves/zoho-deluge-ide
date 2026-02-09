// Content script to interact with Zoho Deluge editors
// Handles bridge between extension context and page context (Main World)

console.log('[ZohoIDE] Content script loaded in frame:', window.location.href);

// 1. Inject the bridge script
if (!document.getElementById('zoho-deluge-bridge')) {
    const script = document.createElement('script');
    script.id = 'zoho-deluge-bridge';
    script.type = 'module'; script.src = chrome.runtime.getURL('src/bridge/main.js');
    (document.head || document.documentElement).appendChild(script);
}

// 2. Listen for messages from the extension (IDE -> Background -> Content)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (['GET_ZOHO_CODE', 'SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE'].includes(request.action)) {
        // Relay to bridge
        window.postMessage({ type: 'FROM_EXTENSION', ...request }, '*');

        // Wait for response from bridge
        let timeout;
        const handler = (event) => {
            if (event.data && event.data.type === 'FROM_PAGE' && event.data.action === request.action) {
                clearTimeout(timeout);
                window.removeEventListener('message', handler);

                const response = event.data.response;
                if (response && (response.code !== undefined || response.success)) {
                    // Success! Respond immediately
                    sendResponse(response);
                } else {
                    // No editor in this frame.
                    // If we are top frame, wait a bit to let other frames respond first.
                    if (window === window.top) {
                        setTimeout(() => {
                            try { sendResponse({ error: 'No editor found in any frame' }); } catch(e) {}
                        }, 1000);
                    } else {
                        // Subframe found nothing, just stay silent
                    }
                }
            }
        };
        window.addEventListener('message', handler);

        timeout = setTimeout(() => {
            window.removeEventListener('message', handler);
            if (window === window.top) {
                try { sendResponse({ error: 'Timeout waiting for editor' }); } catch(e) {}
            }
        }, 1500);

        return true; // Keep channel open
    }

    if (request.action === 'INJECT_SIDE_PANEL') {
        if (window === window.top) {
            injectSidePanel();
            sendResponse({ success: true });
        } else {
            // Not top frame, don't respond or respond false
            sendResponse({ success: false, error: 'Not top frame' });
        }
        return false;
    }
});

// 3. Listen for unsolicited messages from bridge (e.g. console updates)
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FROM_PAGE' && event.data.action === 'ZOHO_CONSOLE_UPDATE') {
        chrome.runtime.sendMessage({ action: 'ZOHO_CONSOLE_UPDATE', data: event.data.data });
    }
});

function injectSidePanel() {
    const existing = document.getElementById('zoho-ide-panel-container');
    if (existing) {
        existing.style.display = 'flex';
        return;
    }

    console.log('[ZohoIDE] Injecting Integrated Mode into top frame');

    const container = document.createElement('div');
    container.id = 'zoho-ide-panel-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 500px;
        height: 100vh;
        z-index: 2147483647;
        background: #1e1e1e;
        box-shadow: -5px 0 15px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: row;
        font-family: sans-serif;
    `;

    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'zoho-ide-resize-handle';
    resizeHandle.style.cssText = `
        width: 8px;
        cursor: ew-resize;
        background: #333;
        height: 100%;
        transition: background 0.2s;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    resizeHandle.innerHTML = '<div style="width:2px;height:20px;background:#666;border-radius:1px;"></div>';
    resizeHandle.onmouseover = () => { resizeHandle.style.background = '#007acc'; };
    resizeHandle.onmouseout = () => { resizeHandle.style.background = '#333'; };

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('ide.html?mode=sidepanel');
    iframe.style.cssText = `
        flex: 1;
        border: none;
        height: 100%;
        width: 100%;
    `;

    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close IDE';
    closeBtn.style.cssText = `
        position: absolute;
        left: -35px;
        top: 20px;
        width: 35px;
        height: 35px;
        background: #0067ff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 24px;
        border-radius: 6px 0 0 6px;
        box-shadow: -2px 2px 5px rgba(0,0,0,0.3);
        z-index: 2147483647;
    `;
    closeBtn.onclick = () => {
        container.style.display = 'none';
    };

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
