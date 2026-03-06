const fs = require('fs');

let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// When `explorer:load-file` triggers, it sets `currentContextHash = file.id`.
// But wait! If the file is linked to a tab, we need to know the `chromeTabId`!
// And we need to automatically check if the connection is alive, or send `LINK_FILE_TO_TAB` to background if we know the `targetTabId`!

const explorerLoadLogic = `
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

                // Check if this file has a linked tab
                const dbTab = await db.workspace_tabs.where('fileId').equals(file.id).first();
                if (dbTab && dbTab.chromeTabId) {
                    // Try to re-establish connection explicitly to that tab
                    chrome.runtime.sendMessage({ action: 'LINK_FILE_TO_TAB', fileId: file.id, tabId: dbTab.chromeTabId }, (response) => {
                        if (response && response.success) {
                            showStatus("Reconnected to linked tab", "success");
                            // Update UI state
                            isConnected = true;
                            window.currentTargetTab = response;
                            document.getElementById('status-bar-connection').innerHTML = '<span class="status-indicator status-online"></span>Connected Local';
                        } else {
                            showStatus("Linked tab not found. Reopen it.", "warning");
                            isConnected = false;
                            window.currentTargetTab = null;
                            document.getElementById('status-bar-connection').innerHTML = '<span class="status-indicator status-offline"></span>Disconnected';
                        }
                    });
                } else {
                    isConnected = false;
                    window.currentTargetTab = null;
                    document.getElementById('status-bar-connection').innerHTML = '<span class="status-indicator status-offline"></span>Disconnected';
                }
            }
        });
`;

code = code.replace(/document\.addEventListener\('explorer:load-file', \(e\) => \{[\s\S]*?currentContextHash = file\.id;\s*const parts = currentContextHash\.split\('__'\);\s*if \(parts\.length >= 3\) \{[\s\S]*?\}\s*\}\);\s*\/\/ Handle Legacy File List/, explorerLoadLogic + "\n        // Handle Legacy File List");

fs.writeFileSync('app/core/editor-controller.js', code);
console.log("Patched editor-controller.js to re-link on file load");
