const fs = require('fs');
let content = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// The functions are top level
content = content.replace(
`function pullFromZoho() {
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
`function pullFromZoho() {
    const now = Date.now();
    if (now - lastActionTime < 800) return;
    lastActionTime = now;

    log('System', 'Pulling code...');
    ZohoRunner.pullFromZoho(currentContextHash);
}`
);

content = content.replace(
`function pushToZoho(triggerSave = false, triggerExecute = false) {
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
`function pushToZoho(triggerSave = false, triggerExecute = false) {
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

fs.writeFileSync('app/core/editor-controller.js', content);
