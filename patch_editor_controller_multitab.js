const fs = require('fs');
let code = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// Also explicitly set `targetTabId` when dispatching `pushToZoho` if `window.currentTargetTab` exists.
// `background.js` checks `request.targetTabId || (request.payload && request.payload.targetTabId)`!

const runnerPatch = `
function pushToZoho(triggerSave = false, triggerExecute = false) {
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
    const tabId = window.currentTargetTab ? window.currentTargetTab.id : null;
    ZohoRunner.pushToZoho(code, triggerSave, triggerExecute, currentContextHash, tabId);
}
`;

code = code.replace(/function pushToZoho\(triggerSave = false, triggerExecute = false\) \{[\s\S]*?ZohoRunner\.pushToZoho\(code, triggerSave, triggerExecute, currentContextHash\);\s*\}/, runnerPatch);

const pullPatch = `
function pullFromZoho() {
    log('Info', 'Pulling code from Zoho...');
    const tabId = window.currentTargetTab ? window.currentTargetTab.id : null;
    ZohoRunner.pullFromZoho(currentContextHash, tabId);
}
`;

code = code.replace(/function pullFromZoho\(\) \{\s*log\('Info', 'Pulling code from Zoho\.\.\.'\);\s*ZohoRunner\.pullFromZoho\(currentContextHash\);\s*\}/, pullPatch);

fs.writeFileSync('app/core/editor-controller.js', code);
console.log('Patched editor-controller.js to pass targetTabId');
