const fs = require('fs');

let content = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// Modify pull/push actions to use the currentContextHash
content = content.replace(
`        editor.addAction(pullAction);`,
`        editor.addAction(pullAction);` // Dummy replacement to keep cursor
);

content = content.replace(
`    function pullFromZoho() {
        const now = Date.now();
        if (now - lastActionTime < 800) return;
        lastActionTime = now;

        if (!isConnected) {
            log('Error', 'No Zoho tab connected. Please open a Zoho Deluge editor tab first.');
            return;
        }
        log('System', 'Pulling code...');
        ZohoRunner.pullFromZoho();
    }`,
`    function pullFromZoho() {
        const now = Date.now();
        if (now - lastActionTime < 800) return;
        lastActionTime = now;

        log('System', 'Pulling code...');
        ZohoRunner.pullFromZoho(currentContextHash);
    }`
);

content = content.replace(
`    function pushToZoho(triggerSave = false, triggerExecute = false) {
        const now = Date.now();
        if (now - lastActionTime < 1000) return;
        lastActionTime = now;

        if (!isConnected) {
            log('Error', 'No Zoho tab connected. Sync/Execute failed.');
            return;
        }

        // Check for errors
        const markers = monaco.editor.getModelMarkers({ resource: editor.getModel().uri });
        const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
        if (errors.length > 0) {
            log('Error', 'Fix syntax errors before pushing to Zoho.');
            showStatus('Push Blocked: Errors', 'error');
            return;
        }

        const code = editor.getValue();
        log('System', 'Pushing code...');
        ZohoRunner.pushToZoho(code, triggerSave, triggerExecute);
    }`,
`    function pushToZoho(triggerSave = false, triggerExecute = false) {
        const now = Date.now();
        if (now - lastActionTime < 1000) return;
        lastActionTime = now;

        // Check for errors
        const markers = monaco.editor.getModelMarkers({ resource: editor.getModel().uri });
        const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
        if (errors.length > 0) {
            log('Error', 'Fix syntax errors before pushing to Zoho.');
            showStatus('Push Blocked: Errors', 'error');
            return;
        }

        const code = editor.getValue();
        log('System', 'Pushing code...');
        ZohoRunner.pushToZoho(code, triggerSave, triggerExecute, currentContextHash);
    }`
);

// We should also replace the definition of functions if they are defined inside setupEventHandlers or globally
// Wait, they are defined globally (or at least scoped inside initEditor? No, they are hoisted or defined at root).
fs.writeFileSync('app/core/editor-controller.js', content);
console.log('Controller patched');
