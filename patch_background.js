const fs = require('fs');

let content = fs.readFileSync('background.js', 'utf8');

// Replace findZohoTab to take contextHash or orgId to find specific tab
content = content.replace(
`function findZohoTab(callback) {
    chrome.tabs.query({}, (allTabs) => {
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));
        if (zohoTabs.length === 0) return callback(null);
        const activeZoho = zohoTabs.find(t => t.active);
        if (activeZoho) return callback(activeZoho);
        const editorTab = zohoTabs.find(t => t.url.includes('creator') || t.url.includes('crm') || t.url.includes('flow') || t.title.toLowerCase().includes('deluge'));
        callback(editorTab || zohoTabs[0]);
    });
}`,
`function findZohoTab(callback, targetContextHash = null) {
    chrome.tabs.query({}, (allTabs) => {
        const zohoTabs = allTabs.filter(t => t.url && isZohoUrl(t.url));
        if (zohoTabs.length === 0) return callback(null);

        // If a specific context is requested, we need to check tabs to find it
        if (targetContextHash) {
            // Ping tabs to find matching context
            let pendingChecks = zohoTabs.length;
            let foundTab = null;

            if (pendingChecks === 0) return callback(null);

            const checkDone = () => {
                pendingChecks--;
                if (pendingChecks === 0 && !foundTab) {
                    callback(null); // Not found
                }
            };

            for (const tab of zohoTabs) {
                chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
                    // Ignore error
                    let _ = chrome.runtime.lastError;
                    if (response && response.context && response.context.contextHash === targetContextHash && !foundTab) {
                        foundTab = tab;
                        callback(tab);
                    } else if (response && response.context && targetContextHash.includes(response.context.orgId) && !foundTab) {
                        // Fallback matching by orgId just in case functionName differs slightly
                        foundTab = tab;
                        callback(tab);
                    }
                    checkDone();
                });
            }
            return;
        }

        // Default behavior if no target context specified
        const activeZoho = zohoTabs.find(t => t.active);
        if (activeZoho) return callback(activeZoho);
        const editorTab = zohoTabs.find(t => t.url.includes('creator') || t.url.includes('crm') || t.url.includes('flow') || t.title.toLowerCase().includes('deluge'));
        callback(editorTab || zohoTabs[0]);
    });
}`
);

// We need to modify the message handler to accept targetContextHash
// And we need to modify OPEN_ZOHO_EDITOR to optionally take a tab id or find the tab by hash
content = content.replace(
`        if (targetTabId) {
            verifyConnection(targetTabId);
        } else {
            findZohoTab((tab) => {
                if (tab) verifyConnection(tab.id);
                else sendResponse({ connected: false });
            });
        }`,
`        if (targetTabId) {
            verifyConnection(targetTabId);
        } else {
            findZohoTab((tab) => {
                if (tab) verifyConnection(tab.id);
                else sendResponse({ connected: false });
            }, request.targetContextHash);
        }`
);

content = content.replace(
`        if (targetTabId) handleOpen(targetTabId);
        else findZohoTab(tab => tab && handleOpen(tab.id));
        sendResponse({ success: true });`,
`        if (targetTabId) handleOpen(targetTabId);
        else if (request.targetTabId) handleOpen(request.targetTabId);
        else findZohoTab(tab => tab && handleOpen(tab.id), request.targetContextHash);
        sendResponse({ success: true });`
);

content = content.replace(
`        if (targetTabId) handleAction(targetTabId);
        else findZohoTab(tab => tab ? handleAction(tab.id) : sendResponse({ error: 'No Zoho tab found' }));
        return true;`,
`        if (targetTabId) handleAction(targetTabId);
        else findZohoTab((tab) => {
            if (tab) {
                handleAction(tab.id);
                // Trigger auto focus after successfully handling action if requested
                if (request.autoFocus) {
                    chrome.tabs.update(tab.id, { active: true });
                    chrome.windows.update(tab.windowId, { focused: true });
                }
            } else {
                sendResponse({ error: 'No matching Zoho tab found for context' });
            }
        }, request.targetContextHash);
        return true;`
);

fs.writeFileSync('background.js', content);
console.log('Background script patched');
