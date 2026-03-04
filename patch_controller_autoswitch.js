const fs = require('fs');

let controller = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// The `checkConnection` interval is constantly comparing `response.context.contextHash` to `currentContextHash`
// If it differs, it triggers `handleContextSwitch`.
// This forces the user away from their explicitly chosen Explorer file just because they opened a Zoho tab in the background.

controller = controller.replace(
`                // Handle Context Hash
                if (response.context && response.context.contextHash) {
                    const newHash = response.context.contextHash;
                    if (newHash !== currentContextHash) {
                        if (newHash.includes("LOADING")) {
                            console.log("[ZohoIDE] Context loading, bypassing context switch...");
                            return;
                        }
                        console.log('[ZohoIDE] Context Switched:', newHash);
                        handleContextSwitch(response.context);
                    }
                }`,
`                // Handle Context Hash (Background tracking)
                if (response.context && response.context.contextHash) {
                    const newHash = response.context.contextHash;
                    if (newHash !== currentContextHash) {
                        if (newHash.includes("LOADING")) {
                            return;
                        }
                        // We detected a NEW context in the background.
                        // Do NOT force switch the active IDE editor to this file if the user is busy typing.
                        // Just silently register the workspace and file so it appears in the Explorer.
                        if (!currentContextHash) {
                            // Only auto-switch if the IDE is completely empty (initial load)
                            console.log('[ZohoIDE] Initial Context Switched:', newHash);
                            handleContextSwitch(response.context);
                        } else {
                            // Background discovery
                            silentlyDiscoverContext(response.context);
                        }
                    }
                }`
);

// Add silentlyDiscoverContext function
const newFunc = `
async function silentlyDiscoverContext(context) {
    try {
        await db.workspaces.put({
            id: context.orgId || context.service,
            orgId: context.orgId,
            service: context.service,
            name: context.orgId,
            lastAccessed: Date.now(),
            isArchived: false
        });

        // Ensure file exists in DB so it shows in explorer
        const file = await db.files.get(context.contextHash);
        if (!file) {
            await db.files.put({
                id: context.contextHash,
                workspaceId: context.orgId || context.service,
                fileName: context.functionName || 'untitled',
                code: '// Discovered code snippet',
                variables: [],
                lastSaved: Date.now(),
                isDirty: false
            });
        }
        if (explorer) explorer.refresh();
    } catch(e) {
        console.error('[ZohoIDE] DB Discovery Error:', e);
    }
}
`;

// Append function to the end if not already present
if (!controller.includes('function silentlyDiscoverContext')) {
    controller += newFunc;
}

fs.writeFileSync('app/core/editor-controller.js', controller);
console.log('Controller autoswitch patched');
