// extension/host/content.js
// Host Content Script - Interacts with the Zoho Page and Bridge

(async () => {
    let MSG;
    try {
        const src = chrome.runtime.getURL('shared/protocol.js');
        const module = await import(src);
        MSG = module.MSG;
        console.log('[ZohoIDE] Protocol loaded:', MSG);
    } catch (e) {
        console.warn('[ZohoIDE] Protocol import failed, using fallback:', e);
        MSG = {
            EDITOR_INIT: 'editor:init',
            CODE_EXECUTE: 'editor:execute',
            CODE_SAVE: 'editor:save',
            CODE_PULL: 'editor:pull',
            SNIPPET_INSERT: 'snippet:insert',
            CRM_FIELD_FETCH: 'crm:get_fields'
        };
    }

    console.log('[ZohoIDE] Host Content Script Loaded');

    // 1. Inject the Bridge
    function injectBridge() {
        if (document.getElementById('zoho-deluge-bridge-modular')) return;
        const s = document.createElement('script');
        s.id = 'zoho-deluge-bridge-modular';
        s.src = chrome.runtime.getURL('extension/host/bridge/main.js'); s.type = 'module';
        const target = document.head || document.documentElement;
        if (target) {
            target.appendChild(s);
            console.log('[ZohoIDE] Bridge injected');
        }
    }

    // Initial injection
    injectBridge();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectBridge);
    }
    window.addEventListener('load', injectBridge);

    // 2. Listen for messages from the Client (Iframe or Extension Background)

    // Handler for messages
    const handleMessage = async (request, sendResponse) => {
        if (request.action === 'INJECT_SIDE_PANEL') {
            if (window === window.top) {
                injectSidePanel();
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'Not top frame' });
            }
            return;
        }

        // --- Bridge Interaction Logic ---

        // Helper to send to bridge and wait for response
        const sendToBridge = (action, payload = {}) => {
            return new Promise((resolve) => {
                const eventId = Math.random().toString(36).substring(2);
                const detail = { eventId, action, ...payload };

                console.debug('[ZohoIDE] [Host] -> [Bridge]', detail);

                const responseHandler = (event) => {
                    const data = event.detail;
                    if (data && data.eventId === eventId) {
                        console.debug('[ZohoIDE] [Bridge] -> [Host]', data);
                        window.removeEventListener('ZOHO_IDE_FROM_PAGE', responseHandler);
                        resolve(data.response);
                    }
                };

                window.addEventListener('ZOHO_IDE_FROM_PAGE', responseHandler);
                window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_EXT', { detail }));

                // Timeout
                setTimeout(() => {
                    window.removeEventListener('ZOHO_IDE_FROM_PAGE', responseHandler);
                    console.warn('[ZohoIDE] Bridge Timeout for:', action);
                    resolve({ error: 'Bridge Timeout' });
                }, 5000);
            });
        };

        // Orchestration for High-Level Protocol Messages
        if (request.action === MSG.CODE_EXECUTE) {
            // 1. Set Code
            if (request.code) {
                const setRes = await sendToBridge('SET_ZOHO_CODE', { code: request.code });
                if (!setRes.success) {
                    sendResponse({ success: false, error: 'Failed to set code' });
                    return;
                }
                // Short delay to ensure UI updates? Bridge handles some delay but...
                await new Promise(r => setTimeout(r, 200));
            }
            // 2. Execute
            const execRes = await sendToBridge('EXECUTE_ZOHO_CODE');
            sendResponse(execRes);
            return;
        }

        if (request.action === MSG.CODE_SAVE) {
            // 1. Set Code
            if (request.code) {
                const setRes = await sendToBridge('SET_ZOHO_CODE', { code: request.code });
                if (!setRes.success) {
                    sendResponse({ success: false, error: 'Failed to set code' });
                    return;
                }
                await new Promise(r => setTimeout(r, 200));
            }
            // 2. Save
            const saveRes = await sendToBridge('SAVE_ZOHO_CODE');
            sendResponse(saveRes);
            return;
        }

        if (request.action === MSG.EDITOR_INIT || request.action === MSG.CODE_PULL || request.action === 'GET_ZOHO_CODE') {
            // Just pull code
            const res = await sendToBridge('GET_ZOHO_CODE');
            sendResponse(res);
            return;
        }

        // Direct relay for legacy or other messages
        const relayActions = ['SET_ZOHO_CODE', 'SAVE_ZOHO_CODE', 'EXECUTE_ZOHO_CODE', 'PING', 'GET_ZOHO_CODE'];
        if (relayActions.includes(request.action)) {
            const res = await sendToBridge(request.action, request);
            sendResponse(res);
            return;
        }
    };

    // Listen from Background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request, sendResponse);
        return true; // Keep channel open for async response
    });

    // Listen from Iframe (postMessage)
    window.addEventListener('message', (event) => {
        // Filter messages? For now check if it has a type matching our protocol
        if (event.data && event.data.type && Object.values(MSG).includes(event.data.type)) {
            console.debug('[ZohoIDE] [Client] -> [Host]', event.data);

            // Wrap in a format handleMessage expects
            const request = {
                action: event.data.type,
                ...event.data.payload
            };

            handleMessage(request, (response) => {
                console.debug('[ZohoIDE] [Host] -> [Client]', { type: event.data.type + ':response', response });
                if (event.source) {
                    event.source.postMessage({
                        type: event.data.type + ':response',
                        payload: response
                    }, event.origin);
                }
            });
        }
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
        // Point to the new location of ide.html (now app/index.html)
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

})();
