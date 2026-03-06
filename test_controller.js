const fs = require('fs');

let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');
if (!code.includes("document.addEventListener('explorer:load-file', async (e) => {")) {
    console.log("My previous patch failed. Let's do it right.");

    const patch = `
        document.addEventListener('explorer:load-file', async (e) => {
            const file = e.detail;
            if (file) {
                if (file.code) editor.setValue(file.code);
                currentContextHash = file.id;

                const parts = currentContextHash.split('__');
                if (parts.length >= 3) {
                    currentContext = {
                        service: parts[0],
                        orgId: parts[1],
                        functionName: parts[2]
                    };
                }

                // Try to reconnect explicitly to its linked tab
                try {
                    const dbTab = await db.workspace_tabs.where('fileId').equals(file.id).first();
                    if (dbTab && dbTab.chromeTabId) {
                        chrome.runtime.sendMessage({ action: 'LINK_FILE_TO_TAB', fileId: file.id, tabId: dbTab.chromeTabId }, (response) => {
                            if (response && response.success) {
                                isConnected = true;
                                window.currentTargetTab = { id: dbTab.chromeTabId, tabId: dbTab.chromeTabId, ...response };
                                const connEl = document.getElementById('status-bar-connection');
                                if (connEl) connEl.innerHTML = '<span class="status-indicator status-online"></span>Connected Local';
                            } else {
                                isConnected = false;
                                window.currentTargetTab = null;
                                const connEl = document.getElementById('status-bar-connection');
                                if (connEl) connEl.innerHTML = '<span class="status-indicator status-offline"></span>Disconnected';
                            }
                        });
                    } else {
                        isConnected = false;
                        window.currentTargetTab = null;
                        const connEl = document.getElementById('status-bar-connection');
                        if (connEl) connEl.innerHTML = '<span class="status-indicator status-offline"></span>Disconnected';
                    }
                } catch(err) {
                    console.warn(err);
                }
            }
        });
`;

    code = code.replace(/document\.addEventListener\('explorer:load-file', \(e\) => \{[\s\S]*?\}\);/, patch);
    fs.writeFileSync('app/core/editor-controller.js', code);
    console.log("Forced patch.");
} else {
    console.log("Already patched.");
}
